import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

const RadarScanner = ({ activeCount = 3 }) => {
  // Mock points for nearby food listings to display on the radar screen
  const radarPoints = [
    { id: 1, top: '25%', left: '40%', size: 'h-2 w-2', delay: 0 },
    { id: 2, top: '60%', left: '70%', size: 'h-3 w-3', delay: 1.2 },
    { id: 3, top: '45%', left: '25%', size: 'h-2 w-2', delay: 0.6 },
    { id: 4, top: '75%', left: '35%', size: 'h-2.5 w-2.5', delay: 1.8 },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden aspect-square flex flex-col items-center justify-center">
      {/* Outer grid overlay lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Cybernetic details */}
      <div className="absolute top-4 left-6 right-6 flex justify-between text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">
        <span>SYS.RADAR_v2.4</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          SCANNING 10KM RANGE
        </span>
      </div>

      {/* Main Radar Screen */}
      <div className="relative w-11/12 h-11/12 max-w-[320px] max-h-[320px] aspect-square rounded-full border border-emerald-500/20 bg-[radial-gradient(circle_at_center,rgba(6,78,59,0.15)_0%,rgba(2,44,34,0.4)_50%,rgba(2,44,34,0.8)_100%)] flex items-center justify-center shadow-inner">
        
        {/* Radar concentric circles */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-emerald-500/15" />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-emerald-500/10" />
        <div className="absolute w-[40%] h-[40%] rounded-full border border-emerald-500/10" />
        <div className="absolute w-[20%] h-[20%] rounded-full border border-emerald-500/5" />

        {/* Crosshair lines */}
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/10" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/10" />

        {/* Rotating sweep line */}
        <div className="absolute inset-0 rounded-full animate-radar-sweep origin-center pointer-events-none z-10">
          <div className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-1/2 bg-gradient-to-t from-transparent via-emerald-500/40 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <div className="absolute top-0 right-1/2 w-1/2 h-1/2 bg-gradient-to-tr from-transparent to-emerald-500/5 rounded-tr-full origin-bottom-left" />
        </div>

        {/* Pulsing Center Node */}
        <div className="relative z-20 flex items-center justify-center">
          <div className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center text-white shadow-glow">
            <Navigation size={10} className="fill-current" />
          </div>
        </div>

        {/* Active Ping Points (Donations) */}
        {radarPoints.slice(0, activeCount).map((point) => (
          <div
            key={point.id}
            style={{ top: point.top, left: point.left }}
            className="absolute z-20 pointer-events-none"
          >
            {/* Ping animation rings */}
            <div 
              style={{ animationDelay: `${point.delay}s` }} 
              className={`absolute -inset-2.5 rounded-full border border-emerald-400/40 animate-pulse-radar`} 
            />
            {/* Core Ping Dot */}
            <div 
              className={`${point.size} rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]`} 
            />
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] font-mono text-emerald-500/60">
        <span>LOC_LAT: 19.1136</span>
        <span>RADAR_MATCHES: {activeCount} ACTIVE</span>
      </div>
    </div>
  );
};

export default RadarScanner;
