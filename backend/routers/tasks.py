"""
CAT IQ Copilot - Tasks Router
Provides daily/scheduled task listings and deviation analytics across task types.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query
import pandas as pd

from data.loader import get_loader

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
def list_tasks(
    site_id: Optional[str] = Query(None, description="Filter by site ID"),
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    limit: int = Query(50, ge=1, le=200)
):
    loader = get_loader()
    tasks = loader.get_tasks(site_id=site_id, machine_id=machine_id, limit=limit)
    return {
        "count": len(tasks),
        "tasks": tasks
    }


@router.get("/deviation-stats")
def get_deviation_stats(
    site_id: Optional[str] = Query(None, description="Optional site filter")
):
    loader = get_loader()
    df = loader.df if not site_id else loader.df[loader.df["site_id"] == site_id]

    overall_counts = df["deviation_category"].value_counts().to_dict()
    
    # By task type
    by_task = []
    for t_type, group in df.groupby("task_type"):
        cat_counts = group["deviation_category"].value_counts().to_dict()
        by_task.append({
            "task_type": t_type,
            "total_tasks": len(group),
            "under_estimate": cat_counts.get("Under Estimate", 0),
            "on_target": cat_counts.get("On Target", 0),
            "over_estimate": cat_counts.get("Over Estimate", 0),
            "on_target_pct": round((cat_counts.get("On Target", 0) / len(group)) * 100, 1),
            "mean_estimated_min": round(float(group["estimated_time_min"].mean()), 1),
            "mean_actual_min": round(float(group["actual_time_min"].mean()), 1),
            "mean_deviation_min": round(float(group["deviation_min"].mean()), 1)
        })

    # By operator skill
    by_skill = []
    for skill, group in df.groupby("operator_skill"):
        cat_counts = group["deviation_category"].value_counts().to_dict()
        by_skill.append({
            "skill": skill,
            "total_tasks": len(group),
            "on_target_pct": round((cat_counts.get("On Target", 0) / len(group)) * 100, 1),
            "mean_actual_min": round(float(group["actual_time_min"].mean()), 1)
        })

    return {
        "overall_distribution": overall_counts,
        "by_task_type": sorted(by_task, key=lambda x: x["total_tasks"], reverse=True),
        "by_operator_skill": by_skill
    }
