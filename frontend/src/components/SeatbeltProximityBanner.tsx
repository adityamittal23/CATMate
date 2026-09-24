import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, UserCheck, BellRing } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTooltip } from './DataTooltip';

export const SeatbeltProximityBanner: React.FC = () => {
  const { telemetry, t } = useApp();

  if (!telemetry) return null;

  const isSeatbeltFastened = telemetry.seatbelt_status === 'Fastened';
  const isProximityHazard = telemetry.proximity_alert_triggered === 'Yes';
  const hasSafetyAlert = telemetry.safety_alert_triggered === 'Yes';

  return (
    <div className="space-y-2">
      {/* Proximity Danger Banner if Triggered */}
      {isProximityHazard && (
        <div className="bg-rose-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-lg shadow-rose-900/40 animate-pulse border-2 border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-black/30 p-2 rounded-lg">
              <AlertTriangle size={24} className="text-[#FFCD11]" />
            </div>
            <div>
              <div className="font-heading font-black text-base uppercase tracking-wider flex items-center gap-2">
                <span>{t('prox_hazard')}</span>
                <span className="bg-black text-[#FFCD11] text-[10px] px-2 py-0.5 rounded font-mono font-bold">FR2.2 ACTIVE</span>
              </div>
              <p className="text-xs text-rose-100 font-medium">
                Object / Ground Personnel within blindspot detection zone! Check mirrors & stop swing immediately.
              </p>
            </div>
          </div>
          <button 
            onClick={() => alert("Hazard acknowledgment registered. Audible cab buzzer muted for 30 seconds.")}
            className="px-3.5 py-1.5 bg-black hover:bg-neutral-900 text-[#FFCD11] font-heading font-bold text-xs uppercase tracking-wider rounded border border-[#FFCD11]/40 cab-tap-target"
          >
            Acknowledge Hazard
          </button>
        </div>
      )}

      {/* Safety Alert Row Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Seatbelt Status Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
          isSeatbeltFastened 
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/60 text-rose-300 animate-pulse'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isSeatbeltFastened ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isSeatbeltFastened ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Seatbelt Interlock System</span>
                <DataTooltip columnKey="seatbelt_status" />
              </div>
              <div className="font-heading font-bold text-base uppercase tracking-wide flex items-center gap-2">
                <span>{isSeatbeltFastened ? t('seatbelt_fastened') : t('seatbelt_unfastened')}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isSeatbeltFastened ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-600 text-white'
                }`}>
                  {isSeatbeltFastened ? 'COMPLIANT' : 'INFRACTION LOGGED'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Sensor FR2.1</div>
            <div className="text-white font-bold">{isSeatbeltFastened ? 'Latch Engaged' : 'Buckle Open'}</div>
          </div>
        </div>

        {/* Safety Watchdog Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          !hasSafetyAlert
            ? 'bg-neutral-900/60 border-neutral-800 text-slate-300'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${!hasSafetyAlert ? 'bg-neutral-800 text-slate-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <BellRing size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Shift Safety Watchdog</span>
                <DataTooltip columnKey="safety_alert_triggered" />
              </div>
              <div className="font-heading font-bold text-base uppercase tracking-wide">
                {hasSafetyAlert ? 'Safety Alert Logged This Session' : 'No Critical Site Alerts'}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Operator: <span className="text-[#FFCD11] font-bold">{telemetry.operator_id}</span></div>
            <div>Skill: <span className="text-white font-bold">{telemetry.operator_skill}</span> ({telemetry.operator_experience_yrs}y)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
