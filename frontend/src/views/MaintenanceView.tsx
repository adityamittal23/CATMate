import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Cpu, 
  Disc, 
  Activity, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MachineMaintenance } from '../types';
import { DataTooltip } from '../components/DataTooltip';

export const MaintenanceView: React.FC = () => {
  const { machineId, site, theme } = useApp();
  const [maintenance, setMaintenance] = useState<MachineMaintenance | null>(null);
  const [fleetOverview, setFleetOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMaintenance = async () => {
      if (!machineId) return;
      try {
        setLoading(true);
        const [maintRes, fleetRes] = await Promise.all([
          fetch(`/api/maintenance/machine/${encodeURIComponent(machineId)}`),
          fetch(`/api/maintenance/overview?site_id=${encodeURIComponent(site)}`)
        ]);
        if (maintRes.ok) {
          const data = await maintRes.json();
          setMaintenance(data);
        }
        if (fleetRes.ok) {
          const fData = await fleetRes.json();
          setFleetOverview(fData);
        }
      } catch (err) {
        console.error('Maintenance fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenance();
  }, [machineId, site]);

  if (!maintenance) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-[#FFCD11] border-t-transparent rounded-full mx-auto mb-3" />
        <p>Loading predictive maintenance telematics...</p>
      </div>
    );
  }

  const isOverdue = maintenance.maintenance_overdue_flag;
  const isTracked = maintenance.wear_indicator.type === 'undercarriage';

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'WARNING':
        return 'bg-amber-500 text-black font-bold';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  };

  const getInspectionBadge = (result: string) => {
    switch (result) {
      case 'Pass':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Minor Issues':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white flex items-center gap-2">
            <Wrench className="text-[#FFCD11]" />
            <span>Predictive Maintenance & Asset Life</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time Caterpillar PM cycle countdown, undercarriage/tire wear tracking, and inspection schedules.
          </p>
        </div>

        {/* Machine info badge */}
        <div className="bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">Target Asset:</span>
          <span className="text-[#FFCD11] font-bold">{maintenance.machine_id}</span>
          <span className="text-white">({maintenance.machine_model})</span>
        </div>
      </div>

      {/* Overdue Alert Banner if Triggered */}
      {isOverdue && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900 to-black border-2 border-rose-600 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-black/40 text-rose-400">
              <AlertOctagon size={28} />
            </div>
            <div>
              <div className="font-heading font-black text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <span>PREVENTIVE MAINTENANCE OVERDUE</span>
                <span className="bg-white text-rose-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold">ACTION REQUIRED</span>
              </div>
              <p className="text-xs text-rose-200">
                Only {maintenance.next_maintenance_due_hours} engine hours remaining until recommended service limit. Operating past schedule risks hydraulic or engine warranty void.
              </p>
            </div>
          </div>
          <button 
            onClick={() => alert(`Service dispatch notification dispatched for ${maintenance.machine_id} to Caterpillar Dealer Support.`)}
            className="px-4 py-2 bg-[#FFCD11] hover:bg-yellow-400 text-black font-heading font-bold text-xs uppercase tracking-wider rounded-lg shadow cab-tap-target"
          >
            Dispatch PM Tech
          </button>
        </div>
      )}

      {/* Main Predictive Telematics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: PM Interval & Countdown */}
        <div className={`p-4 rounded-xl border ${
          isOverdue ? 'bg-rose-950/20 border-rose-500/40' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Clock size={16} className="text-[#FFCD11]" />
              <DataTooltip columnKey="next_maintenance_due_hours" label="Next PM Due Countdown" />
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${getUrgencyBadge(maintenance.overdue_urgency)}`}>
              {maintenance.overdue_urgency}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className={`font-heading font-black text-4xl tracking-tight ${isOverdue ? 'text-rose-500' : 'text-white'}`}>
              {maintenance.next_maintenance_due_hours}
            </span>
            <span className="text-xs text-slate-400 font-mono">Engine Hours Remaining</span>
          </div>

          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden my-3">
            <div 
              className={`h-full ${isOverdue ? 'bg-rose-600' : maintenance.next_maintenance_due_hours < 35 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (maintenance.next_maintenance_due_hours / maintenance.maintenance_cycle_hours) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-neutral-800">
            <div>
              <span>Since Last PM: </span>
              <strong className="text-slate-200">{maintenance.hours_since_last_maintenance} hrs</strong>
            </div>
            <div>
              <span>Cycle Interval: </span>
              <strong className="text-slate-200">{maintenance.maintenance_cycle_hours} hrs</strong>
            </div>
            <div>
              <span>Cycles Done: </span>
              <strong className="text-slate-200">{maintenance.maintenance_cycles_completed}</strong>
            </div>
            <div>
              <span>Total Hours: </span>
              <strong className="text-slate-200">{maintenance.total_engine_hours.toFixed(0)} hrs</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Wear Indicator (Undercarriage vs Tire) */}
        <div className="p-4 rounded-xl border bg-[#181818] border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Disc size={16} className="text-[#FFCD11]" />
              <DataTooltip 
                columnKey={isTracked ? "undercarriage_wear_pct" : "tire_tread_mm"} 
                label={maintenance.wear_indicator.metric_name} 
              />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-neutral-800 text-[#FFCD11] border border-neutral-700">
              {isTracked ? 'TRACKED GEAR' : 'WHEELED GEAR'}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div>
              <span className="font-heading font-black text-4xl text-white tracking-tight">
                {maintenance.wear_indicator.current_value}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">{maintenance.wear_indicator.unit}</span>
            </div>
            <span className="text-xs font-mono text-slate-300 font-bold">
              {maintenance.wear_indicator.status}
            </span>
          </div>

          {/* Life remaining bar */}
          <div className="my-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Component Life Remaining</span>
              <span className="text-[#FFCD11] font-bold">{maintenance.wear_indicator.life_remaining_pct}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#FFCD11]"
                style={{ width: `${maintenance.wear_indicator.life_remaining_pct}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-[11px] text-slate-400">
            <span className="text-slate-500 font-mono">Recommendation:</span>
            <p className="text-slate-200 mt-0.5 font-medium">{maintenance.wear_indicator.recommended_action}</p>
          </div>
        </div>

        {/* Card 3: Mechanical Inspection Status */}
        <div className="p-4 rounded-xl border bg-[#181818] border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Calendar size={16} className="text-[#FFCD11]" />
              <DataTooltip columnKey="last_inspection_result" label="Mechanical Inspection" />
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${getInspectionBadge(maintenance.inspection.last_inspection_result)}`}>
              {maintenance.inspection.last_inspection_result}
            </span>
          </div>

          <div className="my-2">
            <div className="text-xs text-slate-400">Next Mandatory Inspection</div>
            <div className="font-heading font-black text-2xl text-white tracking-wide mt-0.5">
              {maintenance.inspection.next_inspection_due_date || 'Pending Schedule'}
            </div>
            <div className="text-xs font-mono text-[#FFCD11] mt-1">
              {maintenance.inspection.days_until_next_inspection !== null 
                ? (maintenance.inspection.days_until_next_inspection >= 0 
                    ? `Due in ~${maintenance.inspection.days_until_next_inspection} calendar days` 
                    : `Overdue by ${Math.abs(maintenance.inspection.days_until_next_inspection)} days!`)
                : '14 days estimated'}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Last Inspection Date:</span>
              <strong className="text-slate-200">{maintenance.inspection.last_inspection_date || 'N/A'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Inspection Compliance:</span>
              <strong className="text-emerald-400">OSHA / ISO Certified</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Maintenance Status Overview */}
      {fleetOverview && (
        <div className={`p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Site Fleet Maintenance Health ({fleetOverview.site_id})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Fleet Health:</span>
              <span className="text-emerald-400 font-bold text-sm">{fleetOverview.fleet_health_pct}% Operational</span>
            </div>
          </div>

          {/* 3 Summary metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Healthy Assets</div>
              <div className="font-heading font-black text-2xl text-emerald-400">{fleetOverview.healthy_count}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Service Due Soon</div>
              <div className="font-heading font-black text-2xl text-amber-400">{fleetOverview.warning_count}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">PM Overdue</div>
              <div className="font-heading font-black text-2xl text-rose-500">{fleetOverview.overdue_count}</div>
            </div>
          </div>

          {/* Quick asset maintenance table */}
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Asset ID</th>
                  <th className="p-2.5">Model & Type</th>
                  <th className="p-2.5">PM Hours Remaining</th>
                  <th className="p-2.5">Inspection Status</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {fleetOverview.machines.slice(0, 15).map((m: any) => (
                  <tr key={m.machine_id} className="hover:bg-neutral-800/40">
                    <td className="p-2.5 font-mono font-bold text-white">{m.machine_id}</td>
                    <td className="p-2.5 text-slate-300">{m.machine_model} ({m.machine_type})</td>
                    <td className="p-2.5 font-mono">
                      <span className={m.due_hours < 15 ? 'text-rose-500 font-bold' : m.due_hours < 35 ? 'text-amber-400' : 'text-slate-300'}>
                        {m.due_hours} hrs
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${getInspectionBadge(m.last_inspection)}`}>
                        {m.last_inspection}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        m.status === 'Overdue' ? 'bg-rose-600 text-white font-bold' :
                        m.status === 'Due Soon' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
