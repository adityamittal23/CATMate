import React from 'react';
import { 
  Sun, 
  Moon, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Languages, 
  HardHat, 
  Gauge, 
  ShieldAlert, 
  Wrench, 
  Calculator, 
  BellRing, 
  GraduationCap 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    site,
    setSite,
    sites,
    machineId,
    setMachineId,
    machines,
    telemetry,
    theme,
    toggleTheme,
    language,
    setLanguage,
    activeTab,
    setActiveTab,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    stepPlayback,
    resetPlayback,
    t
  } = useApp();

  const currentMachine = machines.find(m => m.machine_id === machineId);

  const navItems = [
    { id: 'dashboard', label: t('tab_dashboard'), icon: Gauge },
    { id: 'safety', label: t('tab_safety'), icon: ShieldAlert },
    { id: 'maintenance', label: t('tab_maintenance'), icon: Wrench },
    { id: 'predict', label: t('tab_predict'), icon: Calculator },
    { id: 'anomaly', label: t('tab_anomaly'), icon: BellRing },
    { id: 'training', label: t('tab_training'), icon: GraduationCap },
  ];

  const currentIdx = telemetry?._playback?.current_index ?? 0;
  const totalRecords = telemetry?._playback?.total_records ?? 1;

  return (
    <header className={`border-b transition-colors duration-200 sticky top-0 z-40 ${
      theme === 'day' ? 'bg-white border-slate-300' : 'bg-[#181818] border-neutral-800'
    }`}>
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-[#FFCD11] text-black font-extrabold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm">
            <span className="font-heading text-xl tracking-tighter">CAT</span>
            <span className="text-[10px] bg-black text-white px-1 py-0.5 rounded font-mono font-bold tracking-widest">IQ</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-heading uppercase tracking-wide leading-none flex items-center gap-2">
              <span>{t('app_title')}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {t('app_subtitle')}
            </p>
          </div>
        </div>

        {/* Global Selectors: Site & Machine */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Site Selector */}
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-black/40 border border-neutral-700/60 rounded px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium hidden md:inline">Site:</span>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer text-slate-200"
            >
              {sites.map(s => (
                <option key={s} value={s} className="bg-[#222] text-white">
                  {s.replace('Site-', '').replace('-', ' - ')}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Selector */}
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-black/40 border border-neutral-700/60 rounded px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium hidden md:inline">Machine:</span>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="bg-transparent font-semibold text-[#FFCD11] focus:outline-none cursor-pointer"
            >
              {machines.map(m => (
                <option key={m.machine_id} value={m.machine_id} className="bg-[#222] text-white">
                  {m.machine_id} • {m.machine_model} ({m.machine_type})
                </option>
              ))}
            </select>
            {currentMachine?.maintenance_overdue && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse" title="Maintenance Overdue!">
                PM DUE
              </span>
            )}
          </div>

          {/* Day / Night Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded border transition-colors ${
              theme === 'day' 
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300' 
                : 'bg-neutral-800 hover:bg-neutral-700 text-[#FFCD11] border-neutral-700'
            }`}
            title={theme === 'day' ? t('night_mode') : t('day_mode')}
          >
            {theme === 'day' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-slate-200"
            title="Toggle Language (EN / हिन्दी)"
          >
            <Languages size={14} className="text-[#FFCD11]" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Stream Simulation Replay Bar */}
      <div className={`border-t px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
        theme === 'day' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#141414] border-neutral-800/80 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#FFCD11] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            LIVE TELEMETRY STREAM
          </span>
          <span className="hidden sm:inline text-neutral-500">|</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Session: <span className="text-white font-bold">{telemetry?.task_id || '---'}</span> ({telemetry?.task_date || '---'})
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => resetPlayback(false)}
            className="p-1 rounded hover:bg-neutral-700/50 text-slate-400 hover:text-white"
            title="Jump to first session"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => stepPlayback(-1)}
            disabled={!telemetry?._playback?.has_prev}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-slate-200 text-[11px] font-medium flex items-center gap-1"
            title="Previous session"
          >
            <SkipBack size={12} />
            <span className="hidden sm:inline">{t('step_prev')}</span>
          </button>
          
          <button
            onClick={togglePlay}
            className={`px-3 py-1 rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm ${
              isPlaying 
                ? 'bg-amber-500 text-black hover:bg-amber-400' 
                : 'bg-[#FFCD11] text-black hover:bg-yellow-400'
            }`}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? t('pause') : t('play')}</span>
          </button>

          <button
            onClick={() => stepPlayback(1)}
            disabled={!telemetry?._playback?.has_next}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-slate-200 text-[11px] font-medium flex items-center gap-1"
            title="Next session"
          >
            <span className="hidden sm:inline">{t('step_next')}</span>
            <SkipForward size={12} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px]">
            <span className="text-slate-400 font-mono">Rate:</span>
            {[1, 2, 5].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-1 rounded font-bold ${playbackSpeed === speed ? 'bg-[#FFCD11] text-black' : 'text-slate-400 hover:text-white'}`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="font-mono text-[11px] text-slate-400 ml-2">
            <span className="text-[#FFCD11] font-bold">{currentIdx + 1}</span> / {totalRecords}
          </div>
        </div>
      </div>

      {/* Main Module Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 flex overflow-x-auto gap-1 py-1.5 scrollbar-none">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap cab-tap-target ${
                isActive
                  ? 'border-b-2 border-[#FFCD11] text-[#FFCD11] bg-neutral-800/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/30'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#FFCD11]' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
