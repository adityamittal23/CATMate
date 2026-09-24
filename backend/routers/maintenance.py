"""
CAT IQ Copilot - Predictive Maintenance Router
Grounded in real dataset maintenance columns: hours remaining, wear indicators, inspection tracking.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
import pandas as pd

from data.loader import get_loader

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/machine/{machine_id}")
def get_machine_maintenance(machine_id: str):
    loader = get_loader()
    snap = loader.get_machine_telemetry(machine_id)
    if not snap:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    m_type = snap.get("machine_type", "")
    is_tracked = m_type in ["Excavator", "Track-Type Tractor"]
    
    # Wear indicator details
    wear_data = {}
    if is_tracked:
        wear_pct = snap.get("undercarriage_wear_pct") or 0.0
        wear_status = "Good"
        if wear_pct >= 80:
            wear_status = "Critical Wear"
        elif wear_pct >= 60:
            wear_status = "Moderate Wear"
        
        wear_data = {
            "type": "undercarriage",
            "metric_name": "Undercarriage Track Wear",
            "current_value": wear_pct,
            "unit": "%",
            "status": wear_status,
            "threshold_warning": 65,
            "threshold_critical": 80,
            "life_remaining_pct": max(0, round(100 - wear_pct, 1)),
            "recommended_action": "Bushing rotation & pin turn advised" if wear_pct > 65 else "Track tension within Caterpillar spec"
        }
    else:
        tread_mm = snap.get("tire_tread_mm") or 0.0
        wear_status = "Good"
        if tread_mm <= 12:
            wear_status = "Replace Soon"
        elif tread_mm <= 20:
            wear_status = "Fair"

        # Typically new heavy tire tread is ~45-50 mm, minimum safe is 10 mm
        life_pct = min(100.0, max(0.0, round((tread_mm / 45.0) * 100, 1)))
        wear_data = {
            "type": "tire",
            "metric_name": "Tire Tread Depth",
            "current_value": tread_mm,
            "unit": "mm",
            "status": wear_status,
            "threshold_warning": 18,
            "threshold_critical": 12,
            "life_remaining_pct": life_pct,
            "recommended_action": "Tire replacement scheduled on next cycle" if tread_mm < 15 else "Tire inflation & wear pattern normal"
        }

    # Maintenance hours countdown
    hours_since = snap.get("hours_since_last_maintenance", 0) or 0
    next_due_hrs = snap.get("next_maintenance_due_hours", 0) or 0
    cycle_hrs = snap.get("maintenance_cycle_hours", 250) or 250
    overdue = bool(snap.get("maintenance_overdue_flag", False)) or next_due_hrs < 15

    # Inspection details
    insp_result = snap.get("last_inspection_result", "Pass")
    last_insp = snap.get("last_inspection_date")
    next_insp = snap.get("next_inspection_due_date")

    # Days to inspection calculation
    days_to_insp = None
    if next_insp:
        try:
            today = pd.to_datetime("2026-09-23")
            target = pd.to_datetime(next_insp)
            days_to_insp = int((target - today).days)
        except Exception:
            days_to_insp = 14

    return {
        "machine_id": machine_id,
        "site_id": snap.get("site_id"),
        "machine_type": m_type,
        "machine_model": snap.get("machine_model"),
        "machine_age_yrs": snap.get("machine_age_yrs"),
        "total_engine_hours": snap.get("total_engine_hours_at_task"),
        "maintenance_cycle_hours": cycle_hrs,
        "maintenance_cycles_completed": snap.get("maintenance_cycles_completed"),
        "hours_since_last_maintenance": hours_since,
        "next_maintenance_due_hours": next_due_hrs,
        "maintenance_overdue_flag": overdue,
        "overdue_urgency": "CRITICAL" if overdue or next_due_hrs <= 5 else ("WARNING" if next_due_hrs <= 25 else "HEALTHY"),
        "wear_indicator": wear_data,
        "inspection": {
            "last_inspection_date": last_insp,
            "last_inspection_result": insp_result,
            "next_inspection_due_date": next_insp,
            "days_until_next_inspection": days_to_insp,
            "inspection_status": "Overdue" if days_to_insp and days_to_insp < 0 else "Scheduled"
        }
    }


@router.get("/overview")
def get_fleet_maintenance_overview(
    site_id: Optional[str] = Query(None, description="Optional site filter")
):
    loader = get_loader()
    machines = loader.get_machines(site_id)
    
    total = len(machines)
    overdue_count = 0
    warning_count = 0
    healthy_count = 0

    machine_summaries = []
    for m in machines:
        snap = loader.get_machine_telemetry(m["machine_id"])
        if not snap:
            continue
        due_hrs = snap.get("next_maintenance_due_hours", 50) or 50
        is_overdue = snap.get("maintenance_overdue_flag", False) or due_hrs < 15
        
        if is_overdue:
            overdue_count += 1
            status = "Overdue"
        elif due_hrs <= 35:
            warning_count += 1
            status = "Due Soon"
        else:
            healthy_count += 1
            status = "Healthy"

        machine_summaries.append({
            "machine_id": m["machine_id"],
            "machine_type": m["machine_type"],
            "machine_model": m["machine_model"],
            "site_id": m["site_id"],
            "due_hours": due_hrs,
            "status": status,
            "last_inspection": snap.get("last_inspection_result", "Pass")
        })

    return {
        "site_id": site_id or "All Sites",
        "total_machines": total,
        "overdue_count": overdue_count,
        "warning_count": warning_count,
        "healthy_count": healthy_count,
        "fleet_health_pct": round((healthy_count / total) * 100, 1) if total > 0 else 100,
        "machines": machine_summaries
    }
