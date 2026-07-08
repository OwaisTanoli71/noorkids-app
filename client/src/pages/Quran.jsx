import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Loader2 } from 'lucide-react';

export default function Quran() {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/quran/surahs')
      .then(res => res.json())
      .then(data => {
        setSurahs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load surahs:", err);
        setLoading(false);
      });
  }, []);

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(search.toLowerCase()) || 
    s.name.includes(search) || 
    s.number.toString() === search
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="text-amber-500" />
          The Noble Quran
        </h1>
        <p className="text-slate-400">Read, listen, and practice your recitation.</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Search by Surah name or number..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#141824] border border-[#2A2F3E] rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurahs.map(surah => (
            <Link 
              key={surah.number} 
              to={`/quran/${surah.number}`}
              className="glass-panel p-4 flex items-center gap-4 hover:border-amber-500/50 hover:bg-[#1a2035] transition-all group rounded-2xl border border-white/5"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                {surah.number}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {surah.englishName}
                </h3>
                <p className="text-xs text-slate-400">
                  {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs
                </p>
              </div>
              <div className="text-right">
                <h3 className="font-nastaliq text-xl text-white opacity-90">{surah.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
