import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Flame, Star, BookOpen } from 'lucide-react';

function Dashboard() {
  const { profile } = useContext(AuthContext);

  const displayStoriesRead = profile?.storiesRead || 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12">
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(245,158,11,0.15)] bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300/50">
        
        {/* Decorative inner glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row gap-6 md:gap-8 justify-between items-center">
          
          <div className="text-center xl:text-left text-slate-900 flex-1">
            <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-sm">
              Assalamu Alaikum, <span className="whitespace-nowrap">{profile?.displayName || 'Friend'} 👋</span>
            </h2>
            <p className="text-xl md:text-2xl font-medium text-amber-900/80">
              Welcome back to your reading journey!
            </p>
          </div>

          <div className="flex gap-3 md:gap-4 flex-wrap justify-center shrink-0 pb-2 xl:pb-0 w-full xl:w-auto">
            
            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 md:px-6 py-4 shadow-xl border border-white/50 flex flex-col items-center min-w-[100px] md:min-w-[120px] transition-transform hover:scale-105">
              <div className="text-orange-500 mb-2 bg-orange-100 p-2 md:p-3 rounded-full">
                <Flame size={24} strokeWidth={2.5} className="md:w-7 md:h-7" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-slate-800">{profile?.streak || 0}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Day Streak</div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 md:px-6 py-4 shadow-xl border border-white/50 flex flex-col items-center min-w-[100px] md:min-w-[120px] transition-transform hover:scale-105">
              <div className="text-amber-500 mb-2 bg-amber-100 p-2 md:p-3 rounded-full">
                <Star size={24} strokeWidth={2.5} className="md:w-7 md:h-7" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-slate-800">{profile?.xp || 0}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total XP</div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 md:px-6 py-4 shadow-xl border border-white/50 flex flex-col items-center min-w-[100px] md:min-w-[120px] transition-transform hover:scale-105">
              <div className="text-blue-500 mb-2 bg-blue-100 p-2 md:p-3 rounded-full">
                <BookOpen size={24} strokeWidth={2.5} className="md:w-7 md:h-7" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-slate-800">{displayStoriesRead}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Story Reads</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;