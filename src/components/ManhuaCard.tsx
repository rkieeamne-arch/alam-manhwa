import React from 'react';
import { Star, Eye, BookOpen } from 'lucide-react';
import { Manhua, UserProfile, ReadingListItem } from '../types';
import AddToListPicker from './AddToListPicker';

interface ManhuaCardProps {
  key?: React.Key | string;
  manhua: Manhua;
  onSelect: (id: string) => void;
  user?: UserProfile | null;
  readingList?: ReadingListItem[];
  onAddToList?: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList?: (manhuaId: string) => Promise<void>;
  onNavigate?: (view: any) => void;
}

export default function ManhuaCard({ 
  manhua, 
  onSelect,
  user = null,
  readingList = [],
  onAddToList,
  onRemoveFromList,
  onNavigate
}: ManhuaCardProps) {
  // Format views to look attractive (e.g., 1.2M or 520K)
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + ' مليون';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(0) + ' ألف';
    }
    return views.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مستمر':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'مكتمل':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'متوقف مؤقتاً':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div 
      onClick={() => onSelect(manhua.id)}
      className="group bg-zinc-900/60 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-950/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
      id={`manhua-card-${manhua.id}`}
    >
      {/* Cover Image container with badges */}
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-950">
        <img 
          src={manhua.coverUrl} 
          alt={manhua.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Dark vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

        {/* Status badge top-left */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[9px] font-bold border ${getStatusColor(manhua.status)}`}>
          {manhua.status}
        </div>

        {/* Add to list trigger bottom-left */}
        {onAddToList && onRemoveFromList && (
          <div className="absolute bottom-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
            <AddToListPicker
              user={user}
              manhua={manhua}
              readingList={readingList}
              onAddToList={onAddToList}
              onRemoveFromList={onRemoveFromList}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>

      {/* Details info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-1">
            {manhua.title}
          </h3>
          {manhua.englishTitle && (
            <p className="text-[10px] text-zinc-500 truncate font-mono">
              {manhua.englishTitle}
            </p>
          )}
        </div>

        {/* Categories row */}
        <div className="flex flex-wrap gap-1 mt-2 mb-1.5 overflow-hidden max-h-5">
          {manhua.categories.slice(0, 2).map((cat) => (
            <span 
              key={cat}
              className="text-[9px] bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-900"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Chapters count footer info */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-0.5">
            <BookOpen className="w-3 h-3 text-zinc-600" />
            <span>{manhua.chapters.length} فصول</span>
          </span>
          <span className="text-zinc-500 font-mono">
            {manhua.releaseYear}
          </span>
        </div>
      </div>
    </div>
  );
}
