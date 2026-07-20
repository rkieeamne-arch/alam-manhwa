import React, { useState, useEffect } from 'react';
import { fetchAnimeDetails, Anime } from '../utils/animeScraper';
import { Loader2, ArrowRight, Play, Calendar, Star, Tag, Award, Film, MessageSquare, ChevronLeft, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import AddToListPicker from '../components/AddToListPicker';
import { UserProfile, ReadingListItem, Manhua } from '../types';

interface AnimeDetailsViewProps {
  animeUrl: string;
  onBack: () => void;
  onSelectEpisode: (episodeNumber: number) => void;
  setAnime: (anime: Anime) => void;
  user: UserProfile | null;
  readingList: ReadingListItem[];
  onAddToList: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList: (manhuaId: string) => Promise<void>;
  onNavigate?: (view: any) => void;
}

export default function AnimeDetailsView({ 
  animeUrl, 
  onBack, 
  onSelectEpisode, 
  setAnime,
  user,
  readingList,
  onAddToList,
  onRemoveFromList,
  onNavigate
}: AnimeDetailsViewProps) {
  const [anime, setAnimeState] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    fetchAnimeDetails(animeUrl).then(data => {
      setAnimeState(data);
      if (data) setAnime(data);
      setLoading(false);
    });
  }, [animeUrl, setAnime]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4" dir="rtl">
        <Loader2 className="animate-spin w-12 h-12 text-amber-500" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">جاري تحميل تفاصيل الأنمي...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 p-6 text-center" dir="rtl">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-white text-lg font-black">تعذر تحميل تفاصيل الأنمي</h2>
        <p className="text-zinc-500 text-xs max-w-xs">قد يكون الرابط غير متوفر حالياً أو هناك مشكلة في المصدر.</p>
        <button onClick={onBack} className="mt-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 cursor-pointer transition-all flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>
      </div>
    );
  }

  const animeAsManhua: Manhua | null = anime ? {
    id: anime.id,
    title: anime.title,
    coverUrl: anime.coverUrl,
    description: anime.description || '',
    author: 'غير معروف',
    artist: 'غير معروف',
    status: (anime.status as any) || 'مستمر',
    rating: anime.rating || 5,
    views: anime.views || 0,
    categories: anime.categories || [],
    chapters: [],
    releaseYear: anime.releaseYear || 2026,
    sourceUrl: anime.sourceUrl,
    type: 'anime' as const
  } : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 text-right text-white max-w-5xl mx-auto space-y-6"
      dir="rtl"
    >
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs sm:text-sm font-bold bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 self-start"
      >
        <ArrowRight className="w-4 h-4" /> 
        <span>عودة</span>
      </button>

      {/* Main Anime Card Layout */}
      <div className="flex flex-col md:flex-row gap-6 bg-zinc-900/30 border border-zinc-850/50 p-5 sm:p-7 rounded-3xl backdrop-blur-sm shadow-2xl relative overflow-hidden">
        
        {/* Background glow decorator */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Poster & Badges Column */}
        <div className="w-full md:w-64 shrink-0 flex flex-col items-center gap-4">
          <div className="relative w-48 md:w-full aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-xl group">
            <img 
              src={anime.coverUrl} 
              alt={anime.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            
            {/* Status absolute badge */}
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-extrabold rounded-lg shadow-lg ${
              anime.status === 'مكتمل' ? 'bg-green-600 text-white' : 'bg-amber-500 text-zinc-950'
            }`}>
              {anime.status}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-[240px] md:max-w-none">
            <div className="bg-zinc-900/80 border border-zinc-850 p-2.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-zinc-500 block font-bold">التقييم</span>
              <div className="flex items-center justify-center gap-1 text-xs font-black text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{anime.rating}</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-850 p-2.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-zinc-500 block font-bold">سنة الإصدار</span>
              <div className="flex items-center justify-center gap-1 text-xs font-black text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{anime.releaseYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Interactive lists Column */}
        <div className="flex-1 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Anime Title */}
            <h1 className="text-xl sm:text-3xl font-black text-white font-display tracking-tight leading-snug">
              {anime.title}
            </h1>

            {/* Categories / Genres */}
            <div className="flex flex-wrap gap-1.5">
              {anime.categories.map(cat => (
                <span 
                  key={cat} 
                  className="px-3 py-1 rounded-lg bg-zinc-950/60 border border-zinc-850 text-zinc-400 text-[10px] sm:text-xs font-bold"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* List picker row */}
            {animeAsManhua && (
              <div className="flex items-center gap-2.5 bg-zinc-950/40 border border-zinc-850/50 rounded-2xl px-4 py-2 w-fit">
                <AddToListPicker
                  user={user}
                  manhua={animeAsManhua}
                  readingList={readingList}
                  onAddToList={onAddToList}
                  onRemoveFromList={onRemoveFromList}
                  onNavigate={onNavigate}
                  className="w-8 h-8"
                />
                <span className="text-xs font-bold text-zinc-300 pr-1 select-none">حفظ هذا الأنمي في قائمتك الشخصية ✨</span>
              </div>
            )}

            {/* Description/Synopsis in beautiful structured box */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white font-display">
                  قصة الأنمي
                </h3>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-850/80 p-5 rounded-2xl max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-medium text-justify">
                  {anime.description}
                </p>
              </div>
            </div>

          </div>

          {/* Episodes List Container */}
          <div className="space-y-3 pt-4 border-t border-zinc-850/50">
            <div className="flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500 font-mono">
                  {anime.episodes.length} حلقة متوفرة
                </span>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="ترتيب الحلقات"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white font-display flex items-center gap-1.5">
                <Film className="w-4 h-4 text-amber-500" />
                <span>الحلقات المتوفرة</span>
              </h3>
            </div>

            {anime.episodes.length === 0 ? (
              <div className="bg-zinc-950/20 border border-dashed border-zinc-800 p-8 rounded-2xl text-center">
                <p className="text-zinc-500 text-xs">لا يوجد حلقات متوفرة حالياً لهذا العمل.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent pb-1">
                {(sortOrder === 'asc' ? anime.episodes : [...anime.episodes].reverse()).map(ep => (
                  <button 
                    key={ep.id} 
                    onClick={() => onSelectEpisode(ep.episodeNumber)} 
                    className="p-3 bg-zinc-950/60 hover:bg-amber-500/10 border border-zinc-850 hover:border-amber-500/40 text-zinc-200 hover:text-amber-400 rounded-xl transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer text-right shadow-sm"
                  >
                    <span className="text-[10px] sm:text-xs font-bold truncate pr-1">
                      {ep.episodeNumber > 0 ? `الحلقة ${ep.episodeNumber}` : ep.title}
                    </span>
                    <Play className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500/20 group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
}
