"""
CAT IQ Copilot - Anomaly / Attention Needed Router
Scores fleet telemetry using Isolation Forest + rule heuristics and returns prioritized actionable feed.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from data.loader import get_loader
from backend.ml_service import get_ml_service

router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

# In-memory storage for anomaly resolutions during active session
RESOLVED_ANOMALIES = set()


class AcknowledgeRequest(BaseModel):
    anomaly_id: str
    action_taken: str  # e.g. "Tech Dispatched", "Acknowledged in Cab", "Load Reduced", "Inspection Scheduled"
    notes: Optional[str] = None


@router.get("/feed")
def get_attention_feed(
    site_id: Optional[str] = Query(None, description="Filter by site ID"),
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    min_severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM"),
    limit: int = Query(40, ge=5, le=100)
):
    loader = get_loader()
    ml_service = get_ml_service()

    # We evaluate recent telemetry sessions across machines
    target_machines = [machine_id] if machine_id else [m["machine_id"] for m in loader.get_machines(site_id)]
    
    feed_items = []
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "NORMAL": 3}

    for m_id in target_machines:
        # Check current snapshot of each machine
        snap = loader.get_machine_telemetry(m_id)
        if not snap:
            continue

        eval_res = ml_service.score_telemetry_row(snap)
        if eval_res["has_anomaly"] and eval_res["severity"] != "NORMAL":
            anom_id = f"ANOM-{snap['task_id']}-{m_id}"
            is_resolved = anom_id in RESOLVED_ANOMALIES

            # Format primary trigger summary
            primary_trigger = eval_res["triggers"][0] if eval_res["triggers"] else None

            feed_items.append({
                "anomaly_id": anom_id,
                "task_id": snap["task_id"],
                "task_date": snap["task_date"],
                "site_id": snap["site_id"],
                "machine_id": snap["machine_id"],
                "machine_type": snap["machine_type"],
                "operator_id": snap["operator_id"],
                "severity": eval_res["severity"],
                "primary_issue": primary_trigger["title"] if primary_trigger else "Anomaly Detected",
                "detail": primary_trigger["detail"] if primary_trigger else "",
                "all_triggers": eval_res["triggers"],
                "iso_score": eval_res["iso_score"],
                "is_ml_outlier": eval_res["is_ml_outlier"],
                "sensor_readings": {
                    "vibration_mm_s": snap.get("vibration_mm_s"),
                    "engine_temp_c": snap.get("engine_temp_c"),
                    "hydraulic_pressure_psi": snap.get("hydraulic_pressure_psi"),
                    "oil_pressure_psi": snap.get("oil_pressure_psi"),
                    "idling_time_min": snap.get("idling_time_min"),
                },
                "status": "Resolved" if is_resolved else "Action Needed",
                "recommended_action": (
                    "Inspect hydraulic lines & relief valves" if "Hydraulic" in str(primary_trigger) else
                    "Reduce throttle and clear radiator debris" if "Engine" in str(primary_trigger) else
                    "Inspect undercarriage track tension & loose mounts" if "Vibration" in str(primary_trigger) else
                    "Remind operator: shut off machine during standby" if "Idling" in str(primary_trigger) else
                    "Schedule mandatory preventive maintenance cycle" if "Maintenance" in str(primary_trigger) else
                    "Immediate cabin hazard review & operator contact"
                )
            })

    # Filter by severity if requested
    if min_severity and min_severity in severity_order:
        threshold = severity_order[min_severity]
        feed_items = [item for item in feed_items if severity_order.get(item["severity"], 3) <= threshold]

    # Sort by severity priority, then by date/task
    feed_items.sort(key=lambda x: (
        1 if x["status"] == "Resolved" else 0,
        severity_order.get(x["severity"], 3)
    ))

    return {
        "count": len(feed_items),
        "critical_count": sum(1 for f in feed_items if f["severity"] == "CRITICAL" and f["status"] != "Resolved"),
        "high_count": sum(1 for f in feed_items if f["severity"] == "HIGH" and f["status"] != "Resolved"),
        "feed": feed_items[:limit]
    }


@router.post("/acknowledge")
def acknowledge_anomaly(req: AcknowledgeRequest):
    RESOLVED_ANOMALIES.add(req.anomaly_id)
    return {
        "status": "success",
        "anomaly_id": req.anomaly_id,
        "action_taken": req.action_taken,
        "message": f"Anomaly {req.anomaly_id} marked as {req.action_taken}"
    }
