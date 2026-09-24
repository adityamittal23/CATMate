import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Play, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  BookOpen, 
  Video, 
  Tv, 
  UserCheck, 
  Clock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TrainingView: React.FC = () => {
  const { telemetry, theme } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    walkaround_tires_tracks: true,
    fluid_levels_checked: true,
    seatbelt_harness_latched: true,
    fire_extinguisher_pressurized: false,
    backup_alarm_tested: true,
  });

  const operatorId = telemetry?.operator_id || 'OP0001';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/operators/${encodeURIComponent(operatorId)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch operator profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [operatorId]);

  const toggleCheck = (k: string) => {
    setChecklist(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white flex items-center gap-2">
            <GraduationCap className="text-[#FFCD11]" />
            <span>Operator Training & Simulation Hub</span>
          </h2>
          <p className="text-xs text-slate-400">
            Skill-gated task qualification, Caterpillar e-learning modules, certified instructor coaching, and cab simulator pre-ops.
          </p>
        </div>

        {profile && (
          <div className="bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Current Operator:</span>
            <span className="text-[#FFCD11] font-bold">{operatorId}</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">
              {profile.operator.skill} Level
            </span>
          </div>
        )}
      </div>

      {/* Operator Certification & Skill Gating Strip */}
      {profile && (
        <div className={`p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200 flex items-center gap-2">
              <Award className="text-[#FFCD11]" size={16} />
              <span>Skill Gating & Authorized Task Assignment</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Experience: {profile.operator.experience_yrs} Years
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Authorized */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2 font-mono uppercase text-[11px]">
                <CheckCircle2 size={14} />
                <span>Authorized Solo Tasks</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skill_gating.allowed_tasks.map((task: string) => (
                  <span key={task} className="bg-emerald-900/60 text-emerald-200 px-2 py-1 rounded text-[11px]">
                    {task}
                  </span>
                ))}
              </div>
            </div>

            {/* Supervised */}
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-2 font-mono uppercase text-[11px]">
                <Clock size={14} />
                <span>Supervised Approval Tasks</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skill_gating.supervised_tasks.length > 0 ? (
                  profile.skill_gating.supervised_tasks.map((task: string) => (
                    <span key={task} className="bg-amber-900/60 text-amber-200 px-2 py-1 rounded text-[11px]">
                      {task}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">None (Fully Cleared)</span>
                )}
              </div>
            </div>

            {/* Restricted / Training Required */}
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
              <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-2 font-mono uppercase text-[11px]">
                <Lock size={14} />
                <span>Gated / Course Prerequisite</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skill_gating.restricted_tasks.length > 0 ? (
                  profile.skill_gating.restricted_tasks.map((task: string) => (
                    <span key={task} className="bg-rose-900/60 text-rose-200 px-2 py-1 rounded text-[11px]">
                      {task}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">None (Senior Operator)</span>
                )}
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold mr-2">Earned Badges:</span>
            {profile.badges.map((b: any) => (
              <span
                key={b.title}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                  b.earned
                    ? 'bg-[#FFCD11]/20 text-[#FFCD11] border border-[#FFCD11]/40'
                    : 'bg-neutral-800/60 text-slate-500 border border-neutral-700/50 line-through'
                }`}
              >
                <Award size={12} />
                <span>{b.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: E-Learning Catalog & In-Cab Sim / Instructor Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* E-Learning Video Catalog (7 cols) */}
        <div className={`lg:col-span-7 p-4 rounded-xl border ${
          theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-[#FFCD11]" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                Recommended E-Learning Catalog
              </h3>
            </div>
            <span className="text-xs font-mono text-[#FFCD11]">Caterpillar University</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(profile?.skill_gating?.recommended_courses || [
              { id: "CAT-101", title: "Heavy Equipment Fundamentals & Cab Controls", duration: "45 min", level: "Beginner" },
              { id: "CAT-201", title: "Deep Trenching Safety & Soil Mechanics", duration: "60 min", level: "Intermediate" },
              { id: "CAT-202", title: "Grade Control 3D GPS Precision Operation", duration: "50 min", level: "Intermediate" },
              { id: "CAT-203", title: "Eco-Operating: Minimizing Idle Burn & Wear", duration: "35 min", level: "Intermediate" }
            ]).map((course: any) => (
              <div 
                key={course.id}
                onClick={() => setSelectedVideo(course)}
                className="group cursor-pointer p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#FFCD11] transition-all"
              >
                <div className="relative aspect-video rounded bg-neutral-800 flex items-center justify-center mb-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="w-10 h-10 rounded-full bg-[#FFCD11] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                    <Play size={18} className="ml-0.5" />
                  </div>
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/80 text-slate-300 font-mono px-1.5 py-0.5 rounded z-10">
                    {course.duration}
                  </span>
                  <span className="absolute top-2 right-2 text-[9px] bg-[#FFCD11] text-black font-bold uppercase px-1.5 py-0.5 rounded z-10">
                    {course.level}
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#FFCD11] transition-colors line-clamp-1">
                  {course.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Module {course.id} • Certified Video Card
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulator Entry & Instructor Booking (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Virtual Cab Simulator Pre-Op Entry Point */}
          <div className={`p-4 rounded-xl border ${
            theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tv size={18} className="text-[#FFCD11]" />
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                  Pre-Op Simulator Checklist
                </h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                allChecked ? 'bg-emerald-500 text-black' : 'bg-amber-400 text-black'
              }`}>
                {allChecked ? 'READY FOR RUN' : 'ACTION PENDING'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Complete digital pre-operation safety walkaround before engaging simulator hydraulics.
            </p>

            <div className="space-y-2 text-xs">
              {Object.entries({
                walkaround_tires_tracks: 'Visual walkaround: check track tension / tire lugs',
                fluid_levels_checked: 'Engine oil, coolant & hydraulic fluid dipsticks verified',
                seatbelt_harness_latched: 'Seatbelt latch and retractor mechanism operational',
                fire_extinguisher_pressurized: 'Cab fire extinguisher gauge in green band',
                backup_alarm_tested: 'Reverse travel horn & strobe alarm operational'
              }).map(([key, desc]) => (
                <label 
                  key={key} 
                  className="flex items-start gap-2 p-2 rounded bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={checklist[key]}
                    onChange={() => toggleCheck(key)}
                    className="accent-[#FFCD11] mt-0.5"
                  />
                  <span className={`text-[11px] ${checklist[key] ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {desc}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={() => alert("Launching Caterpillar In-Cab Virtual Simulator session on workstation screen.")}
              disabled={!allChecked}
              className="w-full mt-3 py-2 bg-[#FFCD11] hover:bg-yellow-400 disabled:opacity-40 disabled:hover:bg-[#FFCD11] text-black font-heading font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow cab-tap-target"
            >
              Launch Virtual Cab Simulation
            </button>
          </div>

          {/* Instructor 1-on-1 Booking */}
          <div className={`p-4 rounded-xl border ${
            theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#181818] border-neutral-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-[#FFCD11]" />
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-200">
                  Book 1-on-1 Certified Instructor
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Schedule in-cab or virtual coaching with a Caterpillar Master Field Trainer.
            </p>

            <div className="space-y-2">
              {(profile?.instructor_slots || []).map((slot: any) => {
                const isBooked = bookedSlot === slot.id;
                return (
                  <div 
                    key={slot.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isBooked 
                        ? 'bg-emerald-950/20 border-emerald-500/50' 
                        : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white">{slot.instructor}</div>
                      <div className="text-[10px] text-slate-400">{slot.topic}</div>
                      <div className="text-[10px] text-[#FFCD11] font-mono mt-0.5">{slot.date}</div>
                    </div>

                    <button
                      onClick={() => setBookedSlot(isBooked ? null : slot.id)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        isBooked
                          ? 'bg-emerald-500 text-black'
                          : 'bg-neutral-800 hover:bg-[#FFCD11] hover:text-black text-slate-200'
                      }`}
                    >
                      {isBooked ? 'Booked!' : 'Reserve Slot'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Preview */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-neutral-700 rounded-xl p-6 max-w-lg w-full text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] text-[#FFCD11] uppercase font-bold">
                {selectedVideo.id} • {selectedVideo.level}
              </span>
              <button onClick={() => setSelectedVideo(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
            <h3 className="font-heading font-black text-xl text-white mb-2">
              {selectedVideo.title}
            </h3>
            <div className="aspect-video bg-black rounded-lg flex flex-col items-center justify-center p-6 text-center border border-neutral-800 my-3">
              <div className="w-14 h-14 rounded-full bg-[#FFCD11] text-black flex items-center justify-center mb-2 shadow-lg animate-pulse">
                <Play size={24} className="ml-1" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Interactive Video Lesson Ready</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1">Duration: {selectedVideo.duration} • HD 1080p Stream</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-200 font-bold rounded text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Course ${selectedVideo.id} completed. Training hours credited to ${operatorId}.`);
                  setSelectedVideo(null);
                }}
                className="px-4 py-2 bg-[#FFCD11] hover:bg-yellow-400 text-black font-heading font-bold text-xs uppercase tracking-wider rounded"
              >
                Complete & Credit Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
