import React from 'react';
import { Clock, Fuel, Repeat, Flame, DollarSign, BatteryCharging, AlertOctagon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTooltip } from './DataTooltip';

export const SnapshotCards: React.FC = () => {
  const { telemetry, theme } = useApp();

  if (!telemetry) return null;

  const isExcessiveIdle = telemetry.excessive_idling_flag;

  return (
    <div className="space-y-3">
      {/* 5-Card Operational Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Session Engine Hours */}
        <div className={`p-3.5 rounded-xl border ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#1b1b1b] border-neutral-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Session Hours</span>
            <Clock size={16} className="text-[#FFCD11]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl text-white tracking-tight">
              {telemetry.session_engine_hours}
            </span>
            <span className="text-xs text-slate-400 font-mono">hrs</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total: {telemetry.total_engine_hours_at_task.toFixed(0)} hrs</span>
            <DataTooltip columnKey="session_engine_hours" iconOnly />
          </div>
        </div>

        {/* Fuel Tank Level */}
        <div className={`p-3.5 rounded-xl border ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#1b1b1b] border-neutral-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Fuel Tank Level</span>
            <Fuel size={16} className={telemetry.fuel_level_pct < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl text-white tracking-tight">
              {telemetry.fuel_level_pct}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${telemetry.fuel_level_pct < 25 ? 'bg-rose-500' : telemetry.fuel_level_pct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${telemetry.fuel_level_pct}%` }}
            />
          </div>
        </div>

        {/* Fuel Consumed */}
        <div className={`p-3.5 rounded-xl border ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#1b1b1b] border-neutral-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Fuel Consumed</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl text-white tracking-tight">
              {telemetry.fuel_used_l}
            </span>
            <span className="text-xs text-slate-400 font-mono">Liters</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rate: ~{(telemetry.fuel_used_l / (telemetry.session_engine_hours || 1)).toFixed(1)} L/hr</span>
            <DataTooltip columnKey="fuel_used_l" iconOnly />
          </div>
        </div>

        {/* Load Cycles */}
        <div className={`p-3.5 rounded-xl border ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#1b1b1b] border-neutral-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Load / Dig Cycles</span>
            <Repeat size={16} className="text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl text-white tracking-tight">
              {telemetry.load_cycles}
            </span>
            <span className="text-xs text-slate-400 font-mono">cycles</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{telemetry.task_type}</span>
            <DataTooltip columnKey="load_cycles" iconOnly />
          </div>
        </div>

        {/* Idling Time */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isExcessiveIdle 
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' 
            : theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#1b1b1b] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Idling Time</span>
            {isExcessiveIdle ? (
              <AlertOctagon size={16} className="text-amber-400 animate-pulse" />
            ) : (
              <Clock size={16} className="text-slate-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl text-white tracking-tight">
              {telemetry.idling_time_min}
            </span>
            <span className="text-xs text-slate-400 font-mono">min</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={isExcessiveIdle ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {isExcessiveIdle ? 'EXCESSIVE (>25%)' : 'Normal Idle'}
            </span>
            <DataTooltip columnKey="excessive_idling_flag" iconOnly />
          </div>
        </div>
      </div>

      {/* Idle Cost Meter Strip (Extra Feature) */}
      <div className={`px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        isExcessiveIdle 
          ? 'bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-amber-500/40' 
          : 'bg-neutral-900/60 border-neutral-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FFCD11]/10 text-[#FFCD11]">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Idle Cost & Fuel Waste Meter</span>
              {isExcessiveIdle && (
                <span className="bg-amber-400 text-black text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                  OPPORTUNITY FOR SAVINGS
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Computed from {telemetry.idling_time_min} min idle time @ standard Caterpillar baseline fuel burn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-black/50 px-3 py-1.5 rounded-lg border border-neutral-700/60 text-center">
            <div className="text-[10px] text-slate-400">Fuel Lost</div>
            <div className="text-[#FFCD11] font-bold text-sm">{telemetry.idle_fuel_wasted_l} L</div>
          </div>
          <div className="bg-black/50 px-3 py-1.5 rounded-lg border border-neutral-700/60 text-center">
            <div className="text-[10px] text-slate-400">Estimated Cost</div>
            <div className="text-white font-bold text-sm">
              ₹{telemetry.idle_cost_inr} <span className="text-[10px] text-slate-400 font-normal">(${telemetry.idle_cost_usd})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
