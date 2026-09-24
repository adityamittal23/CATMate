import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TelemetrySnapshot, Machine, Operator } from '../types';
import { translations, Language } from '../translations';

interface AppContextType {
  site: string;
  setSite: (site: string) => void;
  machineId: string;
  setMachineId: (id: string) => void;
  sites: string[];
  machines: Machine[];
  telemetry: TelemetrySnapshot | null;
  loadingTelemetry: boolean;
  dataDictionary: Record<string, string>;
  theme: 'night' | 'day';
  setTheme: (t: 'night' | 'day') => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  stepPlayback: (offset: number) => Promise<void>;
  resetPlayback: (toLatest: boolean) => Promise<void>;
  refreshTelemetry: () => Promise<void>;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [site, setSiteState] = useState<string>('Site-A-Chennai');
  const [machineId, setMachineIdState] = useState<string>('M1001');
  const [sites, setSites] = useState<string[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(true);
  const [dataDictionary, setDataDictionary] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<'night' | 'day'>('night');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  // Translation helper
  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'night' ? 'day' : 'night'));
  };

  // Fetch initial metadata and dictionary
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [sitesRes, dictRes] = await Promise.all([
          fetch('/api/meta/sites').then(r => r.json()),
          fetch('/api/meta/dictionary').then(r => r.json())
        ]);
        if (Array.isArray(sitesRes) && sitesRes.length > 0) {
          setSites(sitesRes);
          setSiteState(sitesRes[0]);
        }
        if (dictRes) {
          setDataDictionary(dictRes);
        }
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
      }
    };
    fetchInit();
  }, []);

  // Fetch machines when site changes
  useEffect(() => {
    const fetchMachines = async () => {
      if (!site) return;
      try {
        const res = await fetch(`/api/meta/machines?site_id=${encodeURIComponent(site)}`);
        const data: Machine[] = await res.json();
        setMachines(data);
        if (data.length > 0) {
          // If current machineId is not in this site, switch to first machine in site
          const exists = data.some(m => m.machine_id === machineId);
          if (!exists) {
            setMachineIdState(data[0].machine_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch machines for site:', err);
      }
    };
    fetchMachines();
  }, [site]);

  // Fetch telemetry when machineId changes
  const fetchTelemetry = useCallback(async (mId = machineId, offset?: number) => {
    if (!mId) return;
    try {
      setLoadingTelemetry(true);
      const url = offset !== undefined 
        ? `/api/telemetry/snapshot?machine_id=${encodeURIComponent(mId)}&step_offset=${offset}`
        : `/api/telemetry/snapshot?machine_id=${encodeURIComponent(mId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: TelemetrySnapshot = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  }, [machineId]);

  useEffect(() => {
    if (machineId) {
      fetchTelemetry(machineId);
    }
  }, [machineId, fetchTelemetry]);

  // Step playback
  const stepPlayback = async (offset: number) => {
    await fetchTelemetry(machineId, offset);
  };

  const resetPlayback = async (toLatest: boolean) => {
    try {
      setLoadingTelemetry(true);
      const action = toLatest ? 'reset_latest' : 'reset_first';
      const res = await fetch('/api/telemetry/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, action })
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Playback reset error:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Auto-play interval simulation
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(800, 3000 / playbackSpeed);
    const interval = setInterval(async () => {
      if (!isPlayingRef.current) return;
      // Step forward by 1
      if (telemetry && telemetry._playback && telemetry._playback.has_next) {
        await stepPlayback(1);
      } else {
        // Loop back to start if reached end
        await resetPlayback(false);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, telemetry]);

  const setSite = (newSite: string) => {
    setSiteState(newSite);
  };

  const setMachineId = (newId: string) => {
    setMachineIdState(newId);
  };

  return (
    <AppContext.Provider
      value={{
        site,
        setSite,
        machineId,
        setMachineId,
        sites,
        machines,
        telemetry,
        loadingTelemetry,
        dataDictionary,
        theme,
        setTheme,
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
        refreshTelemetry: () => fetchTelemetry(machineId),
        t
      }}
    >
      <div className={theme === 'day' ? 'theme-day bg-slate-100 text-slate-900 min-h-screen' : 'theme-night bg-[#121212] text-slate-100 min-h-screen'}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
