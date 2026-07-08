import { Link } from "react-router-dom";
import { Bookmark, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

function StoryCard({ story }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (story?.id) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(story.id));
    }
  }, [story?.id]);

  const toggleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let newBookmarks;
    if (bookmarks.includes(story.id)) {
      newBookmarks = bookmarks.filter(b => b !== story.id);
      setIsBookmarked(false);
    } else {
      newBookmarks = [...bookmarks, story.id];
      setIsBookmarked(true);
    }
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const hue = story.title.length * 15 % 360;
  const gradient = story.color || `linear-gradient(135deg, hsl(${hue}, 80%, 40%), hsl(${hue + 30}, 90%, 30%))`;

  return (
    <div
      className="rounded-[2rem] p-6 md:p-8 shadow-xl transition-all duration-500 relative group overflow-hidden flex flex-col h-full hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 border border-white/10"
      style={{ background: gradient }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition duration-700 pointer-events-none"></div>

      <button 
        onClick={toggleBookmark}
        className={`absolute top-6 right-6 transition-colors z-10 ${isBookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-white/50 hover:text-white'}`}
      >
        <Bookmark fill={isBookmarked ? "currentColor" : "none"} size={24} />
      </button>

      <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl mb-6 shadow-inner border border-white/20 group-hover:scale-110 transition-transform duration-500">
        🕌
      </div>

      <h2 className="text-2xl font-black text-white leading-tight mb-2">
        {story.title}
      </h2>

      <p className="text-white/80 font-medium mb-6 line-clamp-3 flex-grow">
        {story.description || "Join this beautiful Islamic adventure and learn valuable lessons along the way."}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="bg-black/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white tracking-wide">
          {story.category}
        </span>
        <span className="bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white tracking-wide">
          {story.difficulty}
        </span>
      </div>

      <Link
        to={`/story/${story.id}`}
        className="mt-auto w-full flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-4 rounded-full font-bold transition-all duration-300 hover:bg-amber-400 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.4)]"
      >
        Read Story
        <ArrowRight size={18} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
      </Link>
    </div>
  );
}

export default StoryCard;