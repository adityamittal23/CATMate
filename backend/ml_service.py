"""
CAT IQ Copilot - ML Service
Loads saved models and exposes inference, explanations, and anomaly scoring.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

MODELS_DIR = ROOT_DIR / "ml" / "models"
TASK_MODEL_PATH = MODELS_DIR / "task_time_model.pkl"
ANOMALY_MODEL_PATH = MODELS_DIR / "anomaly_model.pkl"


class MLService:
    _instance: Optional["MLService"] = None

    def __init__(self):
        self.task_model_data = None
        self.anomaly_model_data = None
        self._load_models()

    def _load_models(self):
        if TASK_MODEL_PATH.exists():
            self.task_model_data = joblib.load(TASK_MODEL_PATH)
        else:
            print(f"Warning: {TASK_MODEL_PATH} not found. Please train models first.")

        if ANOMALY_MODEL_PATH.exists():
            self.anomaly_model_data = joblib.load(ANOMALY_MODEL_PATH)
        else:
            print(f"Warning: {ANOMALY_MODEL_PATH} not found.")

    def predict_task_time(
        self,
        task_type: str,
        weather: str,
        terrain: str,
        operator_skill: str,
        operator_experience_yrs: float,
        machine_type: str,
        machine_age_yrs: float,
        temperature_c: float,
        estimated_time_min: Optional[float] = None
    ) -> Dict[str, Any]:
        if not self.task_model_data:
            return {"error": "Task time model not initialized"}

        pipeline = self.task_model_data["pipeline"]
        heuristics = self.task_model_data["heuristics"]

        input_df = pd.DataFrame([{
            "task_type": task_type,
            "weather": weather,
            "terrain": terrain,
            "operator_skill": operator_skill,
            "operator_experience_yrs": operator_experience_yrs,
            "machine_type": machine_type,
            "machine_age_yrs": machine_age_yrs,
            "temperature_c": temperature_c
        }])

        pred_val = float(pipeline.predict(input_df)[0])
        pred_time = round(pred_val, 1)

        # Baseline comparison
        baseline = estimated_time_min if estimated_time_min is not None else heuristics["task_type_means"].get(task_type, 60.0)
        deviation = round(pred_time - baseline, 1)
        deviation_pct = round((deviation / baseline) * 100, 1) if baseline > 0 else 0.0

        # Construct Plain-English "Why"
        reasons = []
        w_imp = heuristics["weather_impact"].get(weather, 0.0)
        if abs(w_imp) >= 1.5:
            direction = "adds" if w_imp > 0 else "reduces"
            reasons.append(f"{weather} weather {direction} ~{abs(round(w_imp))} min")

        s_imp = heuristics["skill_impact"].get(operator_skill, 0.0)
        if abs(s_imp) >= 1.5:
            direction = "adds" if s_imp > 0 else "saves"
            reasons.append(f"{operator_skill} operator skill {direction} ~{abs(round(s_imp))} min")

        t_imp = heuristics["terrain_impact"].get(terrain, 0.0)
        if abs(t_imp) >= 1.5:
            direction = "adds" if t_imp > 0 else "eases operation by"
            reasons.append(f"{terrain} terrain {direction} ~{abs(round(t_imp))} min")

        if machine_age_yrs >= 7.0:
            reasons.append("Machine age (>7 yrs) slightly increases duty cycle duration")
        elif machine_age_yrs <= 2.0:
            reasons.append("Newer machine model operates at peak hydraulic speed")

        if not reasons:
            plain_why = f"Operation parameters for {task_type} in {weather} conditions align with standard baseline benchmarks."
        else:
            plain_why = f"{' + '.join(reasons)} based on historical fleet telemetry."

        return {
            "predicted_time_min": pred_time,
            "estimated_time_min": baseline,
            "expected_deviation_min": deviation,
            "expected_deviation_pct": deviation_pct,
            "deviation_category": "On Target" if abs(deviation_pct) <= 10.0 else ("Over Estimate" if deviation < 0 else "Under Estimate"),
            "confidence_band": {
                "lower_bound_min": round(max(10.0, pred_time - 4.8), 1),
                "upper_bound_min": round(pred_time + 4.8, 1)
            },
            "plain_english_why": plain_why,
            "historical_task_mean": heuristics["task_type_means"].get(task_type, 60.0),
            "factors": {
                "weather_impact_min": round(w_imp, 1),
                "skill_impact_min": round(s_imp, 1),
                "terrain_impact_min": round(t_imp, 1)
            }
        }

    def score_telemetry_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combines IsolationForest ML outlier score with hard safety/telemetry domain rules.
        """
        reasons: List[Dict[str, Any]] = []
        severity = "NORMAL"
        iso_score = 0.0
        is_ml_outlier = False

        # 1. Isolation Forest Scoring
        if self.anomaly_model_data:
            try:
                features = self.anomaly_model_data["features"]
                row_dict = {f: [row.get(f, 0.0) or 0.0] for f in features}
                features_df = pd.DataFrame(row_dict)
                scaled = self.anomaly_model_data["scaler"].transform(features_df)
                raw_score = self.anomaly_model_data["model"].decision_function(scaled)[0]
                iso_score = round(float(raw_score), 3)
                is_ml_outlier = bool(self.anomaly_model_data["model"].predict(scaled)[0] == -1)
                if is_ml_outlier:
                    reasons.append({
                        "source": "ML_ISOLATION_FOREST",
                        "title": "Multivariate Telemetry Outlier",
                        "detail": f"Unusual combined sensor pattern detected (anomaly score: {iso_score})",
                        "severity": "HIGH"
                    })
            except Exception:
                pass

        # 2. Domain Rule Checks
        # Excessive Idling
        idling_min = row.get("idling_time_min", 0) or 0
        if row.get("excessive_idling_flag") or idling_min > 25:
            reasons.append({
                "source": "RULE_EXCESSIVE_IDLING",
                "title": "Excessive Idling Detected",
                "detail": f"Machine idled for {idling_min} min (>25% of task engine run time). Fuel and carbon waste warning.",
                "severity": "MEDIUM"
            })

        # Vibration
        vib = row.get("vibration_mm_s", 0) or 0
        if vib >= 6.8:
            reasons.append({
                "source": "RULE_HIGH_VIBRATION",
                "title": "Severe Vibration Alert",
                "detail": f"Vibration reached {vib} mm/s (Threshold: 6.5 mm/s). Risk of mechanical wear or terrain shock.",
                "severity": "CRITICAL"
            })
        elif vib >= 5.5:
            reasons.append({
                "source": "RULE_ELEVATED_VIBRATION",
                "title": "Elevated Vibration Warning",
                "detail": f"Vibration measured at {vib} mm/s. Monitor ground hardness and track/tire contact.",
                "severity": "MEDIUM"
            })

        # Engine Temperature
        eng_temp = row.get("engine_temp_c", 0) or 0
        if eng_temp >= 106:
            reasons.append({
                "source": "RULE_ENGINE_OVERHEAT",
                "title": "Engine Thermal Limit Warning",
                "detail": f"Engine coolant temperature at {eng_temp}°C (Critical: >105°C). Reduce heavy load immediately.",
                "severity": "CRITICAL"
            })
        elif eng_temp >= 100:
            reasons.append({
                "source": "RULE_ENGINE_WARM",
                "title": "Engine Temp High",
                "detail": f"Engine temp at {eng_temp}°C. Verify radiator airflow.",
                "severity": "MEDIUM"
            })

        # Hydraulic Pressure
        hyd = row.get("hydraulic_pressure_psi", 0) or 0
        if hyd > 3800:
            reasons.append({
                "source": "RULE_HYDRAULIC_HIGH",
                "title": "Hydraulic Overpressure",
                "detail": f"Hydraulic pressure at {hyd} PSI (Upper limit: 3750 PSI). Relief valve or pump bypass check required.",
                "severity": "HIGH"
            })
        elif hyd < 2650 and hyd > 0:
            reasons.append({
                "source": "RULE_HYDRAULIC_LOW",
                "title": "Hydraulic Pressure Drop",
                "detail": f"Hydraulic pressure dropped to {hyd} PSI (Min spec: 2700 PSI). Check fluid level & pump line.",
                "severity": "HIGH"
            })

        # Oil Pressure
        oil = row.get("oil_pressure_psi", 0) or 0
        if oil < 42.0 and oil > 0:
            reasons.append({
                "source": "RULE_OIL_PRESSURE_LOW",
                "title": "Low Engine Oil Pressure",
                "detail": f"Oil pressure at {oil} PSI (Critical min: 42 PSI). Potential lubrication deficit.",
                "severity": "CRITICAL"
            })

        # Maintenance Overdue
        if row.get("maintenance_overdue_flag"):
            reasons.append({
                "source": "RULE_PM_OVERDUE",
                "title": "Preventive Maintenance Overdue",
                "detail": f"Less than 15 hours remaining until required PM service cycle. Schedule maintenance immediate window.",
                "severity": "HIGH"
            })

        # Safety / Proximity / Seatbelt
        if row.get("proximity_alert_triggered") == "Yes":
            reasons.append({
                "source": "RULE_PROXIMITY_HAZARD",
                "title": "Proximity Sensor Breach",
                "detail": "Obstacle, personnel, or secondary equipment breached cab safety zone.",
                "severity": "CRITICAL"
            })

        if row.get("seatbelt_status") == "Unfastened":
            reasons.append({
                "source": "RULE_SEATBELT_UNFASTENED",
                "title": "Seatbelt Safety Violation",
                "detail": "Operator seatbelt sensor unfastened during machine operation.",
                "severity": "HIGH"
            })

        # Calculate overall severity
        has_critical = any(r["severity"] == "CRITICAL" for r in reasons)
        has_high = any(r["severity"] == "HIGH" for r in reasons)
        has_medium = any(r["severity"] == "MEDIUM" for r in reasons)

        if has_critical:
            severity = "CRITICAL"
        elif has_high:
            severity = "HIGH"
        elif has_medium:
            severity = "MEDIUM"
        else:
            severity = "NORMAL"

        return {
            "severity": severity,
            "has_anomaly": len(reasons) > 0,
            "anomaly_count": len(reasons),
            "iso_score": iso_score,
            "is_ml_outlier": is_ml_outlier,
            "triggers": reasons
        }


def get_ml_service() -> MLService:
    if MLService._instance is None:
        MLService._instance = MLService()
    return MLService._instance
