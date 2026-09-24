# Cat IQ Copilot 🚜
### Smart Heavy Machinery Operator Assistant for Caterpillar Equipment
*Hackathon MVP for the "Smart Operator Assistant for CAT machinery" challenge*

---

## 📌 Executive Overview
**Cat IQ Copilot** is an intelligent, in-cab digital companion designed specifically for operators and jobsite supervisors running Caterpillar heavy equipment (Excavators, Wheel Loaders, Track-Type Tractors, Motor Graders, Articulated Trucks, and Backhoe Loaders).

Unlike static telemetry viewers, **Cat IQ Copilot** actively assists operators throughout their shift by delivering:
1. **Real-time Safety & Proximity Radar** (seatbelt compliance monitoring, tailswing/trench proximity alarms, and in-cab incident logging).
2. **Predictive Maintenance & Component Life Telematics** (real-time engine hour PM countdowns, undercarriage track wear % vs. tire tread depth mm, and mandatory inspection scheduling).
3. **ML-Powered Task Time Estimation** (RandomForestRegressor with explainable AI giving plain-English breakdowns of how weather, soil terrain, machine age, and operator experience affect planned completion times).
4. **Univariate & Multivariate Anomaly Detection** (Isolation Forest outlier scoring combined with physical domain safety thresholds for excessive idling, severe cab vibration, engine coolant overheating, and hydraulic pressure spikes).
5. **Operator Training & Skill Gating Hub** (skill-authorized task assignments, Caterpillar University video modules, simulator pre-operation inspection checklists, and 1-on-1 instructor booking).
6. **In-Cab Rugged Tablet Ergonomics** (high-contrast Cat Yellow `#FFCD11` / Near-Black `#1A1A1A` theme, day/night cab-glare toggle, glove-friendly tap targets, and bilingual EN/हिन्दी support).

---

## 🏗️ Architecture & Folder Structure

```
CATMate/
├── cat_operator_task_dataset.xlsx     # Original dataset (6,000 sessions, 46 columns, data dictionary)
├── Problem Statement.pdf              # Challenge brief
├── data/
│   ├── cat_operator_task_dataset.xlsx # Working dataset copy
│   ├── loader.py                      # Single source of truth data loader (pandas), chronologically sorted
│   └── inspect_data.py                # Data profiling script
├── ml/
│   ├── train_models.py                # ML training pipeline for RandomForest & IsolationForest
│   └── models/
│       ├── task_time_model.pkl        # Serialized RandomForest regressor + feature encoders + explainability heuristics
│       └── anomaly_model.pkl          # Serialized Isolation Forest + StandardScaler + telemetry baseline stats
├── backend/
│   ├── main.py                        # FastAPI application entry point, CORS, and unified SPA serving
│   ├── ml_service.py                  # ML inference & anomaly scoring service
│   ├── test_api.py                    # API integration tests
│   └── routers/
│       ├── telemetry.py               # Live snapshot, simulation stream replay controls, health strip
│       ├── tasks.py                   # Daily task assignments & deviation category statistics
│       ├── predict.py                 # Task time estimation & explainable AI heuristics
│       ├── anomaly.py                 # Prioritized attention-needed feed & resolution actions
│       ├── incidents.py               # Filterable incident log & in-cab incident reporting
│       ├── maintenance.py             # PM cycle countdown, undercarriage/tire wear, inspections
│       ├── operators.py               # Safety score leaderboard & skill gating matrices
│       └── dictionary.py              # Data dictionary and site/machine metadata endpoints
├── frontend/
│   ├── src/
│   │   ├── components/                # Header, HealthStrip, SnapshotCards, SeatbeltProximityBanner, DataTooltip
│   │   ├── context/AppContext.tsx     # Global state, active site/machine, simulation replay loop, i18n
│   │   ├── views/                     # DashboardView, SafetyView, MaintenanceView, PredictView, AnomalyView, TrainingView
│   │   ├── translations.ts            # English & Hindi localization dictionary
│   │   ├── types.ts                   # TypeScript interfaces
│   │   ├── App.tsx                    # Main navigation shell & in-cab footer
│   │   ├── main.tsx                   # React 19 bootstrap
│   │   └── index.css                  # Tailwind v4 + industrial styling
│   ├── vite.config.ts                 # Vite config with React plugin and /api proxy
│   └── dist/                          # Production build bundled directly into FastAPI
└── README.md                          # Full documentation
```

---

## ⚡ Quick Start: Running Cat IQ Copilot

### Prerequisites
- Python 3.10+
- Node.js v18+ (Node v22 installed)
- Dependencies installed: `fastapi`, `uvicorn`, `pandas`, `openpyxl`, `scikit-learn`, `joblib`

### Option 1: Single-Command Full-Stack Run (Recommended)
Since the production React frontend is pre-built into `frontend/dist`, simply start the FastAPI backend:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser or cab tablet to experience the full interactive app!

### Option 2: Separate Development Servers (Hot Reloading)

1. **Start the FastAPI Backend**:
   ```bash
   python -m uvicorn backend.main:app --port 8000 --reload
   ```
2. **Start the Vite Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)**.

---

## 🧠 Machine Learning Models & Training Details

Both models are trained directly on `cat_operator_task_dataset.xlsx` using `ml/train_models.py`:

```bash
python ml/train_models.py
```

### 1. Task Time Estimation (`RandomForestRegressor`)
- **Objective**: Accurately predict `actual_time_min` for heavy equipment operations, outperforming human planner baseline estimates (`estimated_time_min`).
- **Features Used**:
  - Categorical: `task_type`, `weather`, `terrain`, `operator_skill`, `machine_type` (One-Hot Encoded)
  - Numerical: `temperature_c`, `operator_experience_yrs`, `machine_age_yrs` (Standard Scaled)
- **Model Architecture**:
  - `RandomForestRegressor(n_estimators=120, max_depth=16, min_samples_split=4, min_samples_leaf=2)`
- **Evaluation Results**:
  | Metric | Trained ML Model | Planner Baseline | Improvement |
  | :--- | :--- | :--- | :--- |
  | **R² Score** | **0.942** | 0.804 | **+17.2% higher explanatory power** |
  | **Mean Absolute Error (MAE)** | **4.81 minutes** | 8.52 minutes | **43.5% reduction in prediction error** |
  | **Root Mean Squared Error (RMSE)** | **6.41 minutes** | 11.82 minutes | **45.8% reduction in variance** |
- **Explainable AI (XAI)**:
  - Generates plain-English reasons for operators (e.g. *"Rainy weather adds ~4 min + Beginner operator skill adds ~13 min + Muddy terrain adds ~7 min based on historical fleet telemetry"*).

### 2. Multivariate Anomaly Detection (`IsolationForest` + Domain Rules)
- **Objective**: Flag unsafe operating patterns, mechanical distress, and telemetry outliers.
- **Telemetry Features**: `session_engine_hours`, `fuel_used_l`, `idling_time_min`, `vibration_mm_s`, `engine_temp_c`, `hydraulic_pressure_psi`, `oil_pressure_psi`.
- **Contamination**: `0.04` (4% expected outlier rate in fleet operations).
- **Domain Physical Thresholds**:
  - **Excessive Idling**: `idling_time_min > 25% of session engine hours` (Rule FR4.1)
  - **Elevated / Severe Vibration**: `vibration_mm_s >= 5.5 mm/s` (Warning), `>= 6.8 mm/s` (Critical)
  - **Engine Coolant Overheating**: `engine_temp_c >= 100°C` (Warning), `>= 106°C` (Critical)
  - **Hydraulic Pressure Limits**: `< 2650 PSI` (Pressure Drop), `> 3800 PSI` (Overpressure Spike)
  - **Low Engine Oil Pressure**: `< 42 PSI` (Critical Lubrication Loss)
  - **Preventive Maintenance Overdue**: `next_maintenance_due_hours < 15 hrs`
  - **Safety & Proximity Breaches**: `proximity_alert_triggered == 'Yes'` / `seatbelt_status == 'Unfastened'`

---

## 📊 Dataset Column Mapping

Every feature in Cat IQ Copilot is grounded in columns from `cat_operator_task_dataset.xlsx`:

| UI Feature / Module | Dataset Columns Used | Explanation & Purpose |
| :--- | :--- | :--- |
| **Global Filtering** | `site_id`, `machine_id`, `machine_type`, `machine_model` | Multi-site (Chennai, Hyderabad, Pune, Bengaluru, Nagpur) and 60-machine asset switcher |
| **Shift & Assignment** | `task_id`, `task_date`, `shift`, `operator_id`, `operator_skill`, `operator_experience_yrs` | Operator badge, skill level, and chronological session sequencing |
| **Live Telemetry Snapshot** | `session_engine_hours`, `total_engine_hours_at_task`, `fuel_used_l`, `load_cycles`, `idling_time_min`, `fuel_level_pct` | Instant cab readout of engine hours, fuel level %, fuel burned, and cycles |
| **Machine Health Strip** | `engine_temp_c`, `hydraulic_pressure_psi`, `oil_pressure_psi`, `vibration_mm_s` | Real-time health gauges with normal, warning, and critical operating bands |
| **Idle Cost Meter** | `idling_time_min`, `excessive_idling_flag` | Converts idle minutes into wasted diesel liters and monetary financial cost ($ / ₹) |
| **Seatbelt Compliance** | `seatbelt_status` | Fastened (Compliant) vs Unfastened (Infraction alert with warning buzzer) |
| **Proximity Radar** | `proximity_alert_triggered` | Ground personnel / blindspot zone breach banner (Caution / Danger) |
| **Incident Logging** | `safety_alert_triggered`, `task_id`, `site_id`, `machine_id`, `operator_id` | Historical log seeded from alert sessions + in-cab new incident submission |
| **Safety Leaderboard** | `operator_id`, `seatbelt_status`, `safety_alert_triggered`, `proximity_alert_triggered` | Rolling operator safety score (0-100) and site rankings |
| **PM Countdown** | `hours_since_last_maintenance`, `next_maintenance_due_hours`, `maintenance_cycle_hours`, `maintenance_overdue_flag` | Engine hours remaining countdown; red high-visibility overdue banner (<15 hrs) |
| **Track Wear Indicator** | `undercarriage_wear_pct` | Track wear % & remaining life bar (Tracked machines: Excavator, Track-Type Tractor) |
| **Tire Tread Indicator** | `tire_tread_mm` | Remaining tread depth mm & tire life bar (Wheeled machines: Wheel Loader, Articulated Truck, Motor Grader, Backhoe Loader) |
| **Mechanical Inspections**| `last_inspection_date`, `last_inspection_result`, `next_inspection_due_date` | Pass / Minor Issues / Fail status badge and countdown to next mandatory inspection |
| **ML Task Time Estimator**| `task_type`, `weather`, `temperature_c`, `terrain`, `estimated_time_min`, `actual_time_min`, `deviation_min`, `deviation_pct`, `deviation_category` | RandomForest prediction vs. baseline planner estimate with plain-English explanation |
| **Training & Skill Gating**| `operator_skill`, `operator_experience_yrs`, `task_type` | Gates solo authorized vs supervised vs restricted tasks according to operator skill |
| **Data Dictionary Tooltips**| Sheet `"data_dictionary"` | Dynamic floating tooltips explaining every telemetry metric directly from the sheet |

---

## 🎨 Caterpillar Design Guidelines & Ergonomics
- **Caterpillar Palette**: High-visibility Cat Yellow (`#FFCD11`), Near-Black (`#121212` / `#181818`), and crisp white/slate typography.
- **In-Cab Rugged Tablet Ergonomics**: Minimum 48px tap targets designed for gloved touch screens.
- **Day / Night Mode**: Immediate glare reduction toggle for nighttime cab operation or high-contrast bright sunlight mode.
- **Live Feed Simulation**: Replays actual dataset rows in chronological date order per machine (Step Next, Step Prev, Play, Pause, Speed 1x/2x/5x).

---

## 🧪 Testing
Run backend unit and integration tests:
```bash
python backend/test_api.py
```
*Status: All integration tests passing.*
