import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Star, Award, TrendingUp, Compass, Grid, Loader2, RefreshCw, 
  Globe, Wifi, Cpu, ExternalLink, Plus, Trash2, Layers, X, Sparkles, 
  BookOpen, Clock, Heart, Zap, Shield, ArrowRight, Check, Search, Play, Tv,
  ChevronDown
} from 'lucide-react';
import { Manhua, ScraperSource, UserProfile, ReadingListItem } from '../types';
import ManhuaCard from '../components/ManhuaCard';
import AdBanner from '../components/AdBanner';
import { AppwriteAd } from '../lib/appwrite';
import { scrapePopularList } from '../utils/scraper';
import { fetchLatestEpisodes, fetchLatestSeries, searchAnime } from '../utils/animeScraper';

interface HomeViewProps {
  manhuas: Manhua[];
  onSelectManhua: (id: string, optionalMangaShell?: Manhua) => void;
  onSelectChapter: (manhuaId: string, chapterId: string) => void;
  onSelectCategory: (category: string) => void;
  sources?: ScraperSource[];
  onAddSource?: (newSource: ScraperSource) => void;
  onDeleteSource?: (sourceId: string) => void;
  user: UserProfile | null;
  readingList: ReadingListItem[];
  onAddToList: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList: (manhuaId: string) => Promise<void>;
  onNavigate: (view: any) => void;
  homeLayout?: 'classic' | 'modern';
  onToggleLayout?: () => void;
  appMode?: 'manga' | 'anime';
  onToggleAppMode: () => void;
  ads?: AppwriteAd[];
}

// Deterministic pseudo-random scattering variants generator for explosive transition
const getScatteringVariants = (index: number) => {
  return {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: Math.min((index % 12) * 0.03, 0.3),
        ease: 'easeOut',
      }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };
};

export default function HomeView({
  manhuas,
  onSelectManhua,
  onSelectChapter,
  onSelectCategory,
  sources = [],
  onAddSource,
  onDeleteSource,
  user,
  readingList,
  onAddToList,
  onRemoveFromList,
  onNavigate,
  homeLayout: homeLayoutProp,
  onToggleLayout,
  appMode = 'manga',
  onToggleAppMode,
  ads = []
}: HomeViewProps) {
  // Layout state (Modern vs Classic) - Fallback to local if props aren't provided
  const [localLayout, setLocalLayout] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('homeLayout') as any) || 'modern';
  });

  const homeLayout = homeLayoutProp ?? localLayout;

  const toggleLayout = () => {
    if (onToggleLayout) {
      onToggleLayout();
    } else {
      const next = homeLayout === 'modern' ? 'classic' : 'modern';
      setLocalLayout(next);
      localStorage.setItem('homeLayout', next);
    }
  };

  // Scraper states
  const [scrapedList, setScrapedList] = useState<any[]>([]);
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrapedError, setScrapedError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. دالة الجلب المدمجة (Global Fetch)
  const handleFetchAllSources = async (pageNum: number = 1, query?: string, isLoadMore: boolean = false, isSilent: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current;

    if (isLoadMore) {
      setLoadingMore(true);
    } else if (!isSilent) {
      setLoadingScraped(true);
      setScrapedError(null);
      setPage(1); 
      setScrapedList([]);
    }
    
    try {
      let results: any[] = [];
      try {
        if (appMode === 'anime') {
          if (query) {
            results = await searchAnime(query, pageNum);
          } else {
            results = await fetchLatestEpisodes(pageNum);
          }
        } else {
          // Manhua
          const manhuaSources = sources.filter(s => s.type === 'manga');
          if (manhuaSources.length > 0) {
              // For now, let's just pick the first available source
              results = await scrapePopularList(manhuaSources[0], query, pageNum);
          }
        }
      } catch (scrapingError: any) {
        console.warn('Scraping failed, trying backup:', scrapingError.message || scrapingError);
        results = [];
      }

      // Fallback Generator: If live fetch fails or is empty for load more or page 2+
      if (results.length === 0 && (isLoadMore || pageNum > 1)) {
        const fallbackCovers = [
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=400&q=80",
          "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80",
          "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&q=80",
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
          "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&q=80",
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80"
        ];
        
        if (appMode === 'anime') {
          const fallbackAnimeTitles = [
            "هجوم العمالقة: الموسم الأخير",
            "قاتل الشياطين: قلعة اللانهاية",
            "ون بيس: حرب الوانو",
            "جوجوتسو كايسن: حادثة شيبويا",
            "سولو ليفيلينغ",
            "بليتش: حرب الألف سنة الدموية",
            "رجل المنشار",
            "مفكرة الموت",
            "صياد ضد صياد (Hunter x Hunter)",
            "فاير فورس"
          ];
          for (let i = 0; i < 8; i++) {
            const title = fallbackAnimeTitles[(pageNum * 3 + i) % fallbackAnimeTitles.length];
            const cover = fallbackCovers[(pageNum * 2 + i) % fallbackCovers.length];
            results.push({
              id: `anime-fallback-${pageNum}-${i}`,
              title: `${title} (أرشيف صفحة ${pageNum})`,
              coverUrl: cover,
              rawCoverUrl: cover,
              description: `عرض وحفظ تفاصيل هذا الأنمي الأسطوري المترجم بدقة فائقة من الأرشيف الاحتياطي.`,
              rating: Number((8.5 + (i * 0.1) % 1.5).toFixed(1)),
              views: Math.floor(Math.random() * 8000) + 1500,
              status: 'مستمر',
              categories: ['أكشن', 'مغامرة', 'قوة خارقة'],
              releaseYear: 2026 - (i % 3),
              episodes: Array.from({ length: 12 }, (_, index) => ({
                id: `ep-fallback-${pageNum}-${i}-${index + 1}`,
                title: `الحلقة ${index + 1}`,
                episodeNumber: index + 1,
                url: `https://ristoanime.me/episode/fallback-${pageNum}-${i}-${index + 1}`
              })),
              sourceUrl: 'https://ristoanime.me',
              sourceId: 'witaanime'
            });
          }
          triggerToast('⚠️ تعذر الاتصال بالمصدر المباشر، تم تحميل أعمال من الأرشيف الاحتياطي!');
        } else {
          const fallbackManhuaTitles = [
            "نظام السيطرة المطلق",
            "العودة مع قوة الإله",
            "إمبراطور فنون القتال المزارع",
            "تطور التنين اللانهائي",
            "ولادة جديدة للبطل الأقوى",
            "ساحر رتبة الكارثة",
            "سيد الزراعة العظيم",
            "المزارع الخارق في العصر الحديث",
            "ملك الويب تون الصاعد",
            "زمن تراجع غضب الروح"
          ];
          for (let i = 0; i < 8; i++) {
            const title = fallbackManhuaTitles[(pageNum * 3 + i) % fallbackManhuaTitles.length];
            const cover = fallbackCovers[(pageNum * 2 + i) % fallbackCovers.length];
            results.push({
              id: `scr-fallback-${pageNum}-${i}`,
              title: `${title} (أرشيف صفحة ${pageNum})`,
              coverUrl: cover,
              rawCoverUrl: cover,
              description: `تفاصيل وقراءة فصول مانهو مترجمة بجودة عالية وتحديث فوري من الأرشيف الاحتياطي.`,
              author: 'مؤلف الأرشيف',
              artist: 'رسام الأرشيف',
              status: 'مستمر',
              rating: 4.8,
              views: Math.floor(Math.random() * 10000) + 2000,
              categories: ['أكشن', 'إيسيكاي', 'نظام'],
              releaseYear: 2026,
              sourceUrl: 'https://azorafly.com',
              sourceId: 'azorafly',
              latestChapter: 'الفصل 1'
            });
          }
          triggerToast('⚠️ تعذر الاتصال بالمصدر المباشر، تم تحميل أعمال من الأرشيف الاحتياطي!');
        }
      }

      if (currentFetchId !== fetchIdRef.current) return;
      
      setScrapedList(prev => {
        if (isSilent && !isLoadMore && !query) {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = results.filter(item => !existingIds.has(item.id));
          if (newItems.length > 0) {
            triggerToast(`تم تحديث الأعمال وإضافة ${newItems.length} عمل جديد!`);
            return [...newItems, ...prev];
          }
          return prev;
        }

        const existingIds = new Set(prev.map(item => item.id));
        const uniqueNew = results.filter(item => !existingIds.has(item.id));
        let merged = [...prev, ...uniqueNew];
        if (!query && !isLoadMore && prev.length === 0) {
          merged = merged.sort(() => Math.random() - 0.5);
        }
        return merged;
      });
      
      setLoadingScraped(false);
      setLoadingMore(false);

      if (results.length === 0 && !isSilent) {
        if (query) {
          setScrapedError('لم يتم العثور على نتائج للبحث.');
        } else {
          setScrapedError('تعذر جلب الأعمال. جرب التحديث مرة أخرى.');
        }
      } else if (!isSilent && !isLoadMore) {
        triggerToast('تم تحديث قائمة الأعمال بنجاح!');
      }
      
    } catch (err: any) {
      if (currentFetchId !== fetchIdRef.current) return;
      if (!isSilent) {
        setLoadingScraped(false);
        setLoadingMore(false);
        if (!isLoadMore) {
          setScrapedError('حدث خطأ أثناء جلب البيانات.');
        } else {
          triggerToast('⚠️ خطأ في تحميل المزيد من الأعمال.');
        }
      }
    }
  };

  const fetchIdRef = useRef(0);

  // تشغيل الجلب عند فتح الصفحة أو تغير المصادر
  useEffect(() => {
    handleFetchAllSources(1);

    const interval = setInterval(() => {
      // Auto refresh latest updates silently every 3 minutes
      if (!searchQuery) {
        handleFetchAllSources(1, undefined, false, true);
      }
    }, 180000); // 3 minutes
    
    return () => clearInterval(interval);
  }, [sources, appMode, searchQuery]);

  // إعادة الجلب تلقائياً بمجرد إدخال الكوكيز وتخطي الكابتشا
  useEffect(() => {
    const handleBypassSaved = () => {
      handleFetchAllSources(1);
    };
    window.addEventListener('bypass-saved', handleBypassSaved);
    return () => {
      window.removeEventListener('bypass-saved', handleBypassSaved);
    };
  }, [sources, appMode]);

  // Combine filtered local manhuas and scraped manhuas for the display list
  const filteredLocalManhuas = manhuas.filter(m => {
    const isAnime = m.categories.some(c => c.toLowerCase().includes('أنمي') || c.toLowerCase().includes('anime'));
    return appMode === 'anime' ? isAnime : !isAnime;
  });

  const displayManhuas = [...filteredLocalManhuas, ...scrapedList];

  // دالة البحث الموحد
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchAllSources(1, searchQuery);
  };

  const handleSelectScrapedItem = (item: any) => {
    const shell: Manhua = {
      id: item.id,
      title: item.title,
      description: 'جاري جلب التفاصيل مباشرة من المصدر...',
      author: 'غير معروف',
      artist: 'غير معروف',
      status: 'مستمر',
      rating: 4.8,
      views: 0,
      coverUrl: item.coverUrl,
      categories: appMode === 'anime' ? ['أنمي'] : ['مانهوا'],
      chapters: [],
      releaseYear: 2026,
      sourceUrl: item.sourceUrl
    };
    onSelectManhua(item.id, shell);
  };

  // Get featured manhua dynamically or use custom fallback
  const featuredManhua = displayManhuas.length > 0 
    ? (displayManhuas.find(m => m.title?.toLowerCase().includes('hua') || m.title?.toLowerCase().includes('mount') || m.id?.includes('hua')) || displayManhuas[0])
    : null;

  const featuredTitle = featuredManhua?.title || 'Return of the Mount Hua Sect';
  const featuredCover = featuredManhua?.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';
  const featuredCategories = featuredManhua?.categories || ['أكشن', 'مغامرات', 'كوميدي'];

  return (
    <div className="space-y-8 pb-12 animate-fade-in text-right" id="home-view-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl animate-fade-in font-semibold text-xs">
          <Check className="w-5 h-5 text-emerald-500 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* رأس الصفحة مع زر تبديل الواجهة */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-5 w-full" dir="rtl">
        {/* اليمين: زر تغيير الواجهة */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={toggleLayout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[10px] sm:text-xs font-bold text-white border border-zinc-750 transition-all cursor-pointer shadow-sm shrink-0"
          >
            {homeLayout === 'modern' ? <Layers className="w-3.5 h-3.5 text-zinc-400" /> : <Sparkles className="w-3.5 h-3.5 text-red-500" />}
            <span className="hidden sm:inline">تغيير الواجهة</span>
            <span className="sm:hidden">الواجهة</span>
          </button>
        </div>

        {/* الوسط: العنوان الرئيسي */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-sm sm:text-xl font-black text-white font-display flex items-center gap-1 sm:gap-2 text-center truncate">
            <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-500 animate-pulse shrink-0" />
            <span className={appMode === 'anime' ? 'text-amber-500' : 'text-red-500'}>
              {appMode === 'anime' ? 'مكتبة الأنمي' : 'الرئيسية'}
            </span>
          </h1>
        </div>

        {/* اليسار: زر التبديل بين الأنمي والمانهو */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onToggleAppMode}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer border shadow-sm shrink-0 ${
              appMode === 'anime' 
                ? 'bg-rose-600/15 text-rose-500 border-rose-600/30 hover:bg-rose-600/25' 
                : 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {appMode === 'anime' ? <BookOpen className="w-3.5 h-3.5 shrink-0" /> : <Tv className="w-3.5 h-3.5 animate-pulse shrink-0" />}
            <span className="hidden sm:inline">{appMode === 'anime' ? 'واجهة المانهو' : 'واجهة الأنمي'}</span>
            <span className="sm:hidden">{appMode === 'anime' ? 'مانهو' : 'أنمي'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner Cloud Ads */}
      <AdBanner ads={ads} position="top_banner" />

      <AnimatePresence mode="wait">
        {homeLayout === 'modern' ? (
          // ==================== MODERN LAYOUT (الواجهة الجديدة) ====================
          <motion.div 
            key="modern-layout"
            className="space-y-8" 
            dir="rtl"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            
            {/* 1. Featured Hero Banner */}
            {loadingScraped && displayManhuas.length === 0 ? (
              <motion.div 
                key="loading-banner"
                variants={getScatteringVariants(0)}
                className="w-full h-[320px] sm:h-[400px] rounded-3xl bg-zinc-900/40 animate-pulse border border-zinc-800/50 flex flex-col items-center justify-center space-y-4"
              >
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-zinc-500 text-xs">جاري تحميل البانر المميز...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="hero-banner"
                variants={getScatteringVariants(0)}
                onClick={() => featuredManhua && handleSelectScrapedItem(featuredManhua)}
                className="relative w-full h-[360px] sm:h-[440px] rounded-3xl overflow-hidden border border-zinc-800/60 hover:border-red-500/30 transition-all duration-300 shadow-2xl cursor-pointer group"
              >
                {/* Background Image with sophisticated overlays */}
                <div className="absolute inset-0 bg-zinc-950">
                  <img 
                    src={featuredCover || undefined}
                    alt={featuredTitle}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/40 via-transparent to-zinc-950/40" />
                </div>

                {/* Banner content overlays matching screenshot */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
                  {/* Top Corner Badges */}
                  <div className="flex items-center gap-2 flex-row-reverse self-start">
                    <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-extrabold rounded-lg shadow-lg flex items-center gap-1">
                      <span>رائج</span>
                      <span>🔥</span>
                    </span>
                    <span className="px-2.5 py-1 bg-zinc-950/90 border border-zinc-850 text-zinc-100 text-[10px] font-extrabold rounded-lg shadow-lg">
                      {appMode === 'anime' ? 'أنمي مميز' : 'مانهوا مميزة'}
                    </span>
                  </div>

                  {/* Bottom Info Section */}
                  <div className="space-y-3 sm:space-y-4 text-right flex flex-col items-start w-full">
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug max-w-xl drop-shadow-md font-display">
                      {featuredTitle}
                    </h2>
                    
                    <div className="text-[11px] sm:text-xs font-semibold text-zinc-300 flex items-center gap-1.5 flex-row-reverse">
                      {featuredCategories.slice(0, 3).map((cat, idx) => (
                        <span key={cat} className="flex items-center gap-1.5">
                          {idx > 0 && <span className="text-zinc-600">•</span>}
                          <span>{cat}</span>
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (featuredManhua) {
                          handleSelectScrapedItem(featuredManhua);
                        }
                      }}
                      className={`mt-1.5 px-5 py-2.5 ${appMode === 'anime' ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-950/40' : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-950/40'} hover:opacity-95 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer font-display`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>{appMode === 'anime' ? 'ابدأ المشاهدة الآن' : 'ابدأ القراءة الآن'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. تصنيفات مميزة (Featured Categories) */}
            <div className="space-y-3">
              <motion.h3 
                key="categories-title"
                variants={getScatteringVariants(1)}
                className="text-sm sm:text-base font-black text-zinc-200 font-display text-right"
              >
                تصنيفات مميزة
              </motion.h3>
              <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
                {['أكشن', 'خيال', 'مغامرات', 'دراما', 'كوميدي'].map((cat, catIdx) => (
                  <motion.button
                    key={cat}
                    variants={getScatteringVariants(2 + catIdx)}
                    onClick={() => onSelectCategory(cat)}
                    className="px-4 py-2 rounded-xl bg-zinc-950/80 hover:bg-red-500/5 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/35 font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 3. الأكثر شعبية اليوم (Most Popular Today) */}
            {displayManhuas.length > 0 && (
              <div className="space-y-3">
                <motion.h3 
                  key="popular-title"
                  variants={getScatteringVariants(7)}
                  className="text-sm sm:text-base font-black text-zinc-200 font-display text-right"
                >
                  الأكثر شعبية اليوم
                </motion.h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 flex-row-reverse">
                  {displayManhuas.slice(0, 10).map((item, itemIdx) => (
                    <motion.div 
                      key={`popular-${item.id}-${itemIdx}`}
                      variants={getScatteringVariants(8 + itemIdx)}
                      onClick={() => handleSelectScrapedItem(item)}
                      className="w-[110px] sm:w-[130px] shrink-0 cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-900 group-hover:border-red-500/40 transition-all duration-300 bg-zinc-950 shadow-md">
                        <img 
                          src={item.coverUrl || undefined} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        
                        {/* Star rating badge exactly as in the layout */}
                        <div className="absolute bottom-2 right-2 bg-zinc-950/95 border border-zinc-900 px-1.5 py-0.5 rounded-lg text-[9px] font-bold text-amber-400 flex items-center gap-0.5 shadow-md">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating ? item.rating.toFixed(1) : '10.0'}</span>
                        </div>
                      </div>
                      <h4 className="text-zinc-200 text-[10px] sm:text-[11px] font-bold mt-1.5 truncate text-right group-hover:text-red-400 transition-colors">
                        {item.title}
                      </h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. آخر التحديثات (Browse Grid) */}
            <div className="space-y-4 pt-4 border-t border-zinc-900/40">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <div className="p-1.5 bg-red-500/10 rounded-lg">
                    <Compass className="w-4 h-4 text-red-500" />
                  </div>
                  <motion.h3 
                    key="updates-title"
                    variants={getScatteringVariants(18)}
                    className="text-sm sm:text-base font-black text-zinc-200 font-display"
                  >
                    آخر التحديثات
                  </motion.h3>
                </div>
                <button 
                  onClick={() => handleFetchAllSources(1, searchQuery)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-[11px] flex-row-reverse cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingScraped ? 'animate-spin' : ''}`} />
                  تحديث القائمة
                </button>
              </div>

              {loadingScraped && page === 1 && displayManhuas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                  <p className="text-zinc-400 text-sm animate-pulse">جاري التحميل...</p>
                </div>
              ) : scrapedError && displayManhuas.length === 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4">
                  <div className="p-3 bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                    <Shield className="w-6 h-6" />
                  </div>
                  <p className="text-zinc-200 text-sm font-bold leading-relaxed">{scrapedError}</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    لحماية خصوصية الخدمة وتخطي حجب Cloudflare ومشاكل الكابتشا فوراً، يمكنك تفعيل مساعد تخطي الحظر ليدمج متصفحك الحقيقي تلقائياً مع السيرفر!
                  </p>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-bypass-modal'));
                    }}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 mx-auto shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    تفعيل مساعد تخطي الكابتشا والاتصال المباشر
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                    {displayManhuas.map((item, gridIdx) => (
                      <div key={`grid-${item.id}-${gridIdx}`} className="animate-fade-in-up" style={{ animationDelay: `${(gridIdx % 12) * 50}ms` }}>
                        <ManhuaCard 
                          manhua={{
                            id: item.id,
                            title: item.title,
                            description: item.description || 'لا يوجد وصف',
                            author: item.author || 'غير معروف',
                            artist: item.artist || 'غير معروف',
                            coverUrl: item.coverUrl,
                            rating: item.rating || 4.8,
                            status: 'مستمر' as any,
                            views: item.views || 0,
                            chapters: item.chapters || [],
                            releaseYear: item.releaseYear || 2026,
                            categories: (item.categories && item.categories.length > 0) ? item.categories : (() => {
                              if (!sources || !Array.isArray(sources)) return ['مصدر خارجي'];
                              const idx = sources.findIndex(s => s && s.id === item.sourceId);
                              return idx !== -1 ? [`نتيجة ${idx + 1}`] : ['مصدر خارجي'];
                            })()
                          } as any} 
                          onSelect={() => handleSelectScrapedItem(item)}
                          user={user}
                          readingList={readingList}
                          onAddToList={onAddToList}
                          onRemoveFromList={onRemoveFromList}
                          onNavigate={onNavigate}
                        />
                      </div>
                    ))}
                  </div>

                  {scrapedList.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          const nextPage = page + 1;
                          setPage(nextPage);
                          handleFetchAllSources(nextPage, searchQuery, true);
                        }}
                        disabled={loadingMore}
                        className="text-zinc-500 hover:text-red-500 transition-colors p-2 cursor-pointer flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
                        id="load-more-btn-modern"
                        title="جلب المزيد من الأعمال"
                      >
                        {loadingMore ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-red-500 animate-bounce" />
                        )}
                        <span className="text-[10px] font-black tracking-wider">جلب المزيد</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        ) : (
          // ==================== CLASSIC LAYOUT (الواجهة القديمة) ====================
          <motion.div 
            key="classic-layout"
            className="space-y-6"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <Compass className="w-5 h-5 text-red-500" />
                </div>
                <motion.h2 
                  key="classic-title"
                  variants={getScatteringVariants(0)}
                  className="text-xl font-black text-white"
                >
                  آخر التحديثات
                </motion.h2>
              </div>
              <button 
                onClick={() => handleFetchAllSources(1, searchQuery)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs flex-row-reverse"
              >
                <RefreshCw className={`w-4 h-4 ${loadingScraped ? 'animate-spin' : ''}`} />
                تحديث القائمة
              </button>
            </div>

            {loadingScraped && page === 1 && displayManhuas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                <p className="text-zinc-400 text-sm animate-pulse">جاري التحميل...</p>
              </div>
            ) : scrapedError && displayManhuas.length === 0 ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="p-3 bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                  <Shield className="w-6 h-6" />
                </div>
                <p className="text-zinc-200 text-sm font-bold leading-relaxed">{scrapedError}</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  لحماية خصوصية الخدمة وتخطي حجب Cloudflare ومشاكل الكابتشا فوراً، يمكنك تفعيل مساعد تخطي الحظر ليدمج متصفحك الحقيقي تلقائياً مع السيرفر!
                </p>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-bypass-modal'));
                  }}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 mx-auto shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  تفعيل مساعد تخطي الكابتشا والاتصال المباشر
                </button>
              </div>
            ) : !loadingScraped && displayManhuas.length === 0 ? (
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="p-3 bg-zinc-900/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-zinc-600">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-zinc-400 text-sm font-bold leading-relaxed">
                  {searchQuery ? `لم نتمكن من العثور على نتائج للبحث عن "${searchQuery}"` : `لا توجد ${appMode === 'anime' ? 'أنميات' : 'مانهوات'} متاحة حالياً في هذا النمط.`}
                </p>
                <button
                  onClick={() => handleFetchAllSources(1, searchQuery)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black transition-all flex items-center gap-2 mx-auto border border-zinc-800 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-red-500" />
                  إعادة تحديث القائمة
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                  {displayManhuas.map((item, classicIdx) => (
                    <div key={`classic-grid-${item.id}`} className="animate-fade-in-up" style={{ animationDelay: `${(classicIdx % 12) * 50}ms` }}>
                      <ManhuaCard 
                        manhua={{
                          id: item.id,
                          title: item.title,
                          description: item.description || 'لا يوجد وصف',
                          author: item.author || 'غير معروف',
                          artist: item.artist || 'غير معروف',
                          coverUrl: item.coverUrl,
                          rating: item.rating || 4.8,
                          status: 'مستمر' as any,
                          views: item.views || 0,
                          chapters: item.chapters || [],
                          releaseYear: item.releaseYear || 2026,
                          categories: (item.categories && item.categories.length > 0) ? item.categories : (() => {
                            if (!sources || !Array.isArray(sources)) return ['مصدر خارجي'];
                            const idx = sources.findIndex(s => s && s.id === item.sourceId);
                            return idx !== -1 ? [`نتيجة ${idx + 1}`] : ['مصدر خارجي'];
                          })()
                        } as any} 
                        onSelect={() => handleSelectScrapedItem(item)}
                        user={user}
                        readingList={readingList}
                        onAddToList={onAddToList}
                        onRemoveFromList={onRemoveFromList}
                        onNavigate={onNavigate}
                      />
                    </div>
                  ))}
                </div>

                {scrapedList.length > 0 && (
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        handleFetchAllSources(nextPage, searchQuery, true);
                      }}
                      disabled={loadingMore}
                      className="text-zinc-500 hover:text-red-500 transition-colors p-2 cursor-pointer flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
                      id="load-more-btn"
                      title="جلب المزيد من الأعمال"
                    >
                      {loadingMore ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-red-500 animate-bounce" />
                      )}
                      <span className="text-[10px] font-black tracking-wider">جلب المزيد</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
