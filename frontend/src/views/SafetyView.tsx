import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Trophy, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Clock, 
  Calendar 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Incident, Operator } from '../types';

export const SafetyView: React.FC = () => {
  const { telemetry, site, machineId, theme } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [leaderboard, setLeaderboard] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New incident modal state
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState('Proximity Hazard Alert');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch incidents & leaderboard
  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, leadRes] = await Promise.all([
        fetch(`/api/incidents?site_id=${encodeURIComponent(site)}`),
        fetch(`/api/operators/leaderboard?site_id=${encodeURIComponent(site)}`)
      ]);
      if (incRes.ok) {
        const d = await incRes.json();
        setIncidents(d.incidents || []);
      }
      if (leadRes.ok) {
        const d = await leadRes.json();
        setLeaderboard(d.leaderboard || []);
      }
    } catch (err) {
      console.error('Safety data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [site]);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: telemetry?.task_id || 'LIVE-LOG',
          site_id: site,
          machine_id: machineId,
          machine_type: telemetry?.machine_type || 'Excavator',
          operator_id: telemetry?.operator_id || 'OP0001',
          type: newType,
          severity: newSeverity,
          notes: newNotes,
          proximity_alert: newType.includes('Proximity'),
          seatbelt_status: telemetry?.seatbelt_status || 'Fastened'
        })
      });
      if (res.ok) {
        setShowModal(false);
        setNewNotes('');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to log incident:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchesSev = !severityFilter || inc.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesQuery = !searchQuery || 
      inc.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.operator_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.machine_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'high':
        return 'bg-amber-500 text-black font-bold';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="text-[#FFCD11]" />
            <span>Safety & Hazard Guardian</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time compliance monitoring, proximity sensors, incident logs, and fleet safety leaderboard.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#FFCD11] hover:bg-yellow-400 text-black font-heading font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-md cab-tap-target"
        >
          <Plus size={16} />
          <span>Report Safety Incident</span>
        </button>
      </div>

      {/* Live In-Cab Safety Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Seatbelt Compliance */}
        <div className={`p-4 rounded-xl border ${
          telemetry?.seatbelt_status === 'Fastened'
            ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
            : 'bg-rose-950/30 border-rose-500/50 text-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Live Seatbelt Interlock</span>
            {telemetry?.seatbelt_status === 'Fastened' ? (
              <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                SECURE
              </span>
            ) : (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono animate-pulse">
                UNFASTENED
              </span>
            )}
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {telemetry?.seatbelt_status === 'Fastened' ? 'Buckled & Compliant' : 'Safety Harness Open'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {telemetry?.seatbelt_status === 'Fastened'
              ? 'Telemetry confirms continuous 3-point seatbelt engagement.'
              : 'Warning buzzer active in cab. OSHA regulation violation recorded.'}
          </p>
        </div>

        {/* Card 2: Proximity Hazard Sensor */}
        <div className={`p-4 rounded-xl border ${
          telemetry?.proximity_alert_triggered === 'Yes'
            ? 'bg-rose-950/40 border-rose-500/60 text-slate-200 animate-pulse'
            : 'bg-neutral-900 border-neutral-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Proximity Radar (FR2.2)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
              telemetry?.proximity_alert_triggered === 'Yes' ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-emerald-400'
            }`}>
              {telemetry?.proximity_alert_triggered === 'Yes' ? 'HAZARD BREACH' : 'ZONE CLEAR'}
            </span>
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {telemetry?.proximity_alert_triggered === 'Yes' ? 'Proximity Alert Active' : 'No Obstacles in Arc'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {telemetry?.proximity_alert_triggered === 'Yes'
              ? 'Sensor detects personnel or utility trench line in tailswing radius.'
              : '360° radar perimeter clear within 8-meter operating envelope.'}
          </p>
        </div>

        {/* Card 3: Operator Safety Score */}
        <div className="p-4 rounded-xl border bg-neutral-900 border-neutral-800 text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Operator Safety Index</span>
            <Trophy size={16} className="text-[#FFCD11]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-[#FFCD11]">
              {leaderboard.find(o => o.operator_id === telemetry?.operator_id)?.safety_score || 92.5}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Operator: <strong className="text-white">{telemetry?.operator_id}</strong></span>
            <span>Rank #{leaderboard.find(o => o.operator_id === telemetry?.operator_id)?.rank || 1} on Site</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Incident Log & Site Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident History (2 cols) */}
        <div className={`lg:col-span-2 p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Safety Incident Log ({filteredIncidents.length} events)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-slate-200 focus:outline-none focus:border-[#FFCD11]"
                />
              </div>

              {/* Severity filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="py-1.5 px-2 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Incident ID / Date</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Type & Note</th>
                  <th className="p-2.5">Machine & Operator</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredIncidents.slice(0, 30).map((inc) => (
                  <tr key={inc.incident_id} className="hover:bg-neutral-800/40">
                    <td className="p-2.5 font-mono text-slate-300">
                      <div className="font-bold text-white">{inc.incident_id}</div>
                      <div className="text-[10px] text-slate-400">{inc.task_date}</div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-2.5 max-w-xs">
                      <div className="font-bold text-slate-200">{inc.type}</div>
                      <div className="text-[11px] text-slate-400 truncate">{inc.notes}</div>
                    </td>
                    <td className="p-2.5 font-mono text-slate-300">
                      <div>{inc.machine_id}</div>
                      <div className="text-[10px] text-[#FFCD11]">{inc.operator_id}</div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-slate-300 border border-neutral-700">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operator Safety Leaderboard (1 col) */}
        <div className={`p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Safety Leaderboard ({site.replace('Site-', '')})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Rolling 40 Ops</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {leaderboard.map((op, idx) => (
              <div 
                key={op.operator_id}
                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  op.operator_id === telemetry?.operator_id 
                    ? 'bg-[#FFCD11]/10 border-[#FFCD11] text-white' 
                    : 'bg-neutral-900/60 border-neutral-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                    idx === 0 ? 'bg-[#FFCD11] text-black font-extrabold' :
                    idx === 1 ? 'bg-slate-300 text-black font-bold' :
                    idx === 2 ? 'bg-amber-700 text-white font-bold' : 'bg-neutral-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{op.operator_id}</span>
                      {op.operator_id === telemetry?.operator_id && (
                        <span className="text-[9px] bg-[#FFCD11] text-black px-1 rounded font-bold">YOU</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {op.skill} • {op.total_sessions} shifts
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-[#FFCD11] text-sm">{op.safety_score}</div>
                  <div className="text-[10px] text-slate-400">{op.seatbelt_compliance_pct}% belt</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Report Incident */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-neutral-700 rounded-xl p-6 max-w-lg w-full text-slate-200 shadow-2xl">
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="text-[#FFCD11]" />
              <span>Report In-Cab Safety Incident</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly log site hazards, proximity breaches, or mechanical warning events for safety audit.
            </p>

            <form onSubmit={handleReportIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Incident Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                >
                  <option value="Proximity Hazard Alert">Proximity Hazard Alert (Ground Worker/Object)</option>
                  <option value="Seatbelt Non-Compliance">Seatbelt Non-Compliance</option>
                  <option value="Trench Edge Stability Warning">Trench Edge Stability Warning</option>
                  <option value="Excessive Vibration Hazard">Excessive Vibration / Harsh Operation</option>
                  <option value="Engine Thermal Warning">Engine Thermal Warning</option>
                  <option value="Hydraulic Spike Warning">Hydraulic Spike Warning</option>
                  <option value="Blindspot Hazard Detected">Blindspot Hazard Detected</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Machine & Operator</label>
                  <input
                    type="text"
                    disabled
                    value={`${machineId} • ${telemetry?.operator_id}`}
                    className="w-full bg-neutral-900/60 border border-neutral-700 rounded p-2 text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Incident Notes / Description</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detail the circumstances, ground conditions, or spotter proximity..."
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-[#FFCD11]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-300 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#FFCD11] hover:bg-yellow-400 text-black font-heading font-bold uppercase tracking-wider rounded"
                >
                  {submitting ? 'Logging...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
