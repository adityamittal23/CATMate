"""
CAT IQ Copilot - Data Loader Module
Single source of truth for both ML training and API runtime.
Reads both sheets: 'dataset' and 'data_dictionary' from cat_operator_task_dataset.xlsx.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np

# Locate Excel file
DATA_DIR = Path(__file__).resolve().parent
ROOT_DIR = DATA_DIR.parent
EXCEL_CANDIDATES = [
    DATA_DIR / "cat_operator_task_dataset.xlsx",
    ROOT_DIR / "cat_operator_task_dataset.xlsx",
]

EXCEL_FILE = next((p for p in EXCEL_CANDIDATES if p.exists()), None)
if not EXCEL_FILE:
    raise FileNotFoundError(f"Could not locate cat_operator_task_dataset.xlsx in {[str(p) for p in EXCEL_CANDIDATES]}")


class CatDataLoader:
    _instance: Optional["CatDataLoader"] = None

    def __init__(self, excel_path: Path = EXCEL_FILE):
        self.excel_path = excel_path
        self._load_data()
        self._compute_operator_metrics()
        self._init_in_memory_incidents()
        # Per-machine replay index tracker
        self._machine_playback_indices: Dict[str, int] = {}

    def _load_data(self):
        # Load data dictionary
        self.dict_df = pd.read_excel(self.excel_path, sheet_name="data_dictionary")
        # Map column name to description
        self.data_dict: Dict[str, str] = {}
        for _, row in self.dict_df.iterrows():
            col_name = str(row.iloc[0]).strip()
            desc = str(row.iloc[1]).strip()
            self.data_dict[col_name] = desc

        # Load main dataset
        self.df = pd.read_excel(self.excel_path, sheet_name="dataset")
        # Sort chronologically
        self.df["task_date"] = pd.to_datetime(self.df["task_date"])
        if "last_maintenance_date" in self.df.columns:
            self.df["last_maintenance_date"] = pd.to_datetime(self.df["last_maintenance_date"])
        if "last_inspection_date" in self.df.columns:
            self.df["last_inspection_date"] = pd.to_datetime(self.df["last_inspection_date"])
        if "next_inspection_due_date" in self.df.columns:
            self.df["next_inspection_due_date"] = pd.to_datetime(self.df["next_inspection_due_date"])

        self.df = self.df.sort_values(by=["task_date", "task_id"]).reset_index(drop=True)
        # Pre-group by machine_id sorted by date for live feed replay
        self.machine_groups: Dict[str, pd.DataFrame] = {
            m_id: group.sort_values(by=["task_date", "task_id"]).reset_index(drop=True)
            for m_id, group in self.df.groupby("machine_id")
        }

    def _compute_operator_metrics(self):
        """Compute rolling safety scores and statistics per operator."""
        op_stats = []
        for op_id, op_df in self.df.groupby("operator_id"):
            total_sessions = len(op_df)
            safety_alerts = (op_df["safety_alert_triggered"] == "Yes").sum()
            prox_alerts = (op_df["proximity_alert_triggered"] == "Yes").sum()
            unfastened = (op_df["seatbelt_status"] == "Unfastened").sum()
            fastened = total_sessions - unfastened
            excessive_idling = op_df["excessive_idling_flag"].sum()

            # Safety score (0 to 100):
            # 50% seatbelt compliance rate
            # 35% alert-free rate
            # 15% proximity-free rate
            seatbelt_pct = (fastened / total_sessions) if total_sessions > 0 else 1.0
            alert_free_pct = ((total_sessions - safety_alerts) / total_sessions) if total_sessions > 0 else 1.0
            prox_free_pct = ((total_sessions - prox_alerts) / total_sessions) if total_sessions > 0 else 1.0

            safety_score = round((seatbelt_pct * 50) + (alert_free_pct * 35) + (prox_free_pct * 15), 1)

            skill = op_df["operator_skill"].iloc[-1]
            exp = float(op_df["operator_experience_yrs"].iloc[-1])
            sites = list(op_df["site_id"].unique())
            machines = list(op_df["machine_id"].unique())

            op_stats.append({
                "operator_id": op_id,
                "skill": skill,
                "experience_yrs": exp,
                "total_sessions": int(total_sessions),
                "safety_score": float(safety_score),
                "seatbelt_compliance_pct": round(seatbelt_pct * 100, 1),
                "safety_alerts_count": int(safety_alerts),
                "proximity_alerts_count": int(prox_alerts),
                "unfastened_count": int(unfastened),
                "excessive_idling_count": int(excessive_idling),
                "primary_site": sites[0] if sites else "Unknown",
                "assigned_machines": machines[:3]
            })

        self.operator_metrics_df = pd.DataFrame(op_stats).sort_values(by="safety_score", ascending=False).reset_index(drop=True)
        # Assign rank
        self.operator_metrics_df["rank"] = range(1, len(self.operator_metrics_df) + 1)

    def _init_in_memory_incidents(self):
        """Seed initial incidents from dataset where safety_alert_triggered == 'Yes'."""
        incidents = []
        alert_rows = self.df[self.df["safety_alert_triggered"] == "Yes"].copy()
        
        types = [
            "Proximity Violation",
            "Trench Edge Stability Warning",
            "Overload Warning",
            "Rapid Hydraulic Spike",
            "Sudden Cab Vibration Warning",
            "Seatbelt Disengaged in Motion",
            "Blindspot Hazard Detected"
        ]

        for i, (_, row) in enumerate(alert_rows.iterrows()):
            # Assign realistic incident metadata based on row details
            inc_type = types[i % len(types)]
            if row.get("proximity_alert_triggered") == "Yes":
                inc_type = "Proximity Hazard Alert"
            elif row.get("seatbelt_status") == "Unfastened":
                inc_type = "Seatbelt Non-Compliance"
            elif row.get("vibration_mm_s", 0) > 6.0:
                inc_type = "Excessive Vibration Hazard"
            elif row.get("engine_temp_c", 0) > 105.0:
                inc_type = "Engine Thermal Warning"

            severity = "High" if (row.get("proximity_alert_triggered") == "Yes" or row.get("vibration_mm_s", 0) > 7.0) else "Medium"
            if row.get("seatbelt_status") == "Unfastened" and row.get("proximity_alert_triggered") == "Yes":
                severity = "Critical"

            incidents.append({
                "incident_id": f"INC-{row['task_id']}",
                "task_id": row["task_id"],
                "task_date": str(row["task_date"])[:10],
                "site_id": row["site_id"],
                "machine_id": row["machine_id"],
                "machine_type": row["machine_type"],
                "operator_id": row["operator_id"],
                "type": inc_type,
                "severity": severity,
                "status": "Logged",
                "notes": f"Safety alert recorded during {row['task_type']} session. Weather: {row['weather']}, Terrain: {row['terrain']}.",
                "proximity_alert": row.get("proximity_alert_triggered") == "Yes",
                "seatbelt_status": row.get("seatbelt_status", "Fastened")
            })

        self.incidents_log: List[Dict[str, Any]] = incidents

    # === Accessor Methods ===

    def get_data_dictionary(self) -> Dict[str, str]:
        return self.data_dict

    def get_sites(self) -> List[str]:
        return sorted(self.df["site_id"].unique().tolist())

    def get_machines(self, site_id: Optional[str] = None) -> List[Dict[str, Any]]:
        subset = self.df if not site_id else self.df[self.df["site_id"] == site_id]
        machines = []
        for m_id, group in subset.groupby("machine_id"):
            latest = group.iloc[-1]
            machines.append({
                "machine_id": m_id,
                "site_id": latest["site_id"],
                "machine_type": latest["machine_type"],
                "machine_model": latest["machine_model"],
                "machine_age_yrs": float(latest["machine_age_yrs"]),
                "last_operator_id": latest["operator_id"],
                "total_engine_hours": float(latest["total_engine_hours_at_task"]),
                "maintenance_overdue": bool(latest["maintenance_overdue_flag"]),
                "last_inspection_result": str(latest["last_inspection_result"])
            })
        return sorted(machines, key=lambda m: m["machine_id"])

    def get_operators(self, site_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if site_id:
            matching_ops = self.df[self.df["site_id"] == site_id]["operator_id"].unique()
            res = self.operator_metrics_df[self.operator_metrics_df["operator_id"].isin(matching_ops)]
        else:
            res = self.operator_metrics_df
        return res.to_dict(orient="records")

    def get_operator_detail(self, operator_id: str) -> Optional[Dict[str, Any]]:
        m = self.operator_metrics_df[self.operator_metrics_df["operator_id"] == operator_id]
        if m.empty:
            return None
        return m.iloc[0].to_dict()

    def get_machine_telemetry(self, machine_id: str, step_offset: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Returns snapshot telemetry for machine_id.
        Allows advancing the replay index to simulate live streaming of dataset rows.
        """
        if machine_id not in self.machine_groups:
            # Fallback to first machine or None
            if not self.machine_groups:
                return None
            machine_id = next(iter(self.machine_groups))

        m_group = self.machine_groups[machine_id]
        total_rows = len(m_group)
        current_idx = self._machine_playback_indices.get(machine_id, total_rows - 1)

        if step_offset is not None:
            current_idx = max(0, min(total_rows - 1, current_idx + step_offset))
            self._machine_playback_indices[machine_id] = current_idx

        row = m_group.iloc[current_idx].to_dict()
        
        # Clean up types for JSON serialization
        clean_row = {}
        for k, v in row.items():
            if pd.isna(v):
                clean_row[k] = None
            elif isinstance(v, (pd.Timestamp, pd.Period)):
                clean_row[k] = str(v)[:10]
            elif isinstance(v, (np.integer, int)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, float)):
                clean_row[k] = round(float(v), 2)
            elif isinstance(v, (bool, np.bool_)):
                clean_row[k] = bool(v)
            else:
                clean_row[k] = v

        # Add replay metadata
        clean_row["_playback"] = {
            "current_index": current_idx,
            "total_records": total_rows,
            "has_next": current_idx < total_rows - 1,
            "has_prev": current_idx > 0
        }

        # Calculate estimated idle cost (assumes diesel ~1.1 $/L or ~90 INR/L, heavy machinery burns ~3.5 L/hr idle)
        idling_min = clean_row.get("idling_time_min") or 0.0
        idle_hours = idling_min / 60.0
        fuel_wasted_l = round(idle_hours * 3.5, 2)
        cost_wasted_usd = round(fuel_wasted_l * 1.15, 2)
        cost_wasted_inr = round(fuel_wasted_l * 95.0, 2)
        clean_row["idle_fuel_wasted_l"] = fuel_wasted_l
        clean_row["idle_cost_usd"] = cost_wasted_usd
        clean_row["idle_cost_inr"] = cost_wasted_inr

        return clean_row

    def set_machine_playback_index(self, machine_id: str, index: int) -> Dict[str, Any]:
        if machine_id in self.machine_groups:
            total_rows = len(self.machine_groups[machine_id])
            self._machine_playback_indices[machine_id] = max(0, min(total_rows - 1, index))
        return self.get_machine_telemetry(machine_id)

    def get_machine_history(self, machine_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Return chronological telemetry history up to current playback index for trends."""
        if machine_id not in self.machine_groups:
            return []
        m_group = self.machine_groups[machine_id]
        current_idx = self._machine_playback_indices.get(machine_id, len(m_group) - 1)
        
        start_idx = max(0, current_idx - limit + 1)
        slice_df = m_group.iloc[start_idx : current_idx + 1]

        records = []
        for _, row in slice_df.iterrows():
            item = {}
            for k, v in row.to_dict().items():
                if pd.isna(v):
                    item[k] = None
                elif isinstance(v, (pd.Timestamp, pd.Period)):
                    item[k] = str(v)[:10]
                elif isinstance(v, (np.integer, int)):
                    item[k] = int(v)
                elif isinstance(v, (np.floating, float)):
                    item[k] = round(float(v), 2)
                elif isinstance(v, (bool, np.bool_)):
                    item[k] = bool(v)
                else:
                    item[k] = v
            records.append(item)
        return records

    def get_tasks(self, site_id: Optional[str] = None, machine_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        sub = self.df
        if site_id:
            sub = sub[sub["site_id"] == site_id]
        if machine_id:
            sub = sub[sub["machine_id"] == machine_id]
        
        # Return recent tasks
        sub = sub.tail(limit)
        results = []
        for _, row in sub.iterrows():
            item = {}
            for k, v in row.to_dict().items():
                if pd.isna(v):
                    item[k] = None
                elif isinstance(v, (pd.Timestamp, pd.Period)):
                    item[k] = str(v)[:10]
                elif isinstance(v, (np.integer, int)):
                    item[k] = int(v)
                elif isinstance(v, (np.floating, float)):
                    item[k] = round(float(v), 2)
                elif isinstance(v, (bool, np.bool_)):
                    item[k] = bool(v)
                else:
                    item[k] = v
            results.append(item)
        return results

    def add_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        new_inc = {
            "incident_id": f"INC-MANUAL-{len(self.incidents_log) + 1:04d}",
            "task_id": incident_data.get("task_id", "LIVE-SESSION"),
            "task_date": incident_data.get("task_date", pd.Timestamp.now().strftime("%Y-%m-%d")),
            "site_id": incident_data.get("site_id", "Site-A-Chennai"),
            "machine_id": incident_data.get("machine_id", "M1001"),
            "machine_type": incident_data.get("machine_type", "Excavator"),
            "operator_id": incident_data.get("operator_id", "OP0001"),
            "type": incident_data.get("type", "Operator Reported Incident"),
            "severity": incident_data.get("severity", "Medium"),
            "status": "Under Review",
            "notes": incident_data.get("notes", "Manually reported in-cab incident"),
            "proximity_alert": incident_data.get("proximity_alert", False),
            "seatbelt_status": incident_data.get("seatbelt_status", "Fastened")
        }
        self.incidents_log.insert(0, new_inc)
        return new_inc


# Global singleton instance
def get_loader() -> CatDataLoader:
    if CatDataLoader._instance is None:
        CatDataLoader._instance = CatDataLoader()
    return CatDataLoader._instance
