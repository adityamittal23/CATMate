import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_all():
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("Health check OK:", res.json())

    res_snap = client.get("/api/telemetry/snapshot?machine_id=M1001")
    assert res_snap.status_code == 200, res_snap.text
    snap = res_snap.json()
    print("Telemetry Snapshot OK:", snap["machine_id"], "Temp:", snap["engine_temp_c"], "Playback:", snap["_playback"])

    res_predict = client.post("/api/predict/estimate", json={
        "task_type": "Earth Excavation",
        "weather": "Rainy",
        "terrain": "Muddy",
        "operator_skill": "Beginner",
        "operator_experience_yrs": 0.5,
        "machine_type": "Excavator",
        "machine_age_yrs": 4.0,
        "temperature_c": 28.0,
        "estimated_time_min": 60.0
    })
    assert res_predict.status_code == 200, res_predict.text
    pred = res_predict.json()
    print("Prediction OK:", pred["predicted_time_min"], "min | Why:", pred["plain_english_why"])

    res_anom = client.get("/api/anomaly/feed?site_id=Site-A-Chennai")
    assert res_anom.status_code == 200, res_anom.text
    print("Anomaly Feed OK! Total count:", res_anom.json()["count"], "Critical count:", res_anom.json()["critical_count"])

    res_maint = client.get("/api/maintenance/machine/M1001")
    assert res_maint.status_code == 200, res_maint.text
    maint = res_maint.json()
    print("Maintenance OK:", maint["machine_id"], "Wear:", maint["wear_indicator"]["current_value"], maint["wear_indicator"]["unit"])

    res_ops = client.get("/api/operators/leaderboard")
    assert res_ops.status_code == 200, res_ops.text
    print("Leaderboard OK: Top operator:", res_ops.json()["leaderboard"][0]["operator_id"], "Score:", res_ops.json()["leaderboard"][0]["safety_score"])

    res_dict = client.get("/api/meta/dictionary")
    assert res_dict.status_code == 200, res_dict.text
    print("Data Dictionary OK: Loaded", len(res_dict.json()), "descriptions.")

if __name__ == "__main__":
    test_all()
    print("\nALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")
