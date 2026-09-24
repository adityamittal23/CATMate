"""
CAT IQ Copilot - Machine Learning Training Script
Trains:
1. RandomForestRegressor for Task Time Estimation
   Features: task_type, weather, temperature_c, terrain, operator_skill,
             operator_experience_yrs, machine_type, machine_age_yrs
   Target: actual_time_min

2. IsolationForest for Telemetry Anomaly Detection
   Features: session_engine_hours, fuel_used_l, idling_time_min,
             vibration_mm_s, engine_temp_c, hydraulic_pressure_psi, oil_pressure_psi
"""

import os
import joblib
from pathlib import Path
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import sys
ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from data.loader import get_loader

MODELS_DIR = ML_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train_task_time_model(df: pd.DataFrame):
    print("\n--- Training Task Time Estimation Model (RandomForestRegressor) ---")
    categorical_features = ["task_type", "weather", "terrain", "operator_skill", "machine_type"]
    numerical_features = ["temperature_c", "operator_experience_yrs", "machine_age_yrs"]
    feature_cols = categorical_features + numerical_features
    target_col = "actual_time_min"

    clean_df = df.dropna(subset=feature_cols + [target_col, "estimated_time_min"]).copy()
    X = clean_df[feature_cols]
    y = clean_df[target_col]

    X_train, X_test, y_train, y_test, est_train, est_test = train_test_split(
        X, y, clean_df["estimated_time_min"], test_size=0.2, random_state=42
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numerical_features),
        ]
    )

    rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", rf)
    ])

    model_pipeline.fit(X_train, y_train)

    # Evaluation
    preds = model_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    # Compare against baseline estimated_time_min
    baseline_mae = mean_absolute_error(y_test, est_test)
    baseline_rmse = np.sqrt(mean_squared_error(y_test, est_test))
    baseline_r2 = r2_score(y_test, est_test)

    print(f"Test MAE: {mae:.2f} min (Baseline Planner MAE: {baseline_mae:.2f} min)")
    print(f"Test RMSE: {rmse:.2f} min (Baseline Planner RMSE: {baseline_rmse:.2f} min)")
    print(f"Test R²: {r2:.3f} (Baseline Planner R²: {baseline_r2:.3f})")

    # Compute baseline reference averages for explainable AI heuristics
    task_type_means = df.groupby("task_type")["actual_time_min"].mean().to_dict()
    weather_impact = (df.groupby("weather")["actual_time_min"].mean() - df["actual_time_min"].mean()).to_dict()
    skill_impact = (df.groupby("operator_skill")["actual_time_min"].mean() - df["actual_time_min"].mean()).to_dict()
    terrain_impact = (df.groupby("terrain")["actual_time_min"].mean() - df["actual_time_min"].mean()).to_dict()

    # Get feature importances
    encoder = model_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_cat_names = encoder.get_feature_names_out(categorical_features).tolist()
    all_feature_names = encoded_cat_names + numerical_features
    importances = model_pipeline.named_steps["regressor"].feature_importances_
    feat_imp = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)[:10]

    model_artifact = {
        "pipeline": model_pipeline,
        "feature_cols": feature_cols,
        "categorical_features": categorical_features,
        "numerical_features": numerical_features,
        "metrics": {
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2": round(float(r2), 3),
            "baseline_mae": round(float(baseline_mae), 2),
            "baseline_r2": round(float(baseline_r2), 3)
        },
        "top_importances": [{"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_imp],
        "heuristics": {
            "task_type_means": {k: round(float(v), 1) for k, v in task_type_means.items()},
            "weather_impact": {k: round(float(v), 1) for k, v in weather_impact.items()},
            "skill_impact": {k: round(float(v), 1) for k, v in skill_impact.items()},
            "terrain_impact": {k: round(float(v), 1) for k, v in terrain_impact.items()},
            "global_mean": round(float(df["actual_time_min"].mean()), 1)
        }
    }

    joblib.dump(model_artifact, MODELS_DIR / "task_time_model.pkl")
    print(f"Saved task time model to {MODELS_DIR / 'task_time_model.pkl'}")


def train_anomaly_model(df: pd.DataFrame):
    print("\n--- Training Telemetry Anomaly Detection (IsolationForest) ---")
    telemetry_cols = [
        "session_engine_hours",
        "fuel_used_l",
        "idling_time_min",
        "vibration_mm_s",
        "engine_temp_c",
        "hydraulic_pressure_psi",
        "oil_pressure_psi"
    ]

    clean_df = df[telemetry_cols].dropna().copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(clean_df)

    # 4% expected contamination in normal operational telemetry
    iso = IsolationForest(
        n_estimators=100,
        contamination=0.04,
        random_state=42,
        n_jobs=-1
    )
    iso.fit(X_scaled)

    # Test scoring
    scores = iso.decision_function(X_scaled)
    preds = iso.predict(X_scaled)
    anomaly_count = (preds == -1).sum()
    print(f"Fitted Isolation Forest. Flagged {anomaly_count}/{len(clean_df)} sessions ({anomaly_count/len(clean_df)*100:.1f}%) as telemetry outliers.")

    artifact = {
        "scaler": scaler,
        "model": iso,
        "features": telemetry_cols,
        "sensor_stats": {
            col: {
                "min": round(float(df[col].min()), 1),
                "q25": round(float(df[col].quantile(0.25)), 1),
                "median": round(float(df[col].median()), 1),
                "q75": round(float(df[col].quantile(0.75)), 1),
                "max": round(float(df[col].max()), 1),
                "mean": round(float(df[col].mean()), 1),
                "std": round(float(df[col].std()), 1)
            }
            for col in telemetry_cols
        }
    }

    joblib.dump(artifact, MODELS_DIR / "anomaly_model.pkl")
    print(f"Saved anomaly model to {MODELS_DIR / 'anomaly_model.pkl'}")


def main():
    loader = get_loader()
    df = loader.df
    train_task_time_model(df)
    train_anomaly_model(df)
    print("\nAll ML models successfully trained and serialized.")


if __name__ == "__main__":
    main()
