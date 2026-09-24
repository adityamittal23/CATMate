"""
CAT IQ Copilot - FastAPI Application Main Entry Point
Smart Operator Assistant for Caterpillar Heavy Machinery.
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure root directory is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.routers import (
    telemetry,
    tasks,
    predict,
    anomaly,
    incidents,
    maintenance,
    operators,
    dictionary
)
from data.loader import get_loader
from backend.ml_service import get_ml_service

app = FastAPI(
    title="Cat IQ Copilot API",
    description="Smart Operator Assistant API for CAT Heavy Machinery - Safety, Predictive Maintenance, ML Task Time Estimation, Anomaly Detection",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default: http://localhost:5173, plus flexible origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(telemetry.router)
app.include_router(tasks.router)
app.include_router(predict.router)
app.include_router(anomaly.router)
app.include_router(incidents.router)
app.include_router(maintenance.router)
app.include_router(operators.router)
app.include_router(dictionary.router)


@app.on_event("startup")
def startup_event():
    print("Initializing Cat IQ Copilot Backend...")
    loader = get_loader()
    print(f"Loaded dataset: {len(loader.df)} records across {len(loader.get_sites())} sites and {len(loader.machine_groups)} machines.")
    ml = get_ml_service()
    if ml.task_model_data:
        print("ML Models loaded successfully.")
    else:
        print("ML Models missing or need training.")


@app.get("/api/health")
def health_check():
    loader = get_loader()
    ml = get_ml_service()
    return {
        "status": "healthy",
        "app": "Cat IQ Copilot",
        "dataset_rows": len(loader.df),
        "data_dictionary_items": len(loader.get_data_dictionary()),
        "ml_models_ready": ml.task_model_data is not None and ml.anomaly_model_data is not None
    }


# Serve static frontend production build if available
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
        target_file = FRONTEND_DIST / full_path
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST / "index.html")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
