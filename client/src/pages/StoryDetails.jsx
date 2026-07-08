import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AIChat from "../components/AI/AIChat";
import ProgressBar from "../components/ProgressBar";
import AudioPlayer from "../components/AudioPlayer";
import { Volume2, VolumeX, Bot, ClipboardList, Bookmark, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../services/profile';

function StoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(id));
      
      const completed = JSON.parse(localStorage.getItem('completedStories') || '[]');
      setHasRead(completed.includes(id));
    }
  }, [id]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let newBookmarks;
    if (bookmarks.includes(id)) {
      newBookmarks = bookmarks.filter(b => b !== id);
      setIsBookmarked(false);
    } else {
      newBookmarks = [...bookmarks, id];
      setIsBookmarked(true);
    }
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const handleMarkAsRead = async () => {
    if (hasRead || updating || !user || !profile) {
      setHasRead(true);
      return;
    }
    setUpdating(true);
    
    try {
      // Do not update XP/Streak here, let Quiz handle it!
      
      if (user) {
        localStorage.removeItem(`lastOpenedStory_${user.id}`);
      }
      
      const completed = JSON.parse(localStorage.getItem('completedStories') || '[]');
      if (!completed.includes(id)) {
        localStorage.setItem('completedStories', JSON.stringify([...completed, id]));
      }
      
      setHasRead(true);
    } catch (err) {
      console.error("Error updating progress:", err);
      // Allow them to proceed locally even if network fails
      const completed = JSON.parse(localStorage.getItem('completedStories') || '[]');
      if (!completed.includes(id)) {
        localStorage.setItem('completedStories', JSON.stringify([...completed, id]));
      }
      setHasRead(true); 
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/stories/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        setStory(data);
        setLoading(false);
        
        // Track as last opened story if user is logged in
        if (user && data) {
           localStorage.setItem(`lastOpenedStory_${user.id}`, JSON.stringify({
             id: data.id,
             title: data.title
           }));
        }
      })
      .catch(err => {
        console.error(err);
        navigate("/stories");
      });
  }, [id, navigate, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 size={64} className="text-amber-400 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-amber-300">Loading your story...</h2>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h1 className="text-4xl font-bold mb-4">Story not found</h1>
        <button onClick={() => navigate('/stories')} className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
          <ArrowLeft size={20} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 text-white flex flex-col lg:flex-row gap-8 items-start pb-32 lg:pb-12">
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full min-w-0">
        
        {/* HERO SECTION - MATCHING USER SCREENSHOT */}
        <div className="bg-[#1e2332] rounded-[2.5rem] p-8 md:py-10 md:px-12 relative flex flex-col items-center justify-center min-h-[300px] shadow-2xl border border-white/5 mb-8">
          
          <button 
            onClick={() => navigate('/stories')}
            className="absolute top-6 left-6 md:top-8 md:left-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6 shadow-inner">
            🕌
          </div>

          <div className="inline-flex items-center gap-2 bg-[#131722] border border-white/5 px-4 py-1.5 rounded-full text-amber-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 shadow-sm">
            <Sparkles size={12} /> {story.category}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight text-center drop-shadow-md">
            {story.title}
          </h1>
          
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-[#2a3041] border border-white/5 flex items-center justify-center text-xs text-slate-400 font-bold uppercase">
              {story.difficulty?.charAt(0) || "E"}
            </div>
            <div className="bg-[#2a3041] border border-white/5 px-6 py-2.5 rounded-full text-sm font-bold text-slate-300 tracking-wide">
              {story.wordCount || "1000"} Words
            </div>
          </div>
        </div>

        {/* AUDIO PLAYER */}
        {showAudio && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <AudioPlayer storyId={story.id} />
          </div>
        )}

        {/* STORY TEXT (READ STORY THING) */}
        <div className="bg-[#1e2332] rounded-[3rem] p-8 md:p-14 lg:p-20 border border-white/5 shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold text-amber-400 mb-10 pb-6 border-b border-white/5 tracking-wide">
            📖 Let's Read
          </h2>
          
          <div 
            dir="rtl"
            className="leading-[3.5rem] md:leading-[4.5rem] text-[1.5rem] md:text-[2rem] text-right whitespace-pre-wrap font-nastaliq text-slate-200"
          >
            {story.content}
          </div>

          {/* MORAL LESSON */}
          {story.moralLesson && (
            <div className="mt-16 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  💡
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-emerald-400 tracking-wide uppercase text-shadow-sm">
                  Moral Lesson
                </h3>
              </div>
              
              <p 
                dir="rtl" 
                className="text-right font-nastaliq text-[1.8rem] md:text-[2.2rem] leading-[3rem] md:leading-[4rem] text-emerald-100 relative z-10"
              >
                {story.moralLesson}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR (INTERACTIVE TOOLS) */}
      <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6 lg:sticky lg:top-28 z-10">
        
        <div className="bg-[#1e2332] rounded-[2rem] p-6 shadow-xl border border-white/5">
          <h3 className="text-slate-400 font-bold tracking-[0.2em] text-xs uppercase mb-6 text-center">
            Interactive Tools
          </h3>
          
          <div className="flex flex-col gap-4">
            
            <button 
              onClick={() => setShowAudio(!showAudio)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold border border-transparent hover:border-white/5 hover:bg-[#343b4e] bg-[#2a3041] text-slate-200"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/5 text-slate-300">
                {showAudio ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </div>
              <span className="text-sm md:text-base">{showAudio ? 'Close Audio' : 'Listen'}</span>
            </button>

            <button 
              onClick={() => setShowAIChat(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold border border-transparent hover:border-white/5 hover:bg-[#343b4e] bg-[#2a3041] text-slate-200"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#294276] text-[#6090f0]">
                <Bot size={20} />
              </div>
              <span className="text-sm md:text-base">Ask AI</span>
            </button>

            <button 
              onClick={() => {
                if (hasRead) navigate(`/quiz/${id}`);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold border border-transparent ${
                hasRead 
                  ? 'hover:border-white/5 hover:bg-[#343b4e] bg-[#2a3041] text-slate-200 cursor-pointer' 
                  : 'bg-[#212636] text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasRead ? 'bg-[#4c2f6d] text-[#b17cee]' : 'bg-white/5 text-slate-600'}`}>
                <ClipboardList size={20} />
              </div>
              <span className="text-sm md:text-base flex-1 text-left">Take Quiz</span>
              {!hasRead && <span className="text-[10px] uppercase tracking-wider text-rose-400 bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20">Locked</span>}
            </button>

            <button 
              onClick={toggleBookmark}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold border ${
                isBookmarked 
                  ? 'border-[#deaa48]/30 bg-[#5c4a2a]/40 text-[#deaa48]' 
                  : 'border-transparent hover:border-white/5 hover:bg-[#343b4e] bg-[#2a3041] text-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isBookmarked ? 'bg-[#deaa48] text-amber-900' : 'bg-[#5c4a2a] text-[#deaa48]'}`}>
                <Bookmark fill={isBookmarked ? "currentColor" : "none"} size={20} />
              </div>
              <span className="text-sm md:text-base">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            
          </div>
        </div>

        {/* PROGRESS / MARK AS READ WIDGET */}
        <div className="bg-[#1e2332] rounded-[2rem] p-6 shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold tracking-widest text-slate-400 uppercase text-xs">Reading Progress</h3>
          </div>
          
          <div className="w-full h-3 bg-[#2a3041] rounded-full mb-6 overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
              style={{ width: hasRead ? '100%' : '0%' }}
            />
          </div>

          <button
            onClick={handleMarkAsRead}
            disabled={hasRead || updating}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              hasRead 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:scale-[1.02] shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer'
            }`}
          >
            {updating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : hasRead ? (
              <>✅ Completed</>
            ) : (
              <>Mark as Read to Unlock Quiz</>
            )}
          </button>
        </div>
      </aside>

      {/* AI Chat Modal Overlay */}
      {showAIChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          
          {/* Animated Background Orbs for real glassmorphism effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-indigo-600/40 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] bg-purple-600/30 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-500 drop-shadow-2xl">
            
            <button 
              onClick={() => setShowAIChat(false)}
              className="absolute -top-16 right-0 text-white hover:text-rose-400 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] z-20"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            {/* The Glass Panel */}
            <div className="bg-[#050508]/50 backdrop-blur-3xl rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col h-[85vh] min-h-[500px] max-h-[800px] relative z-10 overflow-hidden ring-1 ring-white/20">
              
              {/* Premium Header */}
              <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative overflow-hidden bg-white/5">
                
                {/* Header Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(139,92,246,0.5)] border border-white/30 relative">
                     {/* Inner glow */}
                     <div className="absolute inset-0 rounded-2xl shadow-inner border-b-2 border-white/50"></div>
                     <Bot size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white drop-shadow-lg">
                      NoorKids AI
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                      <p className="text-sm text-indigo-100 font-medium tracking-wide">
                        Chatting about: <span className="font-bold text-white">{story.title}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0 relative">
                <AIChat storyId={story.id} storyTitle={story.title} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoryDetails;