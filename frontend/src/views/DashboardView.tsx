import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  CloudSun, 
  Compass, 
  User, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { HealthStrip } from '../components/HealthStrip';
import { SnapshotCards } from '../components/SnapshotCards';
import { SeatbeltProximityBanner } from '../components/SeatbeltProximityBanner';
import { DataTooltip } from '../components/DataTooltip';

export const DashboardView: React.FC = () => {
  const { telemetry, machineId, site, theme } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!machineId) return;
      try {
        setLoadingHistory(true);
        const res = await fetch(`/api/telemetry/history?machine_id=${encodeURIComponent(machineId)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [machineId, telemetry?._playback?.current_index]);

  if (!telemetry) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-[#FFCD11] border-t-transparent rounded-full mx-auto mb-3" />
        <p>Loading machine telemetry stream...</p>
      </div>
    );
  }

  // Chart data formatting
  const chartData = history.map((item, i) => ({
    name: item.task_id?.replace('TASK-', '') || `#${i + 1}`,
    date: item.task_date,
    temp: item.engine_temp_c,
    hyd: item.hydraulic_pressure_psi,
    oil: item.oil_pressure_psi,
    vib: item.vibration_mm_s,
    fuel: item.fuel_level_pct
  }));

  const getDeviationBadge = (cat: string) => {
    switch (cat) {
      case 'On Target':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Over Estimate':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* High-Priority Seatbelt & Proximity Alerts */}
      <SeatbeltProximityBanner />

      {/* Machine & Shift Overview Card */}
      <div className={`p-4 rounded-xl border ${
        theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FFCD11] text-black font-extrabold text-lg">
              {telemetry.machine_type === 'Excavator' ? 'EXC' : 
               telemetry.machine_type === 'Wheel Loader' ? 'WHL' :
               telemetry.machine_type === 'Track-Type Tractor' ? 'TRK' :
               telemetry.machine_type === 'Motor Grader' ? 'GRD' :
               telemetry.machine_type === 'Articulated Truck' ? 'ART' : 'BKL'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-white tracking-wide">
                  {telemetry.machine_model}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 text-slate-300 border border-neutral-700">
                  {telemetry.machine_id}
                </span>
                <span className="text-xs text-slate-400">
                  ({telemetry.machine_age_yrs} yrs in service)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-[#FFCD11]" /> {telemetry.site_id}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {telemetry.task_date}</span>
                <span>•</span>
                <span className="font-semibold text-slate-300">{telemetry.shift} Shift</span>
              </div>
            </div>
          </div>

          {/* Assigned Operator Pill */}
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFCD11]/20 text-[#FFCD11] flex items-center justify-center font-bold text-xs">
              <User size={16} />
            </div>
            <div className="text-xs">
              <div className="text-slate-400 text-[10px] font-mono">ASSIGNED OPERATOR</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{telemetry.operator_id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300 font-normal">
                  {telemetry.operator_skill} ({telemetry.operator_experience_yrs}y)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Task Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <Layers size={13} className="text-[#FFCD11]" />
              <DataTooltip columnKey="task_type" label="Scheduled Task" />
            </div>
            <div className="font-bold text-sm text-white">{telemetry.task_type}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Task ID: {telemetry.task_id}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <CloudSun size={13} className="text-sky-400" />
              <DataTooltip columnKey="weather" label="Weather & Temp" />
            </div>
            <div className="font-bold text-sm text-white">{telemetry.weather} • {telemetry.temperature_c}°C</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Atmospheric Conditions</div>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <Compass size={13} className="text-emerald-400" />
              <DataTooltip columnKey="terrain" label="Ground Terrain" />
            </div>
            <div className="font-bold text-sm text-white">{telemetry.terrain} Terrain</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Soil / Grade Profile</div>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <Clock size={13} className="text-amber-400" />
              <DataTooltip columnKey="estimated_time_min" label="Duration vs Plan" />
            </div>
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-white">
                {telemetry.actual_time_min} <span className="text-[10px] text-slate-400">/ {telemetry.estimated_time_min} min</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${getDeviationBadge(telemetry.deviation_category)}`}>
                {telemetry.deviation_category}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Diff: {telemetry.deviation_min > 0 ? `+${telemetry.deviation_min}` : telemetry.deviation_min} min ({telemetry.deviation_pct}%)
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Machine Health Strip */}
      <HealthStrip />

      {/* Operational 5-Metric Snapshot + Idle Cost Meter */}
      <SnapshotCards />

      {/* Historical Telemetry Trend Charts */}
      <div className={`p-4 rounded-xl border ${
        theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#FFCD11]" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
              Machine Sensor Telemetry History (Last 15 Sessions)
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Asset: <span className="text-white font-bold">{machineId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Engine Temp & Vibration */}
          <div className="p-3 rounded-lg bg-black/30 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-slate-300">Engine Coolant Temp (°C) & Vibration (mm/s)</span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-rose-400 flex items-center gap-1"><span className="w-2 h-0.5 bg-rose-400" /> Temp (°C)</span>
                <span className="text-[#FFCD11] flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FFCD11]" /> Vibration (mm/s)</span>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[70, 115]} tick={{ fill: '#737373', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: '#737373', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="vib" stroke="#FFCD11" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Hydraulic & Oil Pressure */}
          <div className="p-3 rounded-lg bg-black/30 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-slate-300">Hydraulic Pressure (PSI) & Oil Pressure (PSI)</span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-sky-400 flex items-center gap-1"><span className="w-2 h-0.5 bg-sky-400" /> Hyd (PSI)</span>
                <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-400" /> Oil (PSI)</span>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hydGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} />
                  <YAxis domain={[2400, 4000]} tick={{ fill: '#737373', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="hyd" stroke="#38bdf8" fillOpacity={1} fill="url(#hydGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
