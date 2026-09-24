"""
CAT IQ Copilot - Operators & Training Hub Router
Operator profiles, safety leaderboard, and skill-gated training recommendations.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException

from data.loader import get_loader

router = APIRouter(prefix="/api/operators", tags=["operators"])

# Skill gating matrix
SKILL_TASK_GATING = {
    "Beginner": {
        "allowed_tasks": ["Material Loading", "Compaction"],
        "supervised_tasks": ["Earth Excavation", "Grading"],
        "restricted_tasks": ["Demolition", "Trenching"],
        "recommended_courses": [
            {"id": "CAT-101", "title": "Heavy Equipment Fundamentals & Cab Controls", "duration": "45 min", "level": "Beginner"},
            {"id": "CAT-102", "title": "Jobsite Proximity & Spotter Communication", "duration": "30 min", "level": "Beginner"},
            {"id": "CAT-103", "title": "Three-Point Contact & Seatbelt Compliance", "duration": "20 min", "level": "Beginner"}
        ]
    },
    "Intermediate": {
        "allowed_tasks": ["Material Loading", "Compaction", "Earth Excavation", "Grading", "Hauling"],
        "supervised_tasks": ["Trenching"],
        "restricted_tasks": ["Demolition"],
        "recommended_courses": [
            {"id": "CAT-201", "title": "Deep Trenching Safety & Soil Mechanics", "duration": "60 min", "level": "Intermediate"},
            {"id": "CAT-202", "title": "Grade Control 3D GPS Precision Operation", "duration": "50 min", "level": "Intermediate"},
            {"id": "CAT-203", "title": "Eco-Operating: Minimizing Idle Burn & Wear", "duration": "35 min", "level": "Intermediate"}
        ]
    },
    "Expert": {
        "allowed_tasks": ["Material Loading", "Compaction", "Earth Excavation", "Grading", "Hauling", "Trenching", "Demolition"],
        "supervised_tasks": [],
        "restricted_tasks": [],
        "recommended_courses": [
            {"id": "CAT-301", "title": "High-Reach Structural Demolition Mastery", "duration": "75 min", "level": "Expert"},
            {"id": "CAT-302", "title": "Fleet Lead: Telemetry Analytics & Crew Safety Mentorship", "duration": "60 min", "level": "Expert"}
        ]
    }
}


@router.get("")
def list_operators(
    site_id: Optional[str] = Query(None, description="Filter by site ID")
):
    loader = get_loader()
    return loader.get_operators(site_id=site_id)


@router.get("/leaderboard")
def get_safety_leaderboard(
    site_id: Optional[str] = Query(None, description="Filter by site ID")
):
    loader = get_loader()
    ops = loader.get_operators(site_id=site_id)
    # Sorted by safety score
    return {
        "total_operators": len(ops),
        "site_id": site_id or "All Sites",
        "leaderboard": ops
    }


@router.get("/{operator_id}")
def get_operator_profile(operator_id: str):
    loader = get_loader()
    op = loader.get_operator_detail(operator_id)
    if not op:
        raise HTTPException(status_code=404, detail=f"Operator {operator_id} not found")

    skill = op.get("skill", "Intermediate")
    gating = SKILL_TASK_GATING.get(skill, SKILL_TASK_GATING["Intermediate"])

    # Determine certification badges
    badges = [
        {"title": "OSHA CAT Certified", "icon": "shield-check", "earned": True},
        {"title": "Zero Seatbelt Infractions", "icon": "check-circle", "earned": op.get("seatbelt_compliance_pct", 0) >= 98.0},
        {"title": "Master Excavator", "icon": "award", "earned": skill == "Expert"},
        {"title": "Green Operator (Low Idle)", "icon": "leaf", "earned": op.get("excessive_idling_count", 0) < 5},
        {"title": "Safety Champion Top 10", "icon": "trophy", "earned": op.get("rank", 99) <= 10}
    ]

    return {
        "operator": op,
        "skill_gating": gating,
        "badges": badges,
        "instructor_slots": [
            {"id": "SLOT-1", "instructor": "Col. Rajesh Sharma (Master CAT Trainer)", "topic": "Hydraulic Pressure Optimization", "date": "Tomorrow, 10:00 AM", "available": True},
            {"id": "SLOT-2", "instructor": "Sarah Jenkins (Site Safety Specialist)", "topic": "Blindspot & Proximity Avoidance", "date": "Tomorrow, 02:30 PM", "available": True},
            {"id": "SLOT-3", "instructor": "Amitav Verma (Earthmoving Engineer)", "topic": "Trench Shoring & Extreme Terrains", "date": "Friday, 11:00 AM", "available": True}
        ]
    }
