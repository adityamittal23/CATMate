"""
CAT IQ Copilot - Telemetry Router
Provides live telemetry snapshots, replay controls, historical time-series, and sensor health bands.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from data.loader import get_loader
from backend.ml_service import get_ml_service

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class PlaybackRequest(BaseModel):
    machine_id: str
    action: str  # 'next', 'prev', 'set_index', 'reset_latest', 'reset_first'
    index: Optional[int] = None


def attach_health_status(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """Attach normal/warning/danger bands and status for sensor health strip."""
    temp = telemetry.get("engine_temp_c") or 0.0
    vib = telemetry.get("vibration_mm_s") or 0.0
    hyd = telemetry.get("hydraulic_pressure_psi") or 0.0
    oil = telemetry.get("oil_pressure_psi") or 0.0

    # Engine Temp bands: normal <= 98, warning 98-105, critical > 105
    temp_status = "NORMAL"
    if temp > 105:
        temp_status = "CRITICAL"
    elif temp >= 98:
        temp_status = "WARNING"

    # Hydraulic Pressure bands: normal 2800-3600, warning 2650-2800 or 3600-3800, critical < 2650 or > 3800
    hyd_status = "NORMAL"
    if hyd < 2650 or hyd > 3800:
        hyd_status = "CRITICAL"
    elif hyd < 2800 or hyd > 3600:
        hyd_status = "WARNING"

    # Oil Pressure bands: normal 48-62, warning 42-48 or 62-68, critical < 42 or > 68
    oil_status = "NORMAL"
    if oil < 42 or oil > 68:
        oil_status = "CRITICAL"
    elif oil < 48 or oil > 62:
        oil_status = "WARNING"

    # Vibration bands: normal < 5.5, warning 5.5-6.8, critical >= 6.8
    vib_status = "NORMAL"
    if vib >= 6.8:
        vib_status = "CRITICAL"
    elif vib >= 5.5:
        vib_status = "WARNING"

    telemetry["health_bands"] = {
        "engine_temp": {
            "value": temp,
            "unit": "°C",
            "status": temp_status,
            "min_normal": 80,
            "max_normal": 98,
            "warning_threshold": 105,
            "label": "Engine Coolant Temp"
        },
        "hydraulic_pressure": {
            "value": hyd,
            "unit": "PSI",
            "status": hyd_status,
            "min_normal": 2800,
            "max_normal": 3600,
            "warning_threshold": 3800,
            "label": "Hydraulic System Pressure"
        },
        "oil_pressure": {
            "value": oil,
            "unit": "PSI",
            "status": oil_status,
            "min_normal": 48,
            "max_normal": 62,
            "warning_threshold": 42,
            "label": "Engine Oil Pressure"
        },
        "vibration": {
            "value": vib,
            "unit": "mm/s",
            "status": vib_status,
            "min_normal": 0.0,
            "max_normal": 5.5,
            "warning_threshold": 6.8,
            "label": "Tri-Axial Cab Vibration"
        }
    }
    return telemetry


@router.get("/snapshot")
def get_snapshot(
    machine_id: str = Query(..., description="Machine asset ID, e.g. M1001"),
    step_offset: Optional[int] = Query(None, description="Offset to step replay forward (+1) or backward (-1)")
):
    loader = get_loader()
    data = loader.get_machine_telemetry(machine_id, step_offset=step_offset)
    if not data:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    # Score telemetry with ML & domain rules
    ml_service = get_ml_service()
    anomaly_eval = ml_service.score_telemetry_row(data)
    data["anomaly_evaluation"] = anomaly_eval

    # Attach health strip metrics
    data = attach_health_status(data)

    return data


@router.post("/playback")
def control_playback(req: PlaybackRequest):
    loader = get_loader()
    m_id = req.machine_id
    if m_id not in loader.machine_groups:
        raise HTTPException(status_code=404, detail=f"Machine {m_id} not found")

    total_records = len(loader.machine_groups[m_id])
    if req.action == "next":
        return get_snapshot(m_id, step_offset=1)
    elif req.action == "prev":
        return get_snapshot(m_id, step_offset=-1)
    elif req.action == "reset_latest":
        return loader.set_machine_playback_index(m_id, total_records - 1)
    elif req.action == "reset_first":
        return loader.set_machine_playback_index(m_id, 0)
    elif req.action == "set_index" and req.index is not None:
        return loader.set_machine_playback_index(m_id, req.index)
    else:
        raise HTTPException(status_code=400, detail="Invalid playback action")


@router.get("/history")
def get_history(
    machine_id: str = Query(..., description="Machine asset ID"),
    limit: int = Query(25, ge=5, le=100)
):
    loader = get_loader()
    history = loader.get_machine_history(machine_id, limit=limit)
    return {
        "machine_id": machine_id,
        "count": len(history),
        "history": history
    }
