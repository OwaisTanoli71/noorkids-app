import { useState, useRef, useEffect } from 'react';
import { getStoryAudioUrl } from '../services/speech';
import { Play, Pause, AlertTriangle } from 'lucide-react';

function AudioPlayer({ storyId, audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    // Reset state if source changes
    setIsPlaying(false);
    setCurrentTime(0);
    setError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [storyId, audioUrl]);

  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.target !== audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    
    // Add event listener to document in capturing phase to catch all play events
    document.addEventListener('play', handleGlobalPlay, true);
    return () => {
      document.removeEventListener('play', handleGlobalPlay, true);
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("Audio playback failed", e);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const onSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeSpeed = () => {
    let newRate = 1;
    if (playbackRate === 1) newRate = 1.25;
    else if (playbackRate === 1.25) newRate = 0.75;
    
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 mt-6 flex items-center justify-center gap-3 text-rose-300">
        <AlertTriangle />
        <span>Oops! The audio for this story isn't ready yet.</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xl border border-white/5">
      
      <audio
        ref={audioRef}
        src={audioUrl || getStoryAudioUrl(storyId)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
      />

      {/* Play/Pause Button */}
      <button 
        onClick={togglePlayPause}
        className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
      >
        {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
      </button>

      {/* Progress Bar & Timers */}
      <div className="flex-1 w-full flex items-center gap-4">
        <span className="text-slate-400 font-mono w-12 text-right text-sm">
          {formatTime(currentTime)}
        </span>
        
        <div className="relative flex-1 h-3 flex items-center group">
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={currentTime} 
            onChange={onSeek}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Custom track */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          {/* Custom thumb */}
          <div 
            className="absolute h-4 w-4 bg-white rounded-full shadow border-2 border-amber-500 pointer-events-none group-hover:scale-125 transition-transform"
            style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
          />
        </div>
        
        <span className="text-slate-400 font-mono w-12 text-left text-sm">
          {formatTime(duration)}
        </span>
      </div>

      {/* Speed Toggle */}
      <button 
        onClick={changeSpeed}
        className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full font-bold text-sm transition-colors shrink-0 text-slate-200 border border-white/5"
      >
        {playbackRate}x
      </button>

    </div>
  );
}

export default AudioPlayer;
