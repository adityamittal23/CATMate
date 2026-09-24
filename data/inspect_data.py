import pandas as pd
import numpy as np

excel_path = 'data/cat_operator_task_dataset.xlsx'
df = pd.read_excel(excel_path, sheet_name='dataset')
dict_df = pd.read_excel(excel_path, sheet_name='data_dictionary')

print("Shape:", df.shape)
print("\n=== NULL VALUES ===")
nulls = df.isnull().sum()
print(nulls[nulls > 0])

print("\n=== MACHINE TYPES & WEAR INDICATORS ===")
for mtype, group in df.groupby('machine_type'):
    print(f"{mtype}: {len(group)} rows | undercarriage_null={group['undercarriage_wear_pct'].isna().sum()} | tire_tread_null={group['tire_tread_mm'].isna().sum()}")

print("\n=== SENSOR STATS ===")
sensors = ['engine_temp_c', 'hydraulic_pressure_psi', 'oil_pressure_psi', 'vibration_mm_s', 'fuel_level_pct', 'idling_time_min', 'actual_time_min', 'estimated_time_min']
for s in sensors:
    print(f"{s}: min={df[s].min():.1f}, 25%={df[s].quantile(0.25):.1f}, median={df[s].median():.1f}, 75%={df[s].quantile(0.75):.1f}, max={df[s].max():.1f}, mean={df[s].mean():.1f}, std={df[s].std():.1f}")

print("\n=== SITES & MACHINES ===")
for site, s_df in df.groupby('site_id'):
    print(f"{site}: {s_df['machine_id'].nunique()} machines, {len(s_df)} sessions")

print("\n=== TASKS PER MACHINE ===")
print("Sessions per machine min/max/mean:", df.groupby('machine_id').size().min(), df.groupby('machine_id').size().max(), df.groupby('machine_id').size().mean())

print("\n=== OPERATOR METRICS ===")
print("Operators:", df['operator_id'].nunique())
op_summary = df.groupby('operator_id').agg(
    sessions=('task_id', 'count'),
    safety_alerts=('safety_alert_triggered', lambda x: (x == 'Yes').sum()),
    seatbelt_unfastened=('seatbelt_status', lambda x: (x == 'Unfastened').sum()),
    skill=('operator_skill', 'first'),
    exp=('operator_experience_yrs', 'first')
)
print("Operator summary sample:\n", op_summary.head(5))

print("\n=== TASK DURATION COMPARISON ===")
print("Correlation estimated_time_min vs actual_time_min:", df['estimated_time_min'].corr(df['actual_time_min']))
print("Deviation category distribution:\n", df['deviation_category'].value_counts())
