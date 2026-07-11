import React, { useState, useEffect } from 'react';
import { 
  Flame, Star, Award, TrendingUp, Compass, Grid, Loader2, RefreshCw, 
  Globe, Wifi, Cpu, ExternalLink, Plus, Trash2, Layers, X, Sparkles, 
  BookOpen, Clock, Heart, Zap, Shield, ArrowRight, Check, Search
} from 'lucide-react';
import { Manhua, ScraperSource, UserProfile, ReadingListItem } from '../types';
import ManhuaCard from '../components/ManhuaCard';
import { scrapeMangaList } from '../utils/scraper';

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
}

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
  onNavigate
}: HomeViewProps) {
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
  const handleFetchAllSources = async (pageNum: number = 1, query?: string, isLoadMore: boolean = false) => {
    if (sources.length === 0) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoadingScraped(true);
      setScrapedError(null);
      setPage(1); // Reset page state on fresh fetch/search
    }
    
    try {
      let combinedList: any[] = [];
      
      // Parallel fetching to avoid blocking with retries
      const fetchWithRetry = async (source: any, pageNum: number, query: string, retryCount = 0): Promise<any[]> => {
        try {
          return await scrapeMangaList(source, pageNum, query);
        } catch (err) {
          console.error(`Error fetching from ${source.name} (Attempt ${retryCount + 1}):`, err);
          if (retryCount < 3) { // Retry up to 3 times
            await new Promise(resolve => setTimeout(resolve, 3000));
            return fetchWithRetry(source, pageNum, query, retryCount + 1);
          }
          return [];
        }
      };

      const promises = sources.map(source => fetchWithRetry(source, pageNum, query));
      
      const resultsArray = await Promise.all(promises);
      for (const results of resultsArray) {
        combinedList = [...combinedList, ...results];
      }
      
      // إذا لم يكن هناك بحث، نقوم بترتيب عشوائي بسيط للتنويع
      if (!query) {
        combinedList = combinedList.sort(() => Math.random() - 0.5);
      }
      
      if (isLoadMore) {
        setScrapedList(prev => {
          // Prevent duplicates by checking if id already exists
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNew = combinedList.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
        if (combinedList.length > 0) {
          triggerToast(`تم جلب ${combinedList.length} عمل إضافي!`);
        } else {
          triggerToast('لا يوجد مزيد من الأعمال المتاحة حالياً.');
        }
      } else {
        setScrapedList(combinedList);
        if (combinedList.length === 0 && query) {
          setScrapedError('لم يتم العثور على نتائج للبحث في كافة المصادر.');
        } else if (query) {
          triggerToast(`تم جلب ${combinedList.length} نتيجة بحث بنجاح!`);
        } else {
          triggerToast('تم تحديث قائمة الأعمال بنجاح!');
        }
      }
    } catch (err: any) {
      if (!isLoadMore) {
        setScrapedError('حدث خطأ أثناء جلب البيانات من المصادر.');
      }
    } finally {
      setLoadingScraped(false);
      setLoadingMore(false);
    }
  };

  // تشغيل الجلب عند فتح الصفحة أو تغير المصادر
  useEffect(() => {
    handleFetchAllSources(1);
  }, [sources]);

  // Combine mock manhuas and scraped manhuas for the display list
  const displayManhuas = [...manhuas, ...scrapedList];

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
      categories: ['مانهوا'],
      chapters: [],
      releaseYear: 2026,
      sourceUrl: item.sourceUrl
    };
    onSelectManhua(item.id, shell);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in text-right" id="home-view-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl animate-fade-in font-semibold text-xs">
          <Check className="w-5 h-5 text-emerald-500 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* البحث الموحد */}
      {/* Search bar removed as requested */}

      {/* قسم الاستكشاف المدمج */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <Compass className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white">آخر التحديثات</h2>
          </div>
          <button 
            onClick={() => handleFetchAllSources(1, searchQuery)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs flex-row-reverse"
          >
            <RefreshCw className={`w-4 h-4 ${loadingScraped ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>

        {loadingScraped && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-zinc-400 text-sm animate-pulse">جاري تحميل</p>
          </div>
        ) : scrapedError && scrapedList.length === 0 ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-400 text-sm">{scrapedError}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {displayManhuas.map((item) => (
                <ManhuaCard 
                  key={item.id}
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
                    categories: item.categories || [sources.find(s => s.id === item.sourceId)?.name || 'مصدر خارجي']
                  } as any} 
                  onSelect={() => handleSelectScrapedItem(item)}
                  user={user}
                  readingList={readingList}
                  onAddToList={onAddToList}
                  onRemoveFromList={onRemoveFromList}
                  onNavigate={onNavigate}
                />
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
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs transition-all border border-zinc-800 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
                  id="load-more-btn"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span>جاري جلب الأعمال...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-red-500" />
                      <span>جلب مزيد من الأعمال</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
