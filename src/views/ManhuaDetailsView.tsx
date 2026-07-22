import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Eye, Calendar, User, Palette, Bookmark, BookOpen, Clock, Loader2, RefreshCw, Lock, Download, CheckCircle, DownloadCloud, Trash2, AlertCircle, Play, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Manhua, Chapter, ScraperSource, UserProfile, ReadingListItem } from '../types';
import { scrapeMangaDetails, scrapeMangaChapters, scrapeChapterPages } from '../utils/scraper';
import { extractNumber } from '../utils/scraperUtils';
import AddToListPicker from '../components/AddToListPicker';
import { saveManhuaOffline, saveChapterOffline, getOfflineChaptersForManhua, convertUrlToBase64, deleteChapterOffline, fetchAsBlob } from '../utils/offlineDb';

interface ManhuaDetailsViewProps {
  manhua: Manhua;
  onBack: () => void;
  onSelectChapter: (chapterId: string, updatedManhua?: Manhua) => void;
  onSelectCategory: (category: string) => void;
  onSearch?: (query: string) => void;
  sources?: ScraperSource[];
  onUpdateManhua?: (manhua: Manhua) => void;
  user: UserProfile | null;
  readingList: ReadingListItem[];
  onAddToList: (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => Promise<void>;
  onRemoveFromList: (manhuaId: string) => Promise<void>;
  onNavigate?: (view: any) => void;
}

export default function ManhuaDetailsView({
  manhua,
  onBack,
  onSelectChapter,
  onSelectCategory,
  onSearch,
  sources = [],
  onUpdateManhua,
  user,
  readingList,
  onAddToList,
  onRemoveFromList,
  onNavigate
}: ManhuaDetailsViewProps) {
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedManhua, setScrapedManhua] = useState<Manhua | null>(null);
  const [chapterPage, setChapterPage] = useState(1);
  const [loadingMoreChapters, setLoadingMoreChapters] = useState(false);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [selectedLockedChapter, setSelectedLockedChapter] = useState<Chapter | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isScraped = manhua.id.startsWith('scr-') || !!manhua.sourceUrl || !!scrapedManhua;
  const displayManhua = scrapedManhua || manhua;

  const resolveSource = (m: Manhua) => {
    return sources.find(s =>
      m.id.startsWith(`scr-${s.id}-`) ||
      (m.sourceUrl && (m.sourceUrl.includes(s.baseUrl) || m.sourceUrl.includes(s.id))) ||
      (m.sourceId && m.sourceId === s.id)
    ) || sources.find(s =>
      manhua.id.startsWith(`scr-${s.id}-`) ||
      (manhua.sourceUrl && (manhua.sourceUrl.includes(s.baseUrl) || manhua.sourceUrl.includes(s.id)))
    ) || sources.find(s => s.id === 'azorafly') || sources[0];
  };

  const currentSource = resolveSource(displayManhua);
  const isAnime = currentSource?.type === 'anime' || manhua.id.includes('witanime');
  
  const contentTypeName = isAnime ? 'أنمي' : 'مانهو';
  const actionName = isAnime ? 'مشاهدة' : 'قراءة';
  const chapterName = isAnime ? 'حلقة' : 'فصل';
  const chaptersName = isAnime ? 'حلقات' : 'فصول';

  // Offline downloading states
  const [downloadedChapterIds, setDownloadedChapterIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, { current: number; total: number; status: 'downloading' | 'completed' | 'failed' }>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Custom confirmation and alert states to bypass iframe restrictions
  const [confirmOfflineAction, setConfirmOfflineAction] = useState<{
    type: 'remove_chapter' | 'download_all';
    chapterId?: string;
    chapterTitle?: string;
    count?: number;
  } | null>(null);
  const [offlineAlert, setOfflineAlert] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfflineChapters = async () => {
      try {
        const offlineChaps = await getOfflineChaptersForManhua(displayManhua.id);
        setDownloadedChapterIds(new Set(offlineChaps.map(c => c.id)));
      } catch (err) {
        console.error('Failed to load offline chapters:', err);
      }
    };
    fetchOfflineChapters();
  }, [displayManhua.id, downloadProgress]);

  const handleDownloadChapter = async (chapter: Chapter) => {
    if (chapter.isLocked) return;
    
    setDownloadProgress(prev => ({
      ...prev,
      [chapter.id]: { current: 0, total: 1, status: 'downloading' }
    }));

    try {
      const source = resolveSource(displayManhua);
      if (!source && isScraped) {
        throw new Error('المصدر غير متوفر.');
      }

      let pages: (string | Blob)[] = [];
      if (isScraped) {
        const pagesUrl = chapter.pages[0];
        pages = await scrapeChapterPages(source!, pagesUrl as string);
      } else {
        pages = chapter.pages;
      }

      if (!pages || pages.length === 0) {
        throw new Error('لا توجد صفحات في هذا الفصل.');
      }

      setDownloadProgress(prev => ({
        ...prev,
        [chapter.id]: { current: 0, total: pages.length, status: 'downloading' }
      }));

      const downloadedPages: (string | Blob)[] = [];
      const isAnime = source?.type === 'anime';

      for (let i = 0; i < pages.length; i++) {
        if (isAnime) {
          // For anime, attempt to download the video as a Blob via proxy or directly
          try {
            const blob = await fetchAsBlob(pages[i] as string);
            downloadedPages.push(blob);
          } catch (e) {
            console.warn('[Download] Failed to download anime blob, falling back to URL:', e);
            downloadedPages.push(pages[i]);
          }
        } else {
          const base64 = await convertUrlToBase64(pages[i] as string);
          downloadedPages.push(base64);
        }
        
        setDownloadProgress(prev => ({
          ...prev,
          [chapter.id]: { current: i + 1, total: pages.length, status: 'downloading' }
        }));
      }

      await saveManhuaOffline({
        id: displayManhua.id,
        title: displayManhua.title,
        description: displayManhua.description,
        coverUrl: displayManhua.coverUrl,
        author: displayManhua.author,
        artist: displayManhua.artist || 'غير معروف',
        status: displayManhua.status,
        categories: displayManhua.categories,
        sourceId: displayManhua.id.startsWith('scr-') ? displayManhua.id.split('-')[1] : 'عام',
        downloadedAt: Date.now()
      });

      await saveChapterOffline({
        id: chapter.id,
        manhuaId: displayManhua.id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        pages: downloadedPages,
        downloadedAt: Date.now()
      });

      setDownloadProgress(prev => ({
        ...prev,
        [chapter.id]: { current: pages.length, total: pages.length, status: 'completed' }
      }));

    } catch (err) {
      console.error(`Failed to download chapter ${chapter.id}:`, err);
      setDownloadProgress(prev => ({
        ...prev,
        [chapter.id]: { current: 0, total: 1, status: 'failed' }
      }));
    }
  };

  const executeRemoveChapter = async (chapterId: string) => {
    try {
      await deleteChapterOffline(chapterId, displayManhua.id);
      setDownloadedChapterIds(prev => {
        const next = new Set(prev);
        next.delete(chapterId);
        return next;
      });
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[chapterId];
        return next;
      });
    } catch (err) {
      console.error('Failed to remove offline chapter:', err);
    }
  };

  const executeDownloadAllChapters = async () => {
    const unlockedChaps = displayManhua.chapters.filter(ch => !ch.isLocked && !downloadedChapterIds.has(ch.id));
    if (unlockedChaps.length === 0) {
      setOfflineAlert('جميع فصول هذه المانهو محملة بالفعل أو مغلقة!');
      return;
    }

    setDownloadingAll(true);
    for (const ch of unlockedChaps) {
      try {
        await handleDownloadChapter(ch);
      } catch (err) {
        console.error(`Failed during batch download of ${ch.id}:`, err);
      }
    }
    setDownloadingAll(false);
  };

  const triggerDownloadAllChapters = () => {
    const unlockedChaps = displayManhua.chapters.filter(ch => !ch.isLocked && !downloadedChapterIds.has(ch.id));
    if (unlockedChaps.length === 0) {
      setOfflineAlert('جميع فصول هذه المانهو محملة بالفعل أو مغلقة!');
      return;
    }
    setConfirmOfflineAction({
      type: 'download_all',
      count: unlockedChaps.length
    });
  };

  const triggerRemoveDownloadedChapter = (e: React.MouseEvent, chapterId: string, chapterTitle: string) => {
    e.stopPropagation();
    setConfirmOfflineAction({
      type: 'remove_chapter',
      chapterId,
      chapterTitle
    });
  };

  useEffect(() => {
    if (!isScraped) {
      setScrapedManhua(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setChapterPage(1);
      setHasMoreChapters(true);
      try {
        const source = resolveSource(manhua);
        
        if (!source) {
          throw new Error('المصدر البرمجي أو الإضافة المسؤولة عن هذا العمل غير متوفرة حالياً.');
        }
        
        const details = await scrapeMangaDetails(source, manhua.sourceUrl || '');
        
        const finalManhua = {
          ...details,
          id: manhua.id,
          coverUrl: manhua.coverUrl || details.coverUrl,
          sourceUrl: manhua.sourceUrl || details.sourceUrl,
          isFeatured: manhua.isFeatured,
          views: manhua.views || 0,
        };
        setScrapedManhua(finalManhua);
        
        if (onUpdateManhua) {
          onUpdateManhua(finalManhua);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'فشل جلب تفاصيل العمل من المصدر الخارجي. قد يكون الموقع المستهدف تحت الحماية أو غير متاح.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [manhua.id, isScraped, sources]);

  const forceRefreshChapters = async () => {
    if (!isScraped || !displayManhua.sourceUrl || loadingMoreChapters) return;
    
    const source = resolveSource(displayManhua);
    if (!source) return;

    setLoadingMoreChapters(true);
    try {
      const freshManhua = await scrapeMangaDetails(source, displayManhua.sourceUrl, true);
      
      if (freshManhua.chapters && freshManhua.chapters.length > 0) {
        const updatedChapters = [...displayManhua.chapters];
        const existingIds = new Set(updatedChapters.map(c => c.id));
        let addedCount = 0;
        
        for (const ch of freshManhua.chapters) {
          if (!existingIds.has(ch.id)) {
            updatedChapters.push(ch);
            existingIds.add(ch.id);
            addedCount++;
          }
        }

        const updatedManhua = {
          ...displayManhua,
          chapters: updatedChapters,
          description: freshManhua.description && freshManhua.description !== 'لا يوجد ملخص متوفر.' ? freshManhua.description : displayManhua.description,
        };
        
        if (scrapedManhua) {
          setScrapedManhua(updatedManhua);
        }
        if (onUpdateManhua) {
          onUpdateManhua(updatedManhua);
        }
      }
    } catch (err) {
      console.error("Failed to force refresh chapters:", err);
    } finally {
      setLoadingMoreChapters(false);
    }
  };

  const loadMoreChapters = async () => {
    if (!isScraped || !displayManhua.sourceUrl || loadingMoreChapters) return;
    
    const source = resolveSource(displayManhua);
    if (!source) return;

    setLoadingMoreChapters(true);
    try {
      const nextPage = chapterPage + 1;
      const newChapters = await scrapeMangaChapters(source, displayManhua.sourceUrl, nextPage);
      
      if (!newChapters || newChapters.length === 0) {
        setHasMoreChapters(false);
      } else {
        setChapterPage(nextPage);
        const updatedChapters = [...displayManhua.chapters];
        
        const existingIds = new Set(updatedChapters.map(c => c.id));
        const existingTitles = new Set(updatedChapters.map(c => c.title.trim().toLowerCase()));
        let addedCount = 0;
        
        for (const ch of newChapters) {
          const titleKey = ch.title.trim().toLowerCase();
          if (!existingIds.has(ch.id) && !existingTitles.has(titleKey)) {
            updatedChapters.push(ch);
            existingIds.add(ch.id);
            existingTitles.add(titleKey);
            addedCount++;
          }
        }

        if (addedCount === 0) {
          setHasMoreChapters(false);
        }

        const updatedManhua = {
          ...displayManhua,
          chapters: updatedChapters
        };
        
        if (scrapedManhua) {
          setScrapedManhua(updatedManhua);
        }
        if (onUpdateManhua) {
          onUpdateManhua(updatedManhua);
        }
      }
    } catch (err) {
      console.error("Failed to load more chapters:", err);
    } finally {
      setLoadingMoreChapters(false);
    }
  };

  // Auto-update local manhua if it has a source URL
  useEffect(() => {
    if (isScraped || !manhua.sourceUrl || !onUpdateManhua) return;

    const autoUpdate = async () => {
      const source = sources.find(s => manhua.sourceUrl?.includes(s.baseUrl) || manhua.sourceUrl?.includes(s.id));
      if (!source) return;

      try {
        const details = await scrapeMangaDetails(source, manhua.sourceUrl);
        if (details.chapters && details.chapters.length > manhua.chapters.length) {
          const updatedManhua = {
            ...manhua,
            chapters: details.chapters,
            description: details.description && details.description !== 'لا يوجد ملخص متوفر.' ? details.description : manhua.description,
          };
          onUpdateManhua(updatedManhua);
        }
      } catch (err) {
        console.error("Auto-update of local manhua failed:", err);
      }
    };

    autoUpdate();
  }, [manhua.id, manhua.sourceUrl, isScraped, sources]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مستمر':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'مكتمل':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'متوقف مؤقتاً':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === 'محدث') return 'محدث الآن';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      return date.toLocaleDateString('ar-EG', options);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4 animate-fade-in" id="details-loader">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
        <h3 className="text-sm font-black text-zinc-300">جاري تحميل فصول</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 animate-fade-in" id="details-error-container">
        <div className="w-16 h-16 bg-red-950/30 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500">
          <RefreshCw className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-200">فشل تحديث البيانات ديناميكياً</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            {error}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            الرجوع للرئيسية
          </button>
          
          {onSearch && (
            <button
              onClick={() => onSearch(manhua.title)}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              البحث في مصادر أخرى 🔍
            </button>
          )}

          <button
            onClick={() => {
              setLoading(true);
              const source = sources.find(s => manhua.id.startsWith(`scr-${s.id}-`) || manhua.sourceUrl?.includes(s.baseUrl));
              if (source) {
                scrapeMangaDetails(source, manhua.sourceUrl || '')
                  .then(details => {
                    const finalManhua = {
                      ...details,
                      id: manhua.id,
                      coverUrl: manhua.coverUrl,
                      sourceUrl: manhua.sourceUrl,
                      isFeatured: manhua.isFeatured,
                      views: manhua.views || 0,
                    };
                    setScrapedManhua(finalManhua);
                    if (onUpdateManhua) {
                      onUpdateManhua(finalManhua);
                    }
                    setError(null);
                  })
                  .catch(err => setError(err.message))
                  .finally(() => setLoading(false));
              } else {
                setLoading(false);
              }
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-red-950/20"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id={`manhua-details-${displayManhua.id}`}>
      
      {/* Back button */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-red-500 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          id="details-back-btn"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>

        {isScraped && (
          <span className="text-[9px] font-bold font-mono text-amber-500 px-3 py-1.5 bg-amber-950/10 border border-amber-900/20 rounded-xl">
          </span>
        )}
      </div>

      {/* Cinematic Banner / Cover block */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950">
        
        {/* Background blur overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={displayManhua.coverUrl || undefined} 
            alt="Blur background" 
            className="w-full h-full object-cover filter blur-xl opacity-20 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        </div>

        {/* Info Grid */}
        <div className="relative z-10 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Cover Art - Column (4 cols on md) */}
          <div className="md:col-span-4 lg:col-span-3 mx-auto md:mx-0 w-full max-w-[280px] aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl shrink-0 bg-zinc-950 transition-transform duration-300 hover:scale-[1.02] hover:border-red-500/50">
            <img 
              src={displayManhua.coverUrl || undefined} 
              alt={displayManhua.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Details Metadata (8 cols on md) */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            
            {/* Status line */}
            <div className="flex flex-wrap gap-2 items-center justify-start">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(displayManhua.status)}`}>
                {displayManhua.status}
              </span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-full pl-2.5 pr-1 py-0.5 text-xs text-zinc-300">
                <AddToListPicker
                  user={user}
                  manhua={displayManhua}
                  readingList={readingList}
                  onAddToList={onAddToList}
                  onRemoveFromList={onRemoveFromList}
                  onNavigate={onNavigate}
                />
                <span className="text-[10px] font-bold">حفظ في قائمة</span>
              </div>
            </div>

            {/* Title & Info Section */}
            <div className="space-y-3 text-right">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight font-display break-words">
                {displayManhua.title}
              </h1>
              {displayManhua.englishTitle && (
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono break-words">
                  {displayManhua.englishTitle}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 items-center">
               <button className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-950/20 transition-all flex items-center gap-2">
                 <Play className="w-4 h-4 fill-white" />
                 <span>بدء {actionName}</span>
               </button>
               <div className="flex items-center gap-2">
                 <AddToListPicker
                    user={user}
                    manhua={displayManhua as any}
                    readingList={readingList}
                    onAddToList={onAddToList}
                    onRemoveFromList={onRemoveFromList}
                    onNavigate={onNavigate}
                    className="w-10 h-10"
                 />
               </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 max-w-2xl text-right">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block">الكاتب</span>
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1 justify-end">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  {displayManhua.author}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block">الرسام</span>
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1 justify-end">
                  <Palette className="w-3.5 h-3.5 text-zinc-500" />
                  {displayManhua.artist}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block">سنة الإصدار</span>
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1 justify-end font-mono">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {displayManhua.releaseYear}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2 text-right">
              <h4 className="text-xs font-bold text-zinc-400">التصنيفات:</h4>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {displayManhua.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-red-600 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Story */}
            <div className="space-y-2 pt-2 text-right">
              <h3 className="text-xs font-extrabold text-red-500 border-r-2 border-red-500 pr-2">قصة {contentTypeName}</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl text-justify">
                {displayManhua.description && displayManhua.description.trim() && displayManhua.description !== 'لا يوجد ملخص متوفر.' && displayManhua.description !== 'لا يوجد وصف متاح.' 
                  ? displayManhua.description 
                  : `تابع قصة وأحداث ${displayManhua.title || contentTypeName} مترجمة بالكامل بأعلى جودة وبشكل حصري.`}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Chapters List Block */}
      <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/80 p-4 sm:p-6 space-y-4">
        
        {/* Chapters count header */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-zinc-800 pb-3 flex-row-reverse">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-display">قائمة ال{chaptersName} المتوفرة</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 font-bold font-mono bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              {displayManhua.chapters.length} {chaptersName} مضافة
            </span>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800"
              title="ترتيب ال${chaptersName}"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={triggerDownloadAllChapters}
              disabled={downloadingAll || displayManhua.chapters.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/15 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 hover:border-red-600 font-extrabold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {downloadingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تحميل الكل...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>تحميل كامل الفصول</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chapters table/list */}
        {displayManhua.chapters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[...displayManhua.chapters]
              .sort((a, b) => {
                 const extractedA = extractNumber(a.name);
                 const extractedB = extractNumber(b.name);
                 const numA = extractedA !== null ? extractedA : (displayManhua.chapters.length - displayManhua.chapters.indexOf(a));
                 const numB = extractedB !== null ? extractedB : (displayManhua.chapters.length - displayManhua.chapters.indexOf(b));
                 return sortOrder === 'asc' ? numA - numB : numB - numA;
              })
              .map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  if (ch.isLocked) {
                    setSelectedLockedChapter(ch);
                    setShowLockedDialog(true);
                  } else {
                    onSelectChapter(ch.id, displayManhua);
                  }
                }}
                className={`flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-950 border rounded-xl cursor-pointer group transition-all duration-200 ${
                  ch.isLocked ? 'border-zinc-800/60 hover:border-amber-500/30' : 'border-zinc-800/60 hover:border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-xs font-mono transition-colors border ${
                    ch.isLocked 
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black' 
                      : 'bg-red-600/10 text-red-500 border-red-500/20 group-hover:bg-red-600 group-hover:text-white'
                  }`}>
                    {ch.isLocked ? <Lock className="w-3.5 h-3.5" /> : ch.chapterNumber}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      ch.isLocked ? 'text-zinc-400 group-hover:text-amber-400' : 'text-zinc-100 group-hover:text-red-400'
                    }`}>
                      {ch.title}
                      {ch.isLocked && (
                        <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.25 rounded font-display font-medium">
                          مغلق مؤقتاً 🔒
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-red-500" />
                      <span>{formatDate(ch.releaseDate)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800/80 hidden sm:block">
                    {ch.isLocked ? 'مقفل 🔒' : `${ch.views.toLocaleString()} ${isAnime ? 'مشاهدة' : 'قراءة'}`}
                  </div>

                  {!ch.isLocked && (() => {
                    const progress = downloadProgress[ch.id];
                    const isDownloaded = downloadedChapterIds.has(ch.id);

                    if (isDownloaded) {
                      return (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-bold flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            محمل
                          </span>
                          <button
                            onClick={(e) => triggerRemoveDownloadedChapter(e, ch.id, ch.title)}
                            className="p-1.5 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded border border-red-900/30 hover:border-red-500 transition-colors cursor-pointer"
                            title="حذف من الجهاز"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    if (progress?.status === 'downloading') {
                      return (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-bold text-red-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{progress.current}/{progress.total}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadChapter(ch);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white rounded border border-zinc-800 hover:border-red-500 transition-all cursor-pointer"
                        title={`تحميل ال${chapterName} على الجهاز`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-500">
            <BookOpen className="w-12 h-12 mx-auto text-zinc-800 mb-2" />
            <p className="text-sm">لا توجد {chaptersName} متوفرة حالياً.</p>
          </div>
        )}

        {/* Simple Down-Arrow Button to Load More Chapters */}
        {isScraped && hasMoreChapters && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreChapters}
              disabled={loadingMoreChapters}
              className="text-zinc-500 hover:text-red-500 transition-colors p-2 cursor-pointer flex flex-col items-center gap-1.5 active:scale-95 disabled:opacity-40"
              title="جلب المزيد من الفصول"
              id="btn-load-more-chapters"
            >
              {loadingMoreChapters ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4 text-red-500 animate-bounce" />
              )}
              <span className="text-[10px] font-bold tracking-wider">المزيد من الفصول</span>
            </button>
          </div>
        )}

      </div>

      {/* Lock Dialog Modal */}
      {showLockedDialog && selectedLockedChapter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" style={{ direction: 'rtl' }}>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-white font-display">الفصل مغلق مؤقتاً 🔒</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                عذراً، هذا الفصل مغلق مؤقتًا حالياً ولا يمكن عرضه.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowLockedDialog(false);
                  setSelectedLockedChapter(null);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-transparent shadow-lg shadow-red-950/20"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Offline Action Modal */}
      {confirmOfflineAction && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ direction: 'rtl' }}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-100 font-display">تأكيد الإجراء</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {confirmOfflineAction.type === 'remove_chapter'
                  ? `هل تريد بالتأكيد إزالة الفصل المحمل "${confirmOfflineAction.chapterTitle}" من جهازك؟`
                  : `هل ترغب في تحميل جميع الفصول المفتوحة المتبقية (${confirmOfflineAction.count} فصلاً)؟`
                }
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={async () => {
                  const action = confirmOfflineAction;
                  setConfirmOfflineAction(null);
                  if (action.type === 'remove_chapter' && action.chapterId) {
                    await executeRemoveChapter(action.chapterId);
                  } else if (action.type === 'download_all') {
                    await executeDownloadAllChapters();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                تأكيد ومتابعة
              </button>
              <button
                onClick={() => setConfirmOfflineAction(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Offline Alert Modal */}
      {offlineAlert && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ direction: 'rtl' }}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-100 font-display">تنبيه</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {offlineAlert}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setOfflineAlert(null)}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-all cursor-pointer"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
