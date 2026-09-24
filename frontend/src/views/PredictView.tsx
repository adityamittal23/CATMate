import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Layers, 
  Info, 
  CheckCircle, 
  SlidersHorizontal, 
  ChevronRight, 
  HelpCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../context/AppContext';

export const PredictView: React.FC = () => {
  const { telemetry, theme } = useApp();

  // Form parameters initialized from current live telemetry
  const [taskType, setTaskType] = useState('Earth Excavation');
  const [weather, setWeather] = useState('Sunny');
  const [terrain, setTerrain] = useState('Flat');
  const [operatorSkill, setOperatorSkill] = useState('Intermediate');
  const [operatorExp, setOperatorExp] = useState(5.0);
  const [machineType, setMachineType] = useState('Excavator');
  const [machineAge, setMachineAge] = useState(3.0);
  const [temperature, setTemperature] = useState(32.0);
  const [estimatedTime, setEstimatedTime] = useState(60.0);

  // Sync with current telemetry when loaded
  useEffect(() => {
    if (telemetry) {
      setTaskType(telemetry.task_type || 'Earth Excavation');
      setWeather(telemetry.weather || 'Sunny');
      setTerrain(telemetry.terrain || 'Flat');
      setOperatorSkill(telemetry.operator_skill || 'Intermediate');
      setOperatorExp(telemetry.operator_experience_yrs || 5.0);
      setMachineType(telemetry.machine_type || 'Excavator');
      setMachineAge(telemetry.machine_age_yrs || 3.0);
      setTemperature(telemetry.temperature_c || 32.0);
      setEstimatedTime(telemetry.estimated_time_min || 60.0);
    }
  }, [telemetry?.task_id]);

  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [deviationStats, setDeviationStats] = useState<any>(null);

  // Fetch model info & deviation stats
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [infoRes, statsRes] = await Promise.all([
          fetch('/api/predict/model-info'),
          fetch('/api/tasks/deviation-stats')
        ]);
        if (infoRes.ok) setModelInfo(await infoRes.json());
        if (statsRes.ok) setDeviationStats(await statsRes.json());
      } catch (err) {
        console.error('Failed to load predict metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Run prediction
  const runPrediction = async () => {
    try {
      setPredicting(true);
      const res = await fetch('/api/predict/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: taskType,
          weather: weather,
          terrain: terrain,
          operator_skill: operatorSkill,
          operator_experience_yrs: Number(operatorExp),
          machine_type: machineType,
          machine_age_yrs: Number(machineAge),
          temperature_c: Number(temperature),
          estimated_time_min: Number(estimatedTime)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (err) {
      console.error('Prediction request error:', err);
    } finally {
      setPredicting(false);
    }
  };

  // Run on mount or when parameters change
  useEffect(() => {
    runPrediction();
  }, [taskType, weather, terrain, operatorSkill, operatorExp, machineType, machineAge, temperature, estimatedTime]);

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
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white flex items-center gap-2">
            <Calculator className="text-[#FFCD11]" />
            <span>Task Time Estimation (ML Co-Pilot)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Trained RandomForestRegressor predicting task duration from environmental & equipment conditions with plain-English explainability.
          </p>
        </div>

        {modelInfo && (
          <div className="bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Model Accuracy:</span>
            <span className="text-emerald-400 font-bold">R² {modelInfo.metrics.r2}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">MAE {modelInfo.metrics.mae} min</span>
            <span className="text-[10px] text-slate-500">(Planner MAE: {modelInfo.metrics.baseline_mae}m)</span>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive What-If Calculator & ML Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Parameters Form (5 cols) */}
        <div className={`lg:col-span-5 p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Task & Operational Conditions
              </h3>
            </div>
            <button
              onClick={() => {
                if (telemetry) {
                  setTaskType(telemetry.task_type);
                  setWeather(telemetry.weather);
                  setTerrain(telemetry.terrain);
                  setOperatorSkill(telemetry.operator_skill);
                  setOperatorExp(telemetry.operator_experience_yrs);
                  setMachineType(telemetry.machine_type);
                  setMachineAge(telemetry.machine_age_yrs);
                  setTemperature(telemetry.temperature_c);
                  setEstimatedTime(telemetry.estimated_time_min);
                }
              }}
              className="text-[11px] text-[#FFCD11] hover:underline font-mono"
            >
              Reset to Current Session
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Task Type */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 font-medium text-white focus:outline-none focus:border-[#FFCD11]"
              >
                <option value="Earth Excavation">Earth Excavation</option>
                <option value="Trenching">Trenching</option>
                <option value="Material Loading">Material Loading</option>
                <option value="Grading">Grading</option>
                <option value="Demolition">Demolition</option>
                <option value="Hauling">Hauling</option>
                <option value="Compaction">Compaction</option>
              </select>
            </div>

            {/* Weather & Temperature */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Weather</label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Windy">Windy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Foggy">Foggy</option>
                  <option value="Snowy">Snowy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ambient Temp (°C)</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Terrain & Machine Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ground Terrain</label>
                <select
                  value={terrain}
                  onChange={(e) => setTerrain(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="Flat">Flat</option>
                  <option value="Uneven">Uneven</option>
                  <option value="Rocky">Rocky</option>
                  <option value="Muddy">Muddy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Machine Type</label>
                <select
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="Excavator">Excavator</option>
                  <option value="Wheel Loader">Wheel Loader</option>
                  <option value="Track-Type Tractor">Track-Type Tractor</option>
                  <option value="Motor Grader">Motor Grader</option>
                  <option value="Articulated Truck">Articulated Truck</option>
                  <option value="Backhoe Loader">Backhoe Loader</option>
                </select>
              </div>
            </div>

            {/* Operator Skill & Experience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Operator Skill</label>
                <select
                  value={operatorSkill}
                  onChange={(e) => setOperatorSkill(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={operatorExp}
                  onChange={(e) => setOperatorExp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Planned Estimated Time (Baseline Planner) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Machine Age (Yrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={machineAge}
                  onChange={(e) => setMachineAge(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Planner Estimate (min)</label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Results & Explainable AI (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {prediction && (
            <div className={`p-5 rounded-xl border ${
              theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
            }`}>
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#FFCD11]" />
                  <h3 className="font-heading font-black text-lg uppercase tracking-wider text-white">
                    ML Estimated Task Duration
                  </h3>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold border ${getDeviationBadge(prediction.deviation_category)}`}>
                  Expected: {prediction.deviation_category}
                </span>
              </div>

              {/* Big Comparison Display */}
              <div className="grid grid-cols-3 gap-3 my-4">
                {/* Predicted Duration */}
                <div className="p-3.5 rounded-lg bg-neutral-900 border border-[#FFCD11]/50 text-center">
                  <div className="text-[10px] text-[#FFCD11] font-mono uppercase font-bold">ML Model Prediction</div>
                  <div className="font-heading font-black text-3xl text-white mt-0.5">
                    {prediction.predicted_time_min}
                    <span className="text-xs font-normal text-slate-400 ml-1">min</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Band: {prediction.confidence_band.lower_bound_min} - {prediction.confidence_band.upper_bound_min}m
                  </div>
                </div>

                {/* Planner Baseline */}
                <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Planner Baseline</div>
                  <div className="font-heading font-black text-3xl text-slate-200 mt-0.5">
                    {prediction.estimated_time_min}
                    <span className="text-xs font-normal text-slate-400 ml-1">min</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Diff: {prediction.expected_deviation_min > 0 ? `+${prediction.expected_deviation_min}` : prediction.expected_deviation_min}m ({prediction.expected_deviation_pct}%)
                  </div>
                </div>

                {/* Historical Benchmark */}
                <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Fleet Task Avg</div>
                  <div className="font-heading font-black text-3xl text-slate-300 mt-0.5">
                    {prediction.historical_task_mean}
                    <span className="text-xs font-normal text-slate-400 ml-1">min</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {taskType} Benchmark
                  </div>
                </div>
              </div>

              {/* Explainable AI "Why" Plain-English Box */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-neutral-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#FFCD11] uppercase font-mono text-[11px]">
                  <Info size={14} />
                  <span>Caterpillar AI Telematics Rationale (Explainable AI)</span>
                </div>
                <p className="leading-relaxed text-slate-200 font-medium bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                  "{prediction.plain_english_why}"
                </p>

                {/* Factors Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-slate-400">Weather ({weather}):</span>
                    <strong className={prediction.factors.weather_impact_min > 0 ? 'text-amber-400 block' : 'text-emerald-400 block'}>
                      {prediction.factors.weather_impact_min > 0 ? `+${prediction.factors.weather_impact_min} min` : `${prediction.factors.weather_impact_min} min`}
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-slate-400">Skill ({operatorSkill}):</span>
                    <strong className={prediction.factors.skill_impact_min > 0 ? 'text-amber-400 block' : 'text-emerald-400 block'}>
                      {prediction.factors.skill_impact_min > 0 ? `+${prediction.factors.skill_impact_min} min` : `${prediction.factors.skill_impact_min} min`}
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-slate-400">Terrain ({terrain}):</span>
                    <strong className={prediction.factors.terrain_impact_min > 0 ? 'text-amber-400 block' : 'text-emerald-400 block'}>
                      {prediction.factors.terrain_impact_min > 0 ? `+${prediction.factors.terrain_impact_min} min` : `${prediction.factors.terrain_impact_min} min`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Deviation Trends Chart (Dataset Insight) */}
      {deviationStats && (
        <div className={`p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Historical Task Accuracy & Deviation Categories by Task Type
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">On Target: {deviationStats.overall_distribution['On Target']}</span>
              <span>•</span>
              <span className="text-sky-400 font-bold">Over Est: {deviationStats.overall_distribution['Over Estimate']}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">Under Est: {deviationStats.overall_distribution['Under Estimate']}</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationStats.by_task_type} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="task_type" tick={{ fill: '#a3a3a3', fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="on_target" name="On Target (±10%)" fill="#10b981" stackId="a" />
                <Bar dataKey="over_estimate" name="Over Estimate" fill="#38bdf8" stackId="a" />
                <Bar dataKey="under_estimate" name="Under Estimate" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
