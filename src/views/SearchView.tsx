import React, { useState, useEffect } from 'react';
import { Search, Compass, Grid, Filter, RefreshCw, Star, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Manhua, ManhuaStatus, ScraperSource, UserProfile, ReadingListItem } from '../types';
import ManhuaCard from '../components/ManhuaCard';
import AddToListPicker from '../components/AddToListPicker';
import { categoriesList, animeCategoriesList } from '../data';
import { scrapeMangaList } from '../utils/scraper';

const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  'أكشن': ['أكشن', 'اكشن', 'قتال', 'حرب', 'حركة', 'معركة', 'قبضة', 'سيف', 'عمل', 'مبارزة', 'صراع', 'مواجهة', 'action'],
  'مغامرة': ['مغامرة', 'مغامرات', 'استكشاف', 'رحلة', 'عالم', 'سفر', 'برية', 'adventure'],
  'خيال': ['خيال', 'فانتازيا', 'سحر', 'تجسد', 'قدرات', 'خارقة', 'مخلوقات', 'تنين', 'وحوش', 'خيالي', 'fantasy'],
  'فنون قتالية': ['قتال', 'كونغ', 'فنون قتالية', 'نينجا', 'سيف', 'فنون القتال', 'تشي', 'طاقة', 'قبضة', 'سياف', 'martial'],
  'زراعة (Cultivation)': ['زراعة', 'خالد', 'روح', 'دان', 'مزارع', 'cultivation', 'ممارسة', 'تأمل'],
  'إيسيكاي (Isekai)': ['انتقال', 'عالم آخر', 'تجسيد', 'إيسيكاي', 'ايسيكاي', 'بطل', 'إعادة ولادة', 'تناسخ', 'انتقلت', 'isekai'],
  'إيسيكاي': ['انتقال', 'عالم آخر', 'تجسيد', 'إيسيكاي', 'ايسيكاي', 'بطل', 'إعادة ولادة', 'تناسخ', 'انتقلت', 'isekai'],
  'نظام (System)': ['نظام', 'شاشة', 'مستوى', 'نقاط', 'مهارة', 'لوحة', 'تطوير', 'ترقية', 'system'],
  'زمن (Regression)': ['زمن', 'عودة', 'ماضي', 'مستقبل', 'تراجع', 'انتقام', 'سفر عبر الزمن', 'إعادة زمن', 'سفر بالزمن', 'regression'],
  'كوميديا': ['كوميدي', 'مضحك', 'هزل', 'دعابة', 'ساخر', 'مرح', 'فكاهة', 'comedy'],
  'دراما': ['دراما', 'مأساة', 'حزن', 'معاناة', 'عائلي', 'مأساوي', 'مشاعر', 'drama'],
  'رومنسي': ['رومنسي', 'رومانسية', 'حب', 'زواج', 'عشق', 'خطوبة', 'رومانس', 'حبيبة', 'حبيب', 'romance'],
  'إثارة': ['إثارة', 'غموض', 'رعب', 'تشويق', 'مثير', 'حماسي', 'إثاره', 'thriller'],
  'غموض': ['غموض', 'لغز', 'تحقيق', 'أسرار', 'خفي', 'مجهول', 'لغز', 'mystery'],
  'نفسي': ['نفسي', 'جنون', 'عقل', 'هوس', 'ظلام', 'ذكاء', 'تخطيط', 'psychological'],
  'قوة خارقة': ['خارق', 'قوة خارقة', 'قدرة', 'طاقة', 'قوى', 'مهارات خارقة', 'قوى خارقة', 'superpower'],
  'تاريخي': ['تاريخي', 'إمبراطور', 'قصر', 'ملكي', 'قديم', 'سلالة', 'أمير', 'ملكة', 'historical'],
  'خارق للطبيعة': ['خارق', 'أرواح', 'شياطين', 'وحوش', 'أشباح', 'موتى', 'مصاص دماء', 'supernatural'],
  'حياة مدرسية': ['مدرسة', 'طالب', 'مدرسي', 'فصل', 'أكاديمية', 'طلاب', 'ثانوية', 'school'],
  'سحر': ['سحر', 'ساحر', 'تعويذة', 'عجائب', 'شعوذة', 'سحرة', 'magic'],
  'شياطين': ['شيطان', 'شياطين', 'ملك الشياطين', 'جهنم', 'أبالسة', 'demon', 'demons'],
  'ويب تون': ['ويب تون', 'مانهوا', 'ملونة', 'فصل', 'شريط', 'webtoon'],
  'شريحة من الحياة': ['يومي', 'حياة يومية', 'شريحة من الحياة', 'واقعي', 'بسيط', 'slice'],
  'تشويق': ['تشويق', 'إثارة', 'شد', 'غموض', 'مثير', 'حماس', 'suspense'],
  'رعب': ['رعب', 'مخيف', 'أشباح', 'ظلام', 'وحوش', 'دموي', 'horror'],
  'حريم': ['حريم', 'تعدد', 'زوجات', 'فتيات', 'harem'],
  'إعادة تجسيد': ['تجسيد', 'ولادة', 'إعادة ولادة', 'حياة ثانية', 'مجدداً', 'reincarnation'],
  'سفر عبر الزمن': ['زمن', 'ماضي', 'مستقبل', 'تراجع', 'عودة بالزمن', 'سفر عبر الزمن', 'time-travel'],
  'ألعاب': ['لعبة', 'ألعاب', 'افتراضي', 'نظام', 'لاعب', 'game', 'مستوى'],
  'ميكا': ['آلي', 'روبوت', 'ميكا', 'mecha', 'آليات'],
  'خيال علمي': ['علمي', 'تكنولوجيا', 'فضاء', 'مستقبل', 'خيال علمي', 'sci-fi', 'science'],
  'رياضة': ['رياضة', 'كرة', 'سلة', 'قدم', 'سباق', 'رياضي', 'نادي', 'sports'],
  'شوجو': ['شوجو', 'فتيات', 'رومانسية', 'مدرسة', 'shoujo'],
  'شونين': ['شونين', 'بطل', 'عزيمة', 'صداقة', 'shounen', 'قتال'],
  'سينين': ['سينين', 'بالغين', 'نفسي', 'غموض', 'seinen', 'دموي'],
  'مأساة': ['مأساة', 'حزن', 'موت', 'مأساوي', 'فقدان', 'tragedy'],
  'حياة يومية': ['يومي', 'حياة يومية', 'بسيط', 'هادئ', 'أصدقاء'],
  'موسيقى': ['موسيقى', 'غناء', 'عزف', 'فرقة', 'music'],
  'فضاء': ['فضاء', 'كواكب', 'نجوم', 'مجرة', 'space'],
  'عسكري': ['عسكري', 'جيش', 'جنود', 'معركة', 'military']
};

// Safe helper to anonymize/hide external source names for privacy and security
function getPublicSourceName(): string {
  return 'المصدر الأصلي';
}

function matchesCategory(item: any, selectedCat: string | null): boolean {
  if (!selectedCat) return true;
  
  // If this item was fetched for selectedCat or has selectedCat in categories
  if (item.categories && Array.isArray(item.categories)) {
    if (item.categories.some((c: string) => c.toLowerCase() === selectedCat.toLowerCase() || c.toLowerCase().includes(selectedCat.toLowerCase()))) {
      return true;
    }
  }

  // If this is a scraped item, don't filter it out when retrieved for category
  if (item.id && String(item.id).startsWith('scr-')) {
    return true;
  }
  
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();

  // Fallback to keyword matching
  const keywords = CATEGORY_KEYWORDS[selectedCat];
  if (keywords) {
    return keywords.some(keyword => {
      const kw = keyword.toLowerCase();
      return title.includes(kw) || desc.includes(kw);
    });
  }
  
  return title.includes(selectedCat.toLowerCase()) || desc.includes(selectedCat.toLowerCase());
}

function matchesStatus(item: any, selectedSt: string): boolean {
  if (selectedSt === 'الكل') return true;
  
  const itemStatus = (item.status || 'مستمر').trim();
  const title = (item.title || '').toLowerCase();
  const latestChapter = (item.latestChapter || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();

  if (selectedSt === 'مستمر') {
    const isCompleted = title.includes('مكتمل') || 
                        title.includes('منتهي') || 
                        title.includes('النهاية') || 
                        title.includes('الخاتمة') ||
                        latestChapter.includes('مكتمل') ||
                        latestChapter.includes('منتهي') ||
                        latestChapter.includes('النهاية');
    return itemStatus === 'مستمر' && !isCompleted;
  }

  if (selectedSt === 'مكتمل') {
    return itemStatus === 'مكتمل' || 
           title.includes('مكتمل') || 
           title.includes('منتهي') || 
           title.includes('النهاية') || 
           title.includes('الخاتمة') ||
           title.includes('النهايه') ||
           latestChapter.includes('مكتمل') ||
           latestChapter.includes('منتهي') ||
           latestChapter.includes('النهاية') ||
           latestChapter.includes('النهايه');
  }

  if (selectedSt === 'متوقف مؤقتاً') {
    return itemStatus === 'متوقف مؤقتاً' || 
           title.includes('متوقف') || 
           title.includes('توقف') || 
           desc.includes('توقف') ||
           desc.includes('متوقف');
  }

  return true;
}

interface SearchViewProps {
  manhuas: Manhua[];
  initialQuery?: string;
  initialCategory?: string | null;
  onSelectManhua: (id: string, optionalMangaShell?: Manhua) => void;
  sources?: ScraperSource[];
  user: UserProfile | null;
  readingList: ReadingListItem[];
  onAddToList: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList: (manhuaId: string) => Promise<void>;
  onNavigate: (view: any) => void;
  appMode?: 'manga' | 'anime';
}

export default function SearchView({
  manhuas,
  initialQuery = '',
  initialCategory = null,
  onSelectManhua,
  sources = [],
  user,
  readingList,
  onAddToList,
  onRemoveFromList,
  onNavigate,
  appMode = 'manga'
}: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<ManhuaStatus | 'الكل'>('الكل');
  const [filteredManhuas, setFilteredManhuas] = useState<Manhua[]>(manhuas);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState<boolean>(!!initialCategory);
  
  const [scrapedGroups, setScrapedGroups] = useState<{
    [sourceId: string]: {
      sourceName: string;
      results: any[];
      loading: boolean;
      error: string | null;
      page: number;
      hasMore: boolean;
    }
  }>({});

  const categoriesToUse = appMode === 'anime' ? animeCategoriesList : categoriesList;

  // Re-sync with initial inputs if they change from external triggers
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let result = manhuas;

    // Filter by appMode first
    result = result.filter(m => {
      const isAnime = m.categories.some(c => c.toLowerCase().includes('أنمي') || c.toLowerCase().includes('anime'));
      return appMode === 'anime' ? isAnime : !isAnime;
    });

    if (query.trim() !== '') {
      result = result.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.author.toLowerCase().includes(query.toLowerCase()) ||
        m.artist.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter((m) => m.categories.includes(selectedCategory));
    }

    if (selectedStatus !== 'الكل') {
      result = result.filter((m) => m.status === selectedStatus);
    }

    setFilteredManhuas(result);
  }, [query, selectedCategory, selectedStatus, manhuas, appMode]);

  const [bypassTrigger, setBypassTrigger] = useState(0);

  useEffect(() => { 
    const handleBypassSaved = () => {
      setBypassTrigger(prev => prev + 1);
    };
    window.addEventListener('bypass-saved', handleBypassSaved);
    return () => {
      window.removeEventListener('bypass-saved', handleBypassSaved);
    };
  }, []);

  const fetchFromSource = async (source: ScraperSource, page: number = 1, isLoadMore: boolean = false) => {
    const scraperSearchQuery = query.trim() !== '' 
      ? query.trim() 
      : (selectedCategory ? selectedCategory : '');
    
    setScrapedGroups(prev => ({
      ...prev,
      [source.id]: {
        ...prev[source.id],
        loading: true,
        error: null
      }
    }));

    try {
      const results = await scrapeMangaList(source, page, scraperSearchQuery);
      
      const mappedResults = (results || []).map(item => {
        if (selectedCategory) {
          const currentCats = item.categories || [];
          if (!currentCats.includes(selectedCategory)) {
            return {
              ...item,
              categories: [...currentCats, selectedCategory]
            };
          }
        }
        return item;
      });

      setScrapedGroups(prev => {
        const existing = prev[source.id]?.results || [];
        const existingIds = new Set(existing.map(r => r.id));
        const uniqueNew = mappedResults.filter(r => !existingIds.has(r.id));
        
        return {
          ...prev,
          [source.id]: {
            ...prev[source.id],
            results: isLoadMore ? [...existing, ...uniqueNew] : mappedResults,
            loading: false,
            error: null,
            page: page,
            hasMore: results.length > 0
          }
        };
      });
    } catch (err: any) {
      console.error(`Search failed for source ${source.name}:`, err);
      setScrapedGroups(prev => ({
        ...prev,
        [source.id]: {
          ...prev[source.id],
          loading: false,
          error: null,
          hasMore: false
        }
      }));
    }
  };

  useEffect(() => {
    if (!sources || !Array.isArray(sources) || sources.length === 0) return;

    const activeSources = sources.filter(s => appMode === 'anime' ? s.type === 'anime' : s.type !== 'anime');
    if (activeSources.length === 0) {
      setScrapedGroups({});
      return;
    }

    // Initialize groups
    const initialGroups: typeof scrapedGroups = {};
    activeSources.forEach((src) => {
      if (!src) return;
      initialGroups[src.id] = {
        sourceName: getPublicSourceName(),
        results: [],
        loading: true,
        error: null,
        page: 1,
        hasMore: true
      };
    });
    setScrapedGroups(initialGroups);

    // debounce fetching
    const timer = setTimeout(() => {
      activeSources.forEach(source => fetchFromSource(source, 1));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedStatus, sources, bypassTrigger, appMode]);

  const handleLoadMore = (source: ScraperSource) => {
    const currentGroup = scrapedGroups[source.id];
    if (currentGroup && !currentGroup.loading && currentGroup.hasMore) {
      fetchFromSource(source, currentGroup.page + 1, true);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory(null);
    setSelectedStatus('الكل');
  };

  // Compute total found count across local database and all scraped groups
  const totalScrapedCount = Object.values(scrapedGroups).reduce((sum, group: any) => {
    if (!group || !group.results) return sum;
    const displayed = group.results.filter(item => {
      const shell: Manhua = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        author: 'مجهول',
        artist: 'مجهول',
        status: 'مستمر' as ManhuaStatus,
        rating: item.rating || 4.8,
        views: item.views || 1000,
        coverUrl: item.coverUrl || item.cover,
        categories: item.categories || [],
        chapters: [],
        releaseYear: 2026,
        sourceUrl: item.sourceUrl || item.url,
      };
      return matchesCategory(shell, selectedCategory) && matchesStatus(shell, selectedStatus);
    });
    return sum + displayed.length;
  }, 0);

  const totalFoundCount = filteredManhuas.length + totalScrapedCount;

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="search-view-container">
      {/* Search inputs bar */}
      <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border-r-4 border-red-500 pr-3">
            <Compass className="w-5 h-5 text-red-500" />
            <h1 className="text-lg font-bold text-zinc-100 font-display">
              {appMode === 'anime' ? 'قائمة الأنمي والبحث المتقدم' : 'قائمة المانجا والبحث المتقدم'}
            </h1>
          </div>
          
          {(query || selectedCategory || selectedStatus !== 'الكل') && (
            <button
              onClick={resetFilters}
              className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
              id="reset-filters-btn"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>

        {/* Text Input Search by name */}
        <div className="relative">
          <input
            type="text"
            placeholder={appMode === 'anime' ? 'ابحث عن اسم الأنمي، الاسم الإنجليزي، أو القصة...' : 'ابحث بالاسم، الاسم الإنجليزي، الكاتب، الرسام أو تفاصيل القصة...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-500 rounded-xl py-3 px-11 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/25 transition-all"
            id="search-input-field"
          />
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-zinc-500" />
        </div>

        {/* Filter Grid: Status and other custom attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400">
              {appMode === 'anime' ? 'حالة عرض الأنمي:' : 'حالة نشر المانهو:'}
            </label>
            <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
              {['الكل', 'مستمر', 'مكتمل', 'متوقف مؤقتاً'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st as any)}
                  className={`py-1 rounded text-xs font-bold transition-all ${
                    selectedStatus === st
                      ? 'bg-red-600 text-white shadow'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  id={`status-filter-${st}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Quick info tag */}
          <div className="flex items-center justify-end">
            <div className="text-xs text-zinc-500 bg-zinc-950/40 border border-zinc-850 rounded-lg p-3 w-full text-center">
              تم العثور على <span className="text-red-500 font-extrabold font-mono">{totalFoundCount}</span> {appMode === 'anime' ? 'أنمي' : 'مانهو'} مطابقة لمعايير البحث.
            </div>
          </div>

        </div>

        {/* Categories Chips - Collapsible */}
        <div className="space-y-2 pt-2 border-t border-zinc-900">
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="flex items-center justify-between w-full text-xs font-bold text-zinc-300 hover:text-white py-1 px-1 transition-colors group cursor-pointer"
            id="toggle-categories-btn"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-red-500" />
              <span>التصنيفات {selectedCategory ? <span className="text-red-400 mr-1">({selectedCategory})</span> : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 group-hover:text-zinc-200">
              <span>{isCategoriesOpen ? 'إغلاق التصنيفات' : 'عرض التصنيفات'}</span>
              {isCategoriesOpen ? (
                <ChevronUp className="w-4 h-4 text-red-500 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-transform" />
              )}
            </div>
          </button>

          {isCategoriesOpen && (
            <div className="flex flex-wrap gap-1.5 pt-2 animate-fade-in">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
                id="category-all-btn"
              >
                جميع التصنيفات
              </button>
              {categoriesToUse.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-red-600 border-red-500 text-white shadow'
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                  }`}
                  id={`category-filter-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Grid of All Results Combined & Grouped like Mihon */}
      <div className="space-y-8">
        
        {/* Local Database Results */}
        {filteredManhuas.length > 0 && (
          <div className="space-y-4 bg-zinc-900/20 border border-zinc-800 p-5 rounded-2xl" id="local-results-section">
            <div className="flex justify-between items-center border-r-4 border-rose-500 pr-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow shadow-rose-500/50"></span>
                <h2 className="text-sm font-extrabold text-zinc-100 font-display">
                  {appMode === 'anime' ? `قاعدة البيانات المحلية للأنمي (${filteredManhuas.length} أنمي)` : `قاعدة البيانات المحلية للتطبيق (${filteredManhuas.length} مانهو)`}
                </h2>
              </div>
              <span className="text-[10px] bg-rose-600/20 text-rose-400 font-bold px-2 py-0.5 rounded-md border border-rose-500/30 font-mono">حفظ فوري</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredManhuas.map((manhua) => (
                <div key={manhua.id} className="relative">
                  <ManhuaCard
                    manhua={manhua}
                    onSelect={onSelectManhua}
                    user={user}
                    readingList={readingList}
                    onAddToList={onAddToList}
                    onRemoveFromList={onRemoveFromList}
                    onNavigate={onNavigate}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Sources Results Grouped */}
        {sources.map((source, index) => {
          const group = scrapedGroups[source.id];
          if (!group) return null;

          const displayedScrapedResults = (group.results || []).filter(item => {
            const shell: Manhua = {
              id: item.id,
              title: item.title,
              description: item.description || '',
              author: 'مجهول',
              artist: 'مجهول',
              status: 'مستمر' as ManhuaStatus,
              rating: item.rating || 4.8,
              views: item.views || 1000,
              coverUrl: item.coverUrl || item.cover,
              categories: item.categories || [],
              chapters: [],
              releaseYear: 2026,
              sourceUrl: item.sourceUrl || item.url,
            };
            return matchesCategory(shell, selectedCategory) && matchesStatus(shell, selectedStatus);
          });

          if (!group.loading && displayedScrapedResults.length === 0) return null;

          const publicName = getPublicSourceName();

          return (
            <div key={source.id} className="space-y-4 bg-zinc-900/10 border border-zinc-900 p-5 rounded-2xl">
              <div className="flex justify-between items-center border-r-4 border-zinc-500 pr-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${group.loading ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                  <h2 className="text-sm font-extrabold text-zinc-100 font-display">{publicName}</h2>
                </div>
                {group.loading && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
              </div>

              {group.loading && displayedScrapedResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span className="text-xs text-zinc-400">جاري {query.trim() === '' ? 'جلب النتائج' : 'البحث وجلب النتائج'} من {publicName}...</span>
                </div>
              )}

              {displayedScrapedResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedScrapedResults.map((item, idx) => {
                    const shell: Manhua = {
                      id: item.id,
                      title: item.title,
                      description: 'جاري جلب التفاصيل من المصدر...',
                      author: 'مجهول',
                      artist: 'مجهول',
                      status: 'مستمر' as ManhuaStatus,
                      rating: item.rating || 4.8,
                      views: item.views || Math.floor(Math.random() * 10000) + 1000,
                      coverUrl: item.coverUrl || item.cover,
                      categories: item.categories || [appMode === 'anime' ? 'أنمي' : 'ويب تون'],
                      chapters: [],
                      releaseYear: new Date().getFullYear(),
                      sourceUrl: item.sourceUrl || item.url,
                    };
                    return (
                      <div 
                        key={`${item.id}-${idx}`}
                        onClick={() => onSelectManhua(shell.id, shell)}
                        className="bg-zinc-950/80 border border-zinc-850 rounded-xl overflow-hidden cursor-pointer hover:border-red-500 transition-colors flex flex-col h-full group/card"
                      >
                        <div className="aspect-[2/3] relative overflow-hidden">
                          <img 
                            src={shell.coverUrl || undefined} 
                            alt={shell.title} 
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            {publicName}
                          </div>
                          
                          {/* Floating list picker button for scraped results */}
                          <div className="absolute bottom-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                            <AddToListPicker
                              user={user}
                              manhua={shell}
                              readingList={readingList}
                              onAddToList={onAddToList}
                              onRemoveFromList={onRemoveFromList}
                              onNavigate={onNavigate}
                            />
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <h3 className="text-xs font-bold text-zinc-100 line-clamp-2 leading-relaxed group-hover/card:text-red-400 transition-colors">{shell.title}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {group.hasMore && group.results.length > 0 && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => handleLoadMore(source)}
                    disabled={group.loading}
                    className="px-6 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded-lg border border-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {group.loading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 text-red-500" />
                        <span>عرض المزيد من {publicName}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* No results across all targets */}
        {filteredManhuas.length === 0 && Object.values(scrapedGroups).every((group: any) => {
          const displayed = (group.results || []).filter((item: any) => {
            const shell: Manhua = {
              id: item.id,
              title: item.title,
              description: item.description || '',
              author: 'مجهول',
              artist: 'مجهول',
              status: 'مستمر' as ManhuaStatus,
              rating: item.rating || 4.8,
              views: item.views || 1000,
              coverUrl: item.coverUrl || item.cover,
              categories: item.categories || [],
              chapters: [],
              releaseYear: 2026,
              sourceUrl: item.sourceUrl || item.url,
            };
            return matchesCategory(shell, selectedCategory) && matchesStatus(shell, selectedStatus);
          });
          return !group.loading && displayed.length === 0;
        }) && (
          <div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl py-16 text-center space-y-3">
            <Compass className="w-12 h-12 mx-auto text-zinc-700 stroke-1 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-300">لم يتم العثور على أي نتائج مطابقة في أي مصدر!</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              تأكد من كتابة اسم {appMode === 'anime' ? 'الأنمي' : 'المانهو'} بشكل صحيح، أو جرب تصفح تصنيف آخر أو تصفية حالة {appMode === 'anime' ? 'عرض' : 'نشر'} مختلفة.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all mt-2 active:scale-95"
              id="reset-empty-btn"
            >
              إعادة تعيين والبدء من جديد
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
