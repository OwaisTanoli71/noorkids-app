import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import PracticeRecitation from '../components/Quran/PracticeRecitation';

// Helper to convert Al Quran Cloud's custom bracket syntax to HTML spans
const parseTajweed = (text) => {
  if (!text) return "";
  // The API returns tajweed in the format: [rule[text]
  // E.g., [h:1[ٱ] -> rule = h:1, text = ٱ
  return text.replace(/\[([^\[\]]+)\[([^\]]+)\]/g, (match, rule, content) => {
    // Map the short codes to our global.css classes
    let className = "";
    if (rule.startsWith('n') || rule.startsWith('p') || rule.startsWith('m') || rule.startsWith('o')) {
      className = "madd";
    } else if (rule.startsWith('q')) {
      className = "qalaqah";
    } else if (rule.startsWith('c')) {
      className = "ghunnah";
    } else if (rule.startsWith('s')) {
      className = "ikhafa";
    } else if (rule.startsWith('f')) {
      className = "idgham_wo_ghunnah";
    } else if (rule.startsWith('a')) {
      className = "idgham_ghunnah";
    } else if (rule.startsWith('i')) {
      className = "iqlab";
    } else if (rule.startsWith('l')) {
      className = "lam_shamsiyyah"; // We'll make this gray
    } else if (rule.startsWith('h')) {
      className = "hamzat_wasl"; // We'll make this gray
    }
    
    if (!className) return content; // If unknown rule, just return the text
    return `<span class="tajweed ${className}">${content}</span>`;
  });
};

export default function SurahDetails() {
  const { id } = useParams();
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en'); // 'en' or 'ur'
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quran/surah/${id}`)
      .then(res => res.json())
      .then(data => {
        setSurah(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load surah:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return <div className="text-center text-white mt-20">Surah not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/quran" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Index
        </Link>
        <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 relative z-10">{surah.englishName}</h1>
          <p className="text-amber-400 mb-4 relative z-10">{surah.englishNameTranslation} • {surah.revelationType}</p>
          <h2 className="text-4xl md:text-5xl font-nastaliq text-white opacity-90 relative z-10">{surah.name}</h2>
          
          <div className="flex items-center justify-center gap-4 mt-6 relative z-10">
            <button 
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lang === 'en' ? 'bg-amber-500 text-slate-900' : 'bg-[#141824] text-slate-400 hover:text-white'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLang('ur')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lang === 'ur' ? 'bg-amber-500 text-slate-900' : 'bg-[#141824] text-slate-400 hover:text-white'}`}
            >
              Urdu
            </button>
          </div>
        </div>
      </div>

      {/* Tajweed Legend */}
      <div className="mb-8">
        <button 
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mx-auto"
        >
          <Info size={16} /> {showLegend ? 'Hide' : 'Show'} Tajweed Rules Legend
        </button>
        {showLegend && (
          <div className="glass-panel p-4 rounded-2xl mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm animate-fade-in-up">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e]"></span><span className="text-slate-300">Ghunnah (Nasalization)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span><span className="text-slate-300">Ikhfa (Hidden)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#94a3b8]"></span><span className="text-slate-300">Idgham (Merge)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06b6d4]"></span><span className="text-slate-300">Iqlab (Conversion)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span><span className="text-slate-300">Qalqalah (Echoing)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span><span className="text-slate-300">Madd (Prolongation)</span></div>
          </div>
        )}
      </div>

      {/* Ayahs */}
      <div className="space-y-8">
        {surah.ayahs.map(ayah => (
          <div key={ayah.numberInSurah} className="glass-panel p-6 rounded-3xl group">
            <div className="flex justify-between items-start mb-6 gap-6">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#141824] flex items-center justify-center text-amber-500 font-bold border border-white/5">
                {ayah.numberInSurah}
              </div>
              
              {/* The Uthmani Text with Tajweed Tags */}
              <div 
                className="text-right text-3xl md:text-4xl font-nastaliq leading-[2.5] md:leading-[3] text-white flex-1"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: parseTajweed(ayah.text) }}
              />
            </div>

            {/* Translation */}
            <p className={`text-slate-400 text-lg ${lang === 'ur' ? 'font-nastaliq text-right leading-loose text-xl' : 'leading-relaxed'}`} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
              {ayah.translation[lang]}
            </p>

            {/* Listen and Practice */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <AudioPlayer audioUrl={ayah.audio} storyId={null} />
              <PracticeRecitation surahNumber={surah.number} ayahNumber={ayah.numberInSurah} targetText={ayah.text} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
