import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Heart, Play, Bookmark, Trash2, LogIn, Loader2 } from 'lucide-react';
import { ReadingListItem, UserProfile, Manhua } from '../types';

interface AddToListPickerProps {
  user: UserProfile | null;
  manhua: Manhua;
  readingList: ReadingListItem[];
  onAddToList: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList: (manhuaId: string) => Promise<void>;
  onNavigate?: (view: any) => void;
  className?: string;
}

export default function AddToListPicker({
  user,
  manhua,
  readingList,
  onAddToList,
  onRemoveFromList,
  onNavigate,
  className = ''
}: AddToListPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find if this manhua is already in the list and get its type
  const activeItem = readingList.find(item => item.manhuaId === manhua.id);
  const currentType = activeItem ? activeItem.listType : null;

  // Toggle dropdown
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation clicks!
    setIsOpen(!isOpen);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectType = async (e: React.MouseEvent, type: 'favorite' | 'reading' | 'plan') => {
    e.stopPropagation();
    if (!user) return;
    
    setLoading(true);
    try {
      await onAddToList(manhua, type);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentType) return;

    setLoading(true);
    try {
      await onRemoveFromList(manhua.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Circle + Trigger Button */}
      <button
        onClick={handleToggle}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          currentType 
            ? 'bg-red-600 text-white border border-red-500 shadow-sm hover:bg-red-500' 
            : 'bg-black/75 hover:bg-red-600 text-zinc-300 hover:text-white border border-zinc-800 backdrop-blur-sm'
        } active:scale-90`}
        title="إضافة إلى قائمتي"
        id={`add-to-list-trigger-${manhua.id}`}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : currentType ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : (
          <Plus className="w-4 h-4 stroke-[3]" />
        )}
      </button>

      {/* Floating Dropdown Overlay */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} // Prevent card click inside overlay
          className="absolute z-50 left-0 mt-2 w-48 bg-zinc-950 border border-zinc-900 rounded-xl shadow-2xl p-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-100 text-right"
          style={{ transform: 'translateX(0)' }}
        >
          {user ? (
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 px-2 py-1 border-b border-zinc-900 mb-1 font-bold text-center">
                إضافة العمل إلى قائمة:
              </div>

              {/* Favorites (المفضلة) */}
              <button
                onClick={(e) => handleSelectType(e, 'favorite')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-right ${
                  currentType === 'favorite'
                    ? 'bg-rose-950/30 text-rose-400'
                    : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className={`w-3.5 h-3.5 ${currentType === 'favorite' ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>المفضلة</span>
                </div>
                {currentType === 'favorite' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Currently Watching/Reading (أشاهد حالياً) */}
              <button
                onClick={(e) => handleSelectType(e, 'reading')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-right ${
                  currentType === 'reading'
                    ? 'bg-emerald-950/30 text-emerald-400'
                    : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Play className={`w-3.5 h-3.5 ${currentType === 'reading' ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                  <span>أشاهد حالياً</span>
                </div>
                {currentType === 'reading' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Plan to read (أرغب بمشاهدتها) */}
              <button
                onClick={(e) => handleSelectType(e, 'plan')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-right ${
                  currentType === 'plan'
                    ? 'bg-sky-950/30 text-sky-400'
                    : 'text-zinc-400 hover:text-sky-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className={`w-3.5 h-3.5 ${currentType === 'plan' ? 'fill-sky-500 text-sky-500' : ''}`} />
                  <span>أرغب بمشاهدتها</span>
                </div>
                {currentType === 'plan' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Remove button */}
              {currentType && (
                <button
                  onClick={handleRemove}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 mt-1 border-t border-zinc-900 rounded-lg text-xs font-bold text-red-500 hover:bg-red-950/20 transition-all text-right"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف من القائمة</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 text-center">
              <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed font-medium">
                يرجى تسجيل الدخول لحفظ المانهو في قائمتك الشخصية.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onNavigate) onNavigate('account');
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                <span>تسجيل الدخول</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
