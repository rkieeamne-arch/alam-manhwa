import { useState } from 'react';
import { BookOpen, Trash2, Clock, Play, Sparkles, Tv, Eye } from 'lucide-react';
import { ReadingHistoryItem, AnimeWatchHistoryItem } from '../types';

interface HistoryViewProps {
  history: ReadingHistoryItem[];
  animeHistory: AnimeWatchHistoryItem[];
  onSelectChapter: (manhuaId: string, chapterId: string, pageIndex: number) => void;
  onSelectEpisode: (animeId: string, episodeNumber: number) => void;
  onRemoveItem: (id: string) => void;
  onRemoveAnimeItem: (id: string) => void;
  onClearAll: () => void;
  onClearAllAnime: () => void;
}

export default function HistoryView({
  history,
  animeHistory,
  onSelectChapter,
  onSelectEpisode,
  onRemoveItem,
  onRemoveAnimeItem,
  onClearAll,
  onClearAllAnime
}: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'manhua' | 'anime'>('manhua');
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString('ar-EG', options);
    } catch {
      return dateStr;
    }
  };

  const formatSeconds = (seconds: number) => {
    if (!seconds) return 'البداية';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in" id="history-view-container" dir="rtl">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-2 border-r-4 border-red-500 pr-3">
          <Clock className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-bold text-zinc-100 font-display">سجل المشاهدة والقراءة</h1>
        </div>

        {activeTab === 'manhua' && history.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-600 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start"
            id="clear-all-history-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح سجل القراءة بالكامل</span>
          </button>
        )}

        {activeTab === 'anime' && animeHistory.length > 0 && (
          <button
            onClick={onClearAllAnime}
            className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-600 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start"
            id="clear-all-anime-history-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح سجل الأنمي بالكامل</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-zinc-900/40 p-1 rounded-xl border border-zinc-850 max-w-sm mb-6">
        <button
          onClick={() => setActiveTab('manhua')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'manhua'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>سجل المانهو ({history.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('anime')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'anime'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>سجل الأنمي ({animeHistory.length})</span>
        </button>
      </div>

      {activeTab === 'manhua' ? (
        history.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed pr-1">
              تاريخ قراءاتك للمانهو يتم حفظه تلقائياً. انقر على زر <span className="text-red-500 font-bold">"استكمال القراءة"</span> للعودة مباشرة للصفحة التي توقفت عندها.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-2xl border border-zinc-800/80 hover:border-red-500/30 transition-all group relative overflow-hidden"
                >
                  {/* Cover thumbnail */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                    <img 
                      src={item.manhuaCover || undefined} 
                      alt={item.manhuaTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-extrabold text-zinc-400 truncate max-w-[200px]">
                          {item.manhuaTitle}
                        </h3>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                          title="حذف من السجل"
                          id={`delete-history-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-red-400 transition-colors mt-0.5">
                        {item.chapterTitle}
                      </h4>

                      <p className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                        <span>توقفت عند الصفحة: {item.pageIndex + 1} ({item.progressPercent}%)</span>
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                        <div 
                          className="bg-red-500 h-full rounded-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>

                      {/* Date and actions row */}
                      <div className="flex items-center justify-between text-[9px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>آخر قراءة: {formatDate(item.lastReadTime)}</span>
                        </span>

                        <button
                          onClick={() => onSelectChapter(item.manhuaId, item.chapterId, item.pageIndex)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                          id={`resume-history-${item.id}`}
                        >
                          <Play className="w-3 h-3 fill-white text-white" />
                          <span>استكمال القراءة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl py-20 text-center space-y-4">
            <BookOpen className="w-14 h-14 mx-auto text-zinc-800 stroke-1" />
            <h3 className="text-sm font-bold text-zinc-300 font-display">سجل قراءة المانهو فارغ!</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              لم نجد أي مانهو في سجلاتك بعد. ابدأ بقراءة فصولك المفضلة وسنقوم بحفظ تقدمك تلقائياً هنا وبشكل جذاب.
            </p>
          </div>
        )
      ) : (
        animeHistory.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed pr-1">
              تاريخ مشاهداتك للأنمي يتم حفظه تلقائياً ومزامنته محلياً. انقر على زر <span className="text-red-500 font-bold">"متابعة المشاهدة"</span> للرجوع الفوري للحلقة التي شاهدتها ومتابعتها.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animeHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-2xl border border-zinc-800/80 hover:border-red-500/30 transition-all group relative overflow-hidden"
                >
                  {/* Cover thumbnail */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                    <img 
                      src={item.animeCover || undefined} 
                      alt={item.animeTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-extrabold text-zinc-400 truncate max-w-[200px]">
                          {item.animeTitle}
                        </h3>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAnimeItem(item.id);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                          title="حذف من السجل"
                          id={`delete-anime-history-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-red-400 transition-colors mt-0.5">
                        الحلقة {item.episodeNumber} - {item.episodeTitle || 'مشاهدة مباشرة'}
                      </h4>

                      <p className="text-[10px] text-amber-500 font-bold mt-1 flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>توقفت عند: {formatSeconds(item.stoppedAtSeconds)}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {/* Visual separator or mini line */}
                      <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900">
                        <div 
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: item.stoppedAtSeconds > 0 ? `${Math.min(100, Math.max(15, (item.stoppedAtSeconds / 1440) * 100))}%` : '8%' }}
                        />
                      </div>

                      {/* Date and actions row */}
                      <div className="flex items-center justify-between text-[9px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>آخر مشاهدة: {formatDate(item.lastWatchedTime)}</span>
                        </span>

                        <button
                          onClick={() => onSelectEpisode(item.animeId, item.episodeNumber)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                          id={`resume-anime-history-${item.id}`}
                        >
                          <Play className="w-3 h-3 fill-black text-black" />
                          <span>متابعة المشاهدة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl py-20 text-center space-y-4">
            <Tv className="w-14 h-14 mx-auto text-zinc-800 stroke-1" />
            <h3 className="text-sm font-bold text-zinc-300 font-display">سجل مشاهدة الأنمي فارغ!</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              لم تشاهد أي حلقات أنمي بعد. تصفح الأنميات المفضلة لديك وابدأ المشاهدة ليتم حفظ فصولك تلقائياً وبدقة عالية.
            </p>
          </div>
        )
      )}

    </div>
  );
}
