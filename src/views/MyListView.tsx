import React, { useState } from 'react';
import { Heart, Play, Clock, Bookmark, Trash2, LogIn, Compass, ListPlus } from 'lucide-react';
import { ReadingListItem, UserProfile, Manhua } from '../types';

interface MyListViewProps {
  user: UserProfile | null;
  readingList: ReadingListItem[];
  onRemoveFromList: (manhuaId: string) => void;
  onSelectManhua: (id: string) => void;
  onNavigate: (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists') => void;
}

export default function MyListView({
  user,
  readingList,
  onRemoveFromList,
  onSelectManhua,
  onNavigate
}: MyListViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'favorite' | 'reading' | 'plan'>('all');

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/10">
          <ListPlus className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">قائمتي الخاصة</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          سجل دخولك الآن لتتمكن من إضافة المانهوات المفضلة لديك، تتبع ما تشاهده حالياً، والتخطيط لقراءة أعمال جديدة بكل سهولة ومزامنتها عبر السحاب.
        </p>
        <button
          onClick={() => onNavigate('account')}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-8 py-3.5 rounded-full transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-md shadow-red-900/30"
          id="mylist-login-prompt-btn"
        >
          <LogIn className="w-4 h-4" />
          <span>تسجيل الدخول أو إنشاء حساب</span>
        </button>
      </div>
    );
  }

  // Filter list by active tab
  const filteredList = activeTab === 'all' 
    ? readingList 
    : readingList.filter(item => item.listType === activeTab);

  const getListBadge = (type: 'favorite' | 'reading' | 'plan') => {
    switch (type) {
      case 'favorite':
        return {
          label: 'المفضلة',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <Heart className="w-3 h-3 fill-rose-500" />
        };
      case 'reading':
        return {
          label: 'أشاهد حالياً',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Play className="w-3 h-3 fill-emerald-500" />
        };
      case 'plan':
        return {
          label: 'أرغب بمشاهدتها',
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          icon: <Bookmark className="w-3 h-3 fill-sky-500" />
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            قائمتي القراءة <span className="text-red-500 text-sm font-medium bg-red-600/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">{readingList.length} أعمال</span>
          </h1>
          <p className="text-zinc-500 text-xs mt-1">المكتبة الشخصية والمجموعات الخاصة بك والمرتبطة بحسابك الشخصي.</p>
        </div>

        {/* Categories navigation tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveTab('favorite')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'favorite'
                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
            المفضلة
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reading'
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-emerald-500/20" />
            أشاهد حالياً
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'plan'
                ? 'bg-sky-950/40 text-sky-400 border border-sky-900/40'
                : 'text-zinc-400 hover:text-sky-400'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-sky-500/20" />
            أرغب بمشاهدتها
          </button>
        </div>
      </div>

      {/* Main List Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl py-16 text-center">
          <div className="w-16 h-16 bg-zinc-950 border border-zinc-900 text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300 mb-1">القائمة فارغة</h3>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-6">
            {activeTab === 'all' 
              ? 'لم تقم بإضافة أي أعمال إلى قائمتك الشخصية حتى الآن.' 
              : `لا توجد مانهوات مضافة إلى قائمة "${getListBadge(activeTab as any).label}" حالياً.`}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold text-xs px-6 py-2.5 rounded-full transition-all"
          >
            استكشف المانهوا الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredList.map((item) => {
            const badge = getListBadge(item.listType);
            return (
              <div 
                key={item.id}
                className="group relative bg-zinc-900/60 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-red-500/40 transition-all flex flex-col h-full"
              >
                {/* Cover Image */}
                <div 
                  onClick={() => onSelectManhua(item.manhuaId)}
                  className="relative aspect-[2/3] overflow-hidden bg-zinc-950 cursor-pointer"
                >
                  <img 
                    src={item.manhuaCover} 
                    alt={item.manhuaTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  
                  {/* Category Indicator Badge */}
                  <div className={`absolute top-2 right-2 flex items-center gap-1 bg-black/85 backdrop-blur-sm px-2 py-1 rounded border text-[9px] font-bold ${badge.color}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>

                {/* Info and action */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                  <h3 
                    onClick={() => onSelectManhua(item.manhuaId)}
                    className="font-bold text-xs text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-2 cursor-pointer leading-relaxed"
                  >
                    {item.manhuaTitle}
                  </h3>

                  <button
                    onClick={() => onRemoveFromList(item.manhuaId)}
                    className="w-full py-1.5 px-2 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-zinc-900 hover:border-red-900/30 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    title="إزالة من القائمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف من القائمة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
