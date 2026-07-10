import { Clock, Eye, ChevronRight } from 'lucide-react';
import { Manhua, Chapter } from '../types';

interface LatestChaptersProps {
  manhuas: Manhua[];
  onSelectChapter: (manhuaId: string, chapterId: string) => void;
}

export default function LatestChapters({ manhuas, onSelectChapter }: LatestChaptersProps) {
  // Aggregate all chapters with their parent manhua info
  const allChapters = manhuas.flatMap((manhua) => 
    manhua.chapters.map((chapter) => ({
      ...chapter,
      manhuaId: manhua.id,
      manhuaTitle: manhua.title,
      manhuaCover: manhua.coverUrl,
      manhuaStatus: manhua.status
    }))
  );

  // Sort by release date descending
  const sortedChapters = allChapters.sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  // Take the top 8 latest chapters
  const latest8 = sortedChapters.slice(0, 8);

  const formatDate = (dateStr: string) => {
    // Basic Arabic date representation
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    try {
      return date.toLocaleDateString('ar-EG', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4" id="latest-chapters-section">
      <div className="flex items-center justify-between border-r-4 border-red-600 pr-3">
        <h2 className="text-lg font-bold text-zinc-100 font-display">أحدث الفصول المضافة</h2>
        <span className="text-xs text-red-400 font-semibold">تحديث مستمر 24/7</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {latest8.map((ch) => (
          <div
            key={ch.id}
            onClick={() => onSelectChapter(ch.manhuaId, ch.id)}
            className="flex items-center gap-3 p-2.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-red-500/30 rounded-xl transition-all cursor-pointer group"
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-16 rounded overflow-hidden bg-zinc-950 shrink-0">
              <img 
                src={ch.manhuaCover} 
                alt={ch.manhuaTitle} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Chapter Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-extrabold text-zinc-400 truncate hover:text-red-400 transition-colors">
                {ch.manhuaTitle}
              </h3>
              <h4 className="text-xs font-bold text-zinc-100 mt-1 truncate group-hover:text-red-500 transition-colors">
                {ch.title}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3 text-red-500" />
                  <span>{formatDate(ch.releaseDate)}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  <span>{ch.views} مشاهدة</span>
                </span>
              </div>
            </div>

            {/* Go arrow */}
            <div className="p-1 rounded bg-zinc-800 text-zinc-400 group-hover:bg-red-600 group-hover:text-white transition-all ml-1">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
