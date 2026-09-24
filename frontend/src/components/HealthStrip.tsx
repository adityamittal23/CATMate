import React from 'react';
import { Thermometer, Activity, Gauge, Droplet, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTooltip } from './DataTooltip';

export const HealthStrip: React.FC = () => {
  const { telemetry, theme } = useApp();

  if (!telemetry || !telemetry.health_bands) {
    return null;
  }

  const { engine_temp, hydraulic_pressure, oil_pressure, vibration } = telemetry.health_bands;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/40';
      case 'WARNING':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/40';
      default:
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-500';
      case 'WARNING':
        return 'bg-amber-400';
      default:
        return 'bg-emerald-500';
    }
  };

  // Helper for progress %
  const getTempPct = (val: number) => Math.min(100, Math.max(0, ((val - 60) / (120 - 60)) * 100));
  const getHydPct = (val: number) => Math.min(100, Math.max(0, ((val - 2200) / (4200 - 2200)) * 100));
  const getOilPct = (val: number) => Math.min(100, Math.max(0, ((val - 30) / (80 - 30)) * 100));
  const getVibPct = (val: number) => Math.min(100, Math.max(0, (val / 10) * 100));

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      theme === 'day' ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#1c1c1c] border-neutral-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFCD11]" />
          <h2 className="font-heading font-bold text-sm tracking-wide uppercase text-slate-300 flex items-center gap-2">
            <span>Machine Health Telemetry Strip</span>
            <span className="text-[10px] text-slate-500 font-mono font-normal">Real-Time Sensor Tolerances</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
          <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" /> Warning</span>
          <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500" /> Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Engine Coolant Temp */}
        <div className={`p-3 rounded-lg border ${getStatusColor(engine_temp.status)} transition-colors`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Thermometer size={15} />
              <DataTooltip columnKey="engine_temp_c" label="Engine Temp" />
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border border-current">
              {engine_temp.status}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              {engine_temp.value} <span className="text-xs font-normal text-slate-400">{engine_temp.unit}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Norm: 80-98°C</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressBarColor(engine_temp.status)}`}
              style={{ width: `${getTempPct(engine_temp.value)}%` }}
            />
          </div>
        </div>

        {/* Hydraulic System Pressure */}
        <div className={`p-3 rounded-lg border ${getStatusColor(hydraulic_pressure.status)} transition-colors`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Gauge size={15} />
              <DataTooltip columnKey="hydraulic_pressure_psi" label="Hydraulic Pressure" />
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border border-current">
              {hydraulic_pressure.status}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              {hydraulic_pressure.value} <span className="text-xs font-normal text-slate-400">{hydraulic_pressure.unit}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Norm: 2800-3600</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressBarColor(hydraulic_pressure.status)}`}
              style={{ width: `${getHydPct(hydraulic_pressure.value)}%` }}
            />
          </div>
        </div>

        {/* Engine Oil Pressure */}
        <div className={`p-3 rounded-lg border ${getStatusColor(oil_pressure.status)} transition-colors`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Droplet size={15} />
              <DataTooltip columnKey="oil_pressure_psi" label="Oil Pressure" />
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border border-current">
              {oil_pressure.status}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              {oil_pressure.value} <span className="text-xs font-normal text-slate-400">{oil_pressure.unit}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Norm: 48-62 PSI</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressBarColor(oil_pressure.status)}`}
              style={{ width: `${getOilPct(oil_pressure.value)}%` }}
            />
          </div>
        </div>

        {/* Vibration Sensor */}
        <div className={`p-3 rounded-lg border ${getStatusColor(vibration.status)} transition-colors`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Activity size={15} />
              <DataTooltip columnKey="vibration_mm_s" label="Cab Vibration" />
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border border-current">
              {vibration.status}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              {vibration.value} <span className="text-xs font-normal text-slate-400">{vibration.unit}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Limit: &lt;5.5 mm/s</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressBarColor(vibration.status)}`}
              style={{ width: `${getVibPct(vibration.value)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
