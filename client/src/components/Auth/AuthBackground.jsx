import { Moon, Star } from 'lucide-react';

export default function AuthBackground({ isBrandSide = false }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Base Geometric Pattern - Very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 0l14.142 14.142L30 28.284 15.858 14.142 30 0zm0 60L15.858 45.858 30 31.716l14.142 14.142L30 60zm30-30L45.858 44.142 31.716 30l14.142-14.142L60 30zM0 30l14.142-14.142L28.284 30 14.142 44.142 0 30z' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Drifting Stars - Only visible if motion is allowed */}
      <div className="absolute inset-0 motion-safe:animate-[drift_40s_linear_infinite]">
        <Star className="absolute top-[10%] left-[20%] w-4 h-4 text-amber-200/20 fill-amber-200/10 motion-safe:animate-pulse" />
        <Star className="absolute top-[30%] right-[15%] w-6 h-6 text-indigo-200/20 fill-indigo-200/10 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />
        <Star className="absolute bottom-[25%] left-[30%] w-5 h-5 text-amber-200/15 fill-amber-200/5 motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
        <Star className="absolute top-[60%] right-[25%] w-3 h-3 text-white/20 fill-white/10 motion-safe:animate-pulse" />
        <Moon className="absolute top-[15%] left-[60%] w-8 h-8 text-amber-500/10 -rotate-12" strokeWidth={1} />
        <Moon className="absolute bottom-[20%] right-[40%] w-12 h-12 text-indigo-500/10 rotate-45" strokeWidth={1} />
      </div>
      
      <div className="absolute inset-0 motion-safe:animate-[drift_60s_linear_infinite_reverse] opacity-50">
        <Star className="absolute top-[40%] left-[10%] w-3 h-3 text-amber-200/20 fill-amber-200/10 motion-safe:animate-pulse" />
        <Star className="absolute bottom-[40%] right-[10%] w-5 h-5 text-indigo-200/20 fill-indigo-200/10 motion-safe:animate-[pulse_3.5s_ease-in-out_infinite]" />
      </div>

      {/* Radial Gradient for depth */}
      {isBrandSide ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-80 mix-blend-screen"></div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-[#050b18]/80 to-[#050b18]"></div>
      )}
    </div>
  );
}
