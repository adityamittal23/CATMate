export interface PlaybackMeta {
  current_index: number;
  total_records: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface HealthBandMetric {
  value: number;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  min_normal: number;
  max_normal: number;
  warning_threshold: number;
  label: string;
}

export interface HealthBands {
  engine_temp: HealthBandMetric;
  hydraulic_pressure: HealthBandMetric;
  oil_pressure: HealthBandMetric;
  vibration: HealthBandMetric;
}

export interface AnomalyTrigger {
  source: string;
  title: string;
  detail: string;
  severity: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AnomalyEvaluation {
  severity: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  has_anomaly: boolean;
  anomaly_count: number;
  iso_score: number;
  is_ml_outlier: boolean;
  triggers: AnomalyTrigger[];
}

export interface TelemetrySnapshot {
  task_id: string;
  task_date: string;
  shift: string;
  site_id: string;
  machine_id: string;
  machine_type: string;
  machine_model: string;
  machine_age_yrs: number;
  operator_id: string;
  operator_skill: string;
  operator_experience_yrs: number;
  task_type: string;
  weather: string;
  temperature_c: number;
  terrain: string;
  estimated_time_min: number;
  actual_time_min: number;
  deviation_min: number;
  deviation_pct: number;
  deviation_category: string;
  session_engine_hours: number;
  total_engine_hours_at_task: number;
  fuel_used_l: number;
  load_cycles: number;
  idling_time_min: number;
  excessive_idling_flag: boolean;
  seatbelt_status: string;
  safety_alert_triggered: string;
  proximity_alert_triggered: string;
  engine_temp_c: number;
  hydraulic_pressure_psi: number;
  oil_pressure_psi: number;
  vibration_mm_s: number;
  fuel_level_pct: number;
  undercarriage_wear_pct?: number | null;
  tire_tread_mm?: number | null;
  maintenance_cycle_hours: number;
  maintenance_cycles_completed: number;
  hours_since_last_maintenance: number;
  last_maintenance_date: string;
  next_maintenance_due_hours: number;
  maintenance_overdue_flag: boolean;
  days_since_last_maintenance: number;
  last_inspection_date: string;
  last_inspection_result: string;
  next_inspection_due_date: string;
  _playback: PlaybackMeta;
  idle_fuel_wasted_l: number;
  idle_cost_usd: number;
  idle_cost_inr: number;
  health_bands: HealthBands;
  anomaly_evaluation?: AnomalyEvaluation;
}

export interface Machine {
  machine_id: string;
  site_id: string;
  machine_type: string;
  machine_model: string;
  machine_age_yrs: number;
  last_operator_id: string;
  total_engine_hours: number;
  maintenance_overdue: boolean;
  last_inspection_result: string;
}

export interface Operator {
  operator_id: string;
  skill: string;
  experience_yrs: number;
  total_sessions: number;
  safety_score: number;
  seatbelt_compliance_pct: number;
  safety_alerts_count: number;
  proximity_alerts_count: number;
  unfastened_count: number;
  excessive_idling_count: number;
  primary_site: string;
  assigned_machines: string[];
  rank?: number;
}

export interface WearIndicator {
  type: 'undercarriage' | 'tire';
  metric_name: string;
  current_value: number;
  unit: string;
  status: string;
  threshold_warning: number;
  threshold_critical: number;
  life_remaining_pct: number;
  recommended_action: string;
}

export interface MachineMaintenance {
  machine_id: string;
  site_id: string;
  machine_type: string;
  machine_model: string;
  machine_age_yrs: number;
  total_engine_hours: number;
  maintenance_cycle_hours: number;
  maintenance_cycles_completed: number;
  hours_since_last_maintenance: number;
  next_maintenance_due_hours: number;
  maintenance_overdue_flag: boolean;
  overdue_urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  wear_indicator: WearIndicator;
  inspection: {
    last_inspection_date: string;
    last_inspection_result: string;
    next_inspection_due_date: string;
    days_until_next_inspection: number | null;
    inspection_status: string;
  };
}

export interface AnomalyItem {
  anomaly_id: string;
  task_id: string;
  task_date: string;
  site_id: string;
  machine_id: string;
  machine_type: string;
  operator_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  primary_issue: string;
  detail: string;
  all_triggers: AnomalyTrigger[];
  iso_score: number;
  is_ml_outlier: boolean;
  sensor_readings: Record<string, number>;
  status: 'Action Needed' | 'Resolved';
  recommended_action: string;
}

export interface Incident {
  incident_id: string;
  task_id: string;
  task_date: string;
  site_id: string;
  machine_id: string;
  machine_type: string;
  operator_id: string;
  type: string;
  severity: string;
  status: string;
  notes: string;
  proximity_alert: boolean;
  seatbelt_status: string;
}
