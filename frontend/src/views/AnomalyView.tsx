import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  Flame, 
  Activity, 
  Clock, 
  CheckCircle, 
  ShieldAlert, 
  Filter, 
  Wrench, 
  CheckCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnomalyItem } from '../types';

export const AnomalyView: React.FC = () => {
  const { site, machineId, theme } = useApp();
  const [feed, setFeed] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [siteOnly, setSiteOnly] = useState(true);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const url = siteOnly 
        ? `/api/anomaly/feed?site_id=${encodeURIComponent(site)}${severityFilter ? `&min_severity=${severityFilter}` : ''}`
        : `/api/anomaly/feed${severityFilter ? `?min_severity=${severityFilter}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed || []);
      }
    } catch (err) {
      console.error('Failed to fetch anomaly feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [site, severityFilter, siteOnly]);

  const handleAcknowledge = async (item: AnomalyItem, actionTaken: string) => {
    try {
      const res = await fetch('/api/anomaly/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomaly_id: item.anomaly_id,
          action_taken: actionTaken
        })
      });
      if (res.ok) {
        setFeed(prev => prev.map(f => f.anomaly_id === item.anomaly_id ? { ...f, status: 'Resolved' } : f));
      }
    } catch (err) {
      console.error('Acknowledge error:', err);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 text-black font-bold';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const criticalCount = feed.filter(f => f.severity === 'CRITICAL' && f.status !== 'Resolved').length;
  const highCount = feed.filter(f => f.severity === 'HIGH' && f.status !== 'Resolved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white flex items-center gap-2">
            <BellRing className="text-[#FFCD11]" />
            <span>Attention Needed & Anomaly Feed</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multivariate outlier detection (Isolation Forest) paired with domain threshold triggers (vibration, heat, hydraulics, idling, PM).
          </p>
        </div>

        {/* Severity counts pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded bg-rose-600/20 border border-rose-500/40 text-rose-300 font-bold">
            {criticalCount} Critical
          </span>
          <span className="px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
            {highCount} High
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
        theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Filter Severity:</span>
          <div className="flex items-center gap-1.5">
            {['', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  severityFilter === sev
                    ? 'bg-[#FFCD11] text-black'
                    : 'bg-neutral-800 text-slate-300 hover:bg-neutral-700'
                }`}
              >
                {sev || 'All Alerts'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={siteOnly}
              onChange={(e) => setSiteOnly(e.target.checked)}
              className="accent-[#FFCD11]"
            />
            <span>Show Current Site Only ({site.replace('Site-', '')})</span>
          </label>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-[#FFCD11] border-t-transparent rounded-full mx-auto mb-3" />
            <p>Scanning telemetry patterns with Isolation Forest...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30 text-slate-400">
            <CheckCheck size={36} className="text-emerald-400 mx-auto mb-2" />
            <div className="font-heading font-bold text-lg text-white">All Clear!</div>
            <p className="text-xs">No unresolved operational anomalies or critical thresholds detected.</p>
          </div>
        ) : (
          feed.map(item => {
            const isResolved = item.status === 'Resolved';
            return (
              <div
                key={item.anomaly_id}
                className={`p-4 rounded-xl border transition-all ${
                  isResolved
                    ? 'opacity-60 bg-neutral-950/40 border-neutral-800/60'
                    : item.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : item.severity === 'HIGH'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-[#181818] border-neutral-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg mt-0.5 ${
                      item.severity === 'CRITICAL' ? 'bg-rose-600/30 text-rose-400' :
                      item.severity === 'HIGH' ? 'bg-amber-500/30 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="font-heading font-black text-base text-white tracking-wide">
                          {item.primary_issue}
                        </span>
                        {item.is_ml_outlier && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-500/40 font-mono">
                            ML OUTLIER (score: {item.iso_score})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-white font-bold">{item.machine_id}</span>
                    <span className="text-slate-400"> ({item.machine_type})</span>
                    <div className="text-[10px] text-[#FFCD11]">Operator: {item.operator_id}</div>
                    <div className="text-[10px] text-slate-500">{item.task_date}</div>
                  </div>
                </div>

                {/* Sensor telemetry metrics bar */}
                <div className="bg-black/40 p-2 rounded-lg grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-slate-400 my-2.5 border border-neutral-800">
                  <div>
                    <span>Temp: </span>
                    <strong className={item.sensor_readings.engine_temp_c > 100 ? 'text-rose-400' : 'text-slate-200'}>
                      {item.sensor_readings.engine_temp_c}°C
                    </strong>
                  </div>
                  <div>
                    <span>Hydraulic: </span>
                    <strong className={item.sensor_readings.hydraulic_pressure_psi < 2700 || item.sensor_readings.hydraulic_pressure_psi > 3750 ? 'text-rose-400' : 'text-slate-200'}>
                      {item.sensor_readings.hydraulic_pressure_psi} PSI
                    </strong>
                  </div>
                  <div>
                    <span>Oil: </span>
                    <strong className={item.sensor_readings.oil_pressure_psi < 42 ? 'text-rose-400' : 'text-slate-200'}>
                      {item.sensor_readings.oil_pressure_psi} PSI
                    </strong>
                  </div>
                  <div>
                    <span>Vibration: </span>
                    <strong className={item.sensor_readings.vibration_mm_s > 6.0 ? 'text-amber-400' : 'text-slate-200'}>
                      {item.sensor_readings.vibration_mm_s} mm/s
                    </strong>
                  </div>
                  <div>
                    <span>Idling: </span>
                    <strong className={item.sensor_readings.idling_time_min > 25 ? 'text-amber-400' : 'text-slate-200'}>
                      {item.sensor_readings.idling_time_min} min
                    </strong>
                  </div>
                </div>

                {/* Recommendation & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  <div className="text-slate-400">
                    <span className="text-[#FFCD11] font-semibold">Recommended Fix:</span> {item.recommended_action}
                  </div>

                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono text-[11px]">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcknowledge(item, 'Acknowledged in Cab')}
                          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-200 font-medium cab-tap-target"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleAcknowledge(item, 'Tech Dispatched')}
                          className="px-3 py-1.5 rounded bg-[#FFCD11] hover:bg-yellow-400 text-black font-heading font-bold uppercase tracking-wider cab-tap-target"
                        >
                          Dispatch Tech
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
