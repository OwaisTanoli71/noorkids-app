import { useState, useRef, useEffect } from 'react';
import { getStoryAudioUrl } from '../services/speech';
import { Play, Pause, AlertTriangle } from 'lucide-react';

function AudioPlayer({ storyId, audioUrl, onTimeUpdate: parentOnTimeUpdate, compact = false, startTime = 0 }) {
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
    // Don't eagerly call .load() as it triggers network requests for all ayahs simultaneously
  }, [storyId, audioUrl]);

  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.target !== audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const isTextInput = e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'email' || e.target.type === 'password' || e.target.type === 'search');
        const isTextarea = e.target.tagName === 'TEXTAREA';
        
        if (!isTextInput && !isTextarea) {
          e.preventDefault();
          if (isPlaying) {
            audioRef.current.pause();
          } else {
            if (audioRef.current.currentTime < 0.1 && startTime > 0) {
              audioRef.current.currentTime = startTime;
            }
            audioRef.current.play().catch(err => {
              console.error("Audio playback failed", err);
              setError(true);
            });
          }
          setIsPlaying(!isPlaying);
        }
      }
    };
    
    // Add event listener to document in capturing phase to catch all play events
    document.addEventListener('play', handleGlobalPlay, true);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('play', handleGlobalPlay, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, startTime]);

  const togglePlayPause = (e) => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.currentTime < 0.1 && startTime > 0) {
        audioRef.current.currentTime = startTime;
      }
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed", err);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    const time = audioRef.current.currentTime;
    
    // FORCE SKIP: If audio is playing before startTime, aggressively jump it!
    if (startTime > 0 && time < startTime - 0.1) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      if (parentOnTimeUpdate) parentOnTimeUpdate(startTime);
      return;
    }

    setCurrentTime(time);
    if (parentOnTimeUpdate) {
      parentOnTimeUpdate(time);
    }
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const applyStartTime = () => {
      if (startTime > 0 && audio.currentTime < 0.1) {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
      }
    };

    if (audio.readyState >= 1) {
      applyStartTime();
    }
    
    audio.addEventListener('loadedmetadata', applyStartTime);
    audio.addEventListener('canplay', applyStartTime);
    
    return () => {
      audio.removeEventListener('loadedmetadata', applyStartTime);
      audio.removeEventListener('canplay', applyStartTime);
    };
  }, [startTime]);

  const onSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    if (parentOnTimeUpdate) {
      parentOnTimeUpdate(time);
    }
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
        <span>Oops! The audio could not be loaded right now. Please check your connection.</span>
      </div>
    );
  }

  return (
    <div className={`p-4 flex flex-row items-center gap-4 border border-white/5 shadow-2xl ${compact ? 'rounded-full bg-slate-900/30 backdrop-blur-md' : 'rounded-3xl mt-6 glass-panel p-6'}`}>
      
      <audio
        ref={audioRef}
        src={(audioUrl || getStoryAudioUrl(storyId)) + (startTime > 0 ? `#t=${startTime}` : '')}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error:", e.target.error);
          setError(true);
        }}
      />

      {/* Play/Pause Button */}
      <button 
        onClick={togglePlayPause}
        className={`bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)] ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}
      >
        {isPlaying ? <Pause fill="currentColor" size={compact ? 20 : 24} /> : <Play fill="currentColor" size={compact ? 20 : 24} className="ml-1" />}
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
