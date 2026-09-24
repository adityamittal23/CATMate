"""
CAT IQ Copilot - Predict Router
Task time estimation powered by trained RandomForestRegressor with explainable AI heuristics.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.ml_service import get_ml_service

router = APIRouter(prefix="/api/predict", tags=["predict"])


class TaskPredictionRequest(BaseModel):
    task_type: str = Field(..., example="Earth Excavation")
    weather: str = Field(..., example="Sunny")
    terrain: str = Field(..., example="Flat")
    operator_skill: str = Field(..., example="Intermediate")
    operator_experience_yrs: float = Field(..., ge=0.0, le=40.0, example=5.0)
    machine_type: str = Field(..., example="Excavator")
    machine_age_yrs: float = Field(..., ge=0.0, le=25.0, example=3.0)
    temperature_c: float = Field(..., ge=-20.0, le=60.0, example=32.0)
    estimated_time_min: Optional[float] = Field(None, ge=1.0, le=400.0, example=60.0)


@router.post("/estimate")
def estimate_task_duration(req: TaskPredictionRequest):
    ml_service = get_ml_service()
    result = ml_service.predict_task_time(
        task_type=req.task_type,
        weather=req.weather,
        terrain=req.terrain,
        operator_skill=req.operator_skill,
        operator_experience_yrs=req.operator_experience_yrs,
        machine_type=req.machine_type,
        machine_age_yrs=req.machine_age_yrs,
        temperature_c=req.temperature_c,
        estimated_time_min=req.estimated_time_min
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/model-info")
def get_model_info():
    ml_service = get_ml_service()
    if not ml_service.task_model_data:
        raise HTTPException(status_code=503, detail="Task model not loaded")

    data = ml_service.task_model_data
    return {
        "model_type": "RandomForestRegressor",
        "n_estimators": 120,
        "features": data["feature_cols"],
        "metrics": data["metrics"],
        "top_feature_importances": data["top_importances"],
        "global_historical_mean_min": data["heuristics"]["global_mean"],
        "task_type_benchmarks": data["heuristics"]["task_type_means"],
        "weather_impact_factors": data["heuristics"]["weather_impact"],
        "terrain_impact_factors": data["heuristics"]["terrain_impact"],
        "skill_impact_factors": data["heuristics"]["skill_impact"]
    }
