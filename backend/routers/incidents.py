"""
CAT IQ Copilot - Safety Incidents Router
Filterable incident history seeded from safety_alert_triggered rows with in-cab incident reporting.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from data.loader import get_loader

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


class NewIncidentRequest(BaseModel):
    task_id: Optional[str] = "LIVE-CAB-LOG"
    site_id: str
    machine_id: str
    machine_type: str
    operator_id: str
    type: str = Field(..., example="Proximity Hazard Alert")
    severity: str = Field(..., example="High")  # Critical, High, Medium, Low
    notes: str = Field(..., example="Excavator bucket swung within 2 meters of trench spotter.")
    proximity_alert: bool = False
    seatbelt_status: str = "Fastened"


@router.get("")
def list_incidents(
    site_id: Optional[str] = Query(None, description="Filter by site ID"),
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    operator_id: Optional[str] = Query(None, description="Filter by operator ID"),
    severity: Optional[str] = Query(None, description="Critical, High, Medium, Low"),
    limit: int = Query(50, ge=1, le=200)
):
    loader = get_loader()
    items = loader.incidents_log

    if site_id:
        items = [i for i in items if i.get("site_id") == site_id]
    if machine_id:
        items = [i for i in items if i.get("machine_id") == machine_id]
    if operator_id:
        items = [i for i in items if i.get("operator_id") == operator_id]
    if severity:
        items = [i for i in items if i.get("severity", "").lower() == severity.lower()]

    return {
        "count": len(items),
        "total_in_database": len(loader.incidents_log),
        "incidents": items[:limit]
    }


@router.post("")
def report_incident(req: NewIncidentRequest):
    loader = get_loader()
    new_inc = loader.add_incident(req.model_dump())
    return {
        "status": "success",
        "message": f"Incident {new_inc['incident_id']} logged successfully",
        "incident": new_inc
    }
