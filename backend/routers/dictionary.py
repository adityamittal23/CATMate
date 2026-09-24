"""
CAT IQ Copilot - Data Dictionary & Metadata Router
Exposes data dictionary from Excel sheet for tooltips/labels, plus sites and machines metadata.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter

from data.loader import get_loader

router = APIRouter(prefix="/api/meta", tags=["metadata"])


@router.get("/dictionary")
def get_dictionary():
    loader = get_loader()
    return loader.get_data_dictionary()


@router.get("/sites")
def get_sites():
    loader = get_loader()
    return loader.get_sites()


@router.get("/machines")
def get_machines(site_id: Optional[str] = None):
    loader = get_loader()
    return loader.get_machines(site_id=site_id)


@router.get("/config")
def get_config():
    loader = get_loader()
    df = loader.df
    return {
        "sites": loader.get_sites(),
        "machine_types": sorted(df["machine_type"].unique().tolist()),
        "task_types": sorted(df["task_type"].unique().tolist()),
        "weather_options": sorted(df["weather"].unique().tolist()),
        "terrain_options": sorted(df["terrain"].unique().tolist()),
        "skill_levels": ["Beginner", "Intermediate", "Expert"]
    }
