import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, 
  Settings, MessageSquare, RefreshCw, Send, ThumbsUp, Layers, Eye, Loader2, X, Maximize2
} from 'lucide-react';
import { Manhua, Chapter, ReaderSettings, ManhuaComment, ReadingHistoryItem, ScraperSource } from '../types';
import { mockComments } from '../data';
import { scrapeChapterPages } from '../utils/scraper';
import AdBanner from '../components/AdBanner';
import { AppwriteAd } from '../lib/appwrite';

interface ReaderViewProps {
  manhua: Manhua;
  chapter: Chapter;
  readerSettings: ReaderSettings;
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  onBackToManhua: () => void;
  onSelectChapter: (chapterId: string) => void;
  onAddHistory: (item: Omit<ReadingHistoryItem, 'id' | 'lastReadTime'>) => void;
  user: any;
  sources?: ScraperSource[];
  appMode?: 'manga' | 'anime';
  ads?: AppwriteAd[];
}

export default function ReaderView({
  manhua,
  chapter,
  readerSettings,
  updateReaderSettings,
  onBackToManhua,
  onSelectChapter,
  onAddHistory,
  user,
  sources = [],
  appMode = 'manga',
  ads = []
}: ReaderViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [comments, setComments] = useState<ManhuaComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus Mode & UI visibility toggles
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bgColor, setBgColor] = useState<'black' | 'dark' | 'sepia' | 'light'>(() => {
    const saved = localStorage.getItem('manhua_reader_bg_color');
    return (saved as any) || 'black';
  });

  // Dynamic scraped pages state
  const [scrapedPages, setScrapedPages] = useState<(string | Blob)[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [preloadProgress, setPreloadProgress] = useState({ current: 0, total: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Continuous Chapters Mode State
  interface ExtraChapterItem {
    chapter: Chapter;
    pages: (string | Blob)[];
    loading: boolean;
    error: string | null;
  }
  const [extraChapters, setExtraChapters] = useState<ExtraChapterItem[]>([]);
  const [loadingNextChapter, setLoadingNextChapter] = useState(false);
  const [activeChapter, setActiveChapter] = useState<Chapter>(chapter);

  // Sync activeChapter when root chapter prop changes
  useEffect(() => {
    setActiveChapter(chapter);
    setExtraChapters([]);
  }, [chapter.id]);

  const isScrapedChapter = chapter.id.startsWith('ch-');
  const chapterSource = sources?.find(s => chapter.id.startsWith(`ch-${s.id}-`));
  const isAnime = appMode === 'anime' || chapterSource?.type === 'anime';

  // Load scraped pages
  useEffect(() => {
    // If the chapter already has pre-loaded pages (e.g. offline downloaded base64 pages), bypass scraping!
    if (chapter.pages && chapter.pages.length > 1) {
      setScrapedPages(chapter.pages);
      setCurrentPageIndex(0);
      return;
    }

    if (!isScrapedChapter) {
      setScrapedPages([]);
      return;
    }

    const fetchPages = async () => {
      setLoadingPages(true);
      setPagesError(null);
      try {
        const source = sources.find(s => chapter.id.startsWith(`ch-${s.id}-`));
        if (!source) {
          throw new Error('مصدر هذا الفصل غير متوفر حالياً.');
        }

        const pagesUrl = chapter.pages[0]; // stored raw URL
        if (!pagesUrl) {
          throw new Error('رابط الفصل غير متوفر في السجل، الرجاء العودة لصفحة المانهوا واختيار الفصل من هناك.');
        }
        const pages = await scrapeChapterPages(source, pagesUrl as string);
        if (pages.length === 0) {
          throw new Error('فشل جلب الصفحات المصورة. قد تكون الصور محمية خلف جدار ناري أو نظام عرض تفاعلي خاص.');
        }



        setScrapedPages(pages);
        setCurrentPageIndex(0);
      } catch (err: any) {
        console.error(err);
        setPagesError(err.message || 'خطأ أثناء الاتصال بمزود الصور.');
      } finally {
        setLoadingPages(false);
      }
    };

    fetchPages();
  }, [chapter.id, isScrapedChapter, sources]);

  const displayPages = isScrapedChapter ? scrapedPages : (chapter.pages || []);

  const getAnimeServerName = (page: any, idx: number) => {
    if (typeof page !== 'string') return `سيرفر محمل ${idx + 1}`;
    const [, name] = page.split('#');
    return decodeURIComponent(name || `سيرفر ${idx + 1}`);
  };
  // Background sequential preloader for webtoon mode
  useEffect(() => {
    if (readerSettings.readingMode !== 'webtoon' || displayPages.length === 0 || isAnime) return;

    let isCancelled = false;
    
    const preloadSequentially = async () => {
      setPreloadProgress({ current: 0, total: displayPages.length });
      let loaded = 0;
      
      for (let i = 0; i < displayPages.length; i++) {
        if (isCancelled) break;
        
        const url = displayPages[i];
        if (typeof url === 'string') {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          });
        }
        loaded++;
        setPreloadProgress({ current: loaded, total: displayPages.length });
      }
    };
    
    preloadSequentially();
    
    return () => {
      isCancelled = true;
    };
  }, [displayPages, readerSettings.readingMode, isAnime]);


  // Sync scrolling progress in Webtoon continuous scrolling mode
  useEffect(() => {
    if (readerSettings.readingMode !== 'webtoon' || displayPages.length === 0) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on layout stable
    setTimeout(handleScroll, 500);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [readerSettings.readingMode, displayPages, chapter.id]);

  // Image preloader for fast browsing (preloads next 2 pages in page mode)
  useEffect(() => {
    if (displayPages.length === 0) return;

    // Preload next 2 pages in single-page mode
    if (readerSettings.readingMode !== 'webtoon') {
      const nextIndices = [currentPageIndex + 1, currentPageIndex + 2];
      nextIndices.forEach(idx => {
        if (idx < displayPages.length) {
          const page = displayPages[idx];
          const img = new Image();
          img.src = typeof page === 'string' ? page : URL.createObjectURL(page);
        }
      });
    }
  }, [currentPageIndex, displayPages, readerSettings.readingMode]);

  // Resume Reading - Save progress to localStorage
  useEffect(() => {
    if (displayPages.length === 0) return;

    const progressData = {
      chapterId: chapter.id,
      pageIndex: currentPageIndex,
      scrollPercent: scrollProgress,
      updatedAt: Date.now()
    };
    localStorage.setItem(`manhua_progress_${manhua.id}`, JSON.stringify(progressData));
  }, [manhua.id, chapter.id, currentPageIndex, scrollProgress, displayPages.length]);

  // Resume Reading - Restore progress upon loading a chapter
  useEffect(() => {
    const saved = localStorage.getItem(`manhua_progress_${manhua.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.chapterId === chapter.id) {
          // Same chapter, restore index
          if (data.pageIndex !== undefined && data.pageIndex > 0 && data.pageIndex < displayPages.length) {
            setCurrentPageIndex(data.pageIndex);
            setToastMessage(`تم استئناف القراءة من الصفحة ${data.pageIndex + 1}`);
            setTimeout(() => setToastMessage(null), 4000);
          }
          // Restore scroll positions in webtoon mode
          if (readerSettings.readingMode === 'webtoon' && data.scrollPercent > 1) {
            setTimeout(() => {
              const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
              if (totalHeight > 0) {
                window.scrollTo({
                  top: (data.scrollPercent / 100) * totalHeight,
                  behavior: 'smooth'
                });
                setToastMessage(`تم استئناف قراءة الويبون من حيث توقفت (${data.scrollPercent}%)`);
                setTimeout(() => setToastMessage(null), 4000);
              }
            }, 800);
          }
        }
      } catch (err) {
        console.error('Error loading resume progress', err);
      }
    }
  }, [chapter.id, displayPages.length]);

  // Filter comments for this chapter & track history
  useEffect(() => {
    const chapterComments = mockComments.filter(c => c.manhuaId === manhua.id && c.chapterId === chapter.id);
    setComments(chapterComments);
    
    // Auto-record reading history entry
    if (displayPages.length > 0) {
      const currentPercent = readerSettings.readingMode === 'webtoon' 
        ? scrollProgress 
        : Math.round(((currentPageIndex + 1) / displayPages.length) * 100);

      onAddHistory({
        manhuaId: manhua.id,
        manhuaTitle: manhua.title,
        manhuaCover: manhua.coverUrl,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapterNumber,
        progressPercent: currentPercent,
        pageIndex: currentPageIndex,
        sourceUrl: manhua.sourceUrl,
        chapterUrl: typeof chapter.pages?.[0] === 'string' ? chapter.pages[0] : undefined
      });
    }
  }, [manhua, chapter, currentPageIndex, scrollProgress, displayPages.length, readerSettings.readingMode]);

  // Zoom Handling
  const handleZoomIn = () => {
    updateReaderSettings({ zoomLevel: Math.min(150, readerSettings.zoomLevel + 10) });
  };

  const handleZoomOut = () => {
    updateReaderSettings({ zoomLevel: Math.max(50, readerSettings.zoomLevel - 10) });
  };

  // Chapter Sorting for Prev / Next Chapter Buttons
  const sortedChapters = [...manhua.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const currentChIndex = sortedChapters.findIndex(c => c.id === activeChapter.id);
  
  const prevChapter = currentChIndex > 0 ? sortedChapters[currentChIndex - 1] : null;
  const nextChapter = currentChIndex < sortedChapters.length - 1 ? sortedChapters[currentChIndex + 1] : null;

  // Track active chapter in view on scroll in continuous mode
  useEffect(() => {
    if (!readerSettings.continuousMode || isAnime) {
      if (activeChapter.id !== chapter.id) {
        setActiveChapter(chapter);
      }
      return;
    }

    const handleScrollActiveChapter = () => {
      const chapterEls = document.querySelectorAll<HTMLElement>('[data-chapter-id]');
      if (chapterEls.length === 0) return;

      let currentInViewId: string | null = null;
      const viewportThreshold = window.innerHeight * 0.4;

      chapterEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportThreshold && rect.bottom > 80) {
          currentInViewId = el.getAttribute('data-chapter-id');
        }
      });

      if (currentInViewId && currentInViewId !== activeChapter.id) {
        const foundCh = sortedChapters.find(c => c.id === currentInViewId);
        if (foundCh) {
          setActiveChapter(foundCh);
          onAddHistory({
            manhuaId: manhua.id,
            manhuaTitle: manhua.title,
            manhuaCover: manhua.coverUrl,
            chapterId: foundCh.id,
            chapterTitle: foundCh.title,
            chapterNumber: foundCh.chapterNumber,
            progressPercent: 0,
            pageIndex: 0,
            sourceUrl: manhua.sourceUrl,
            chapterUrl: typeof foundCh.pages?.[0] === 'string' ? foundCh.pages[0] : undefined
          });
        }
      }
    };

    window.addEventListener('scroll', handleScrollActiveChapter, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollActiveChapter);
  }, [readerSettings.continuousMode, activeChapter.id, sortedChapters, isAnime, chapter, manhua, onAddHistory]);

  // Continuous Chapters Loader Function
  const loadNextContinuousChapter = async () => {
    if (loadingNextChapter) return;

    const lastCh = extraChapters.length > 0 
      ? extraChapters[extraChapters.length - 1].chapter 
      : activeChapter;

    const lastIndex = sortedChapters.findIndex(c => c.id === lastCh.id);
    if (lastIndex < 0 || lastIndex >= sortedChapters.length - 1) return;

    const nextCh = sortedChapters[lastIndex + 1];
    if (extraChapters.some(item => item.chapter.id === nextCh.id)) return;

    setLoadingNextChapter(true);
    setExtraChapters(prev => [...prev, { chapter: nextCh, pages: [], loading: true, error: null }]);

    try {
      let pagesToSet: (string | Blob)[] = [];
      if (nextCh.pages && nextCh.pages.length > 1) {
        pagesToSet = nextCh.pages;
      } else if (nextCh.id.startsWith('ch-')) {
        const source = sources.find(s => nextCh.id.startsWith(`ch-${s.id}-`));
        if (!source) throw new Error('مصدر هذا الفصل غير متوفر');
        const pageUrl = nextCh.pages[0];
        if (!pageUrl) throw new Error('رابط الفصل غير متوفر');
        pagesToSet = await scrapeChapterPages(source, pageUrl as string);
      } else {
        pagesToSet = nextCh.pages || [];
      }

      // Smooth 1s delay so transition banner is clearly visible to user before images pop in
      await new Promise(res => setTimeout(res, 1000));

      setExtraChapters(prev => prev.map(item => 
        item.chapter.id === nextCh.id 
          ? { ...item, pages: pagesToSet, loading: false, error: null }
          : item
      ));

      // Record reading history for continuous auto-loaded chapter
      onAddHistory({
        manhuaId: manhua.id,
        manhuaTitle: manhua.title,
        manhuaCover: manhua.coverUrl,
        chapterId: nextCh.id,
        chapterTitle: nextCh.title,
        chapterNumber: nextCh.chapterNumber,
        progressPercent: 0,
        pageIndex: 0,
        sourceUrl: manhua.sourceUrl,
        chapterUrl: typeof nextCh.pages?.[0] === 'string' ? nextCh.pages[0] : undefined
      });
    } catch (err: any) {
      console.error('Error loading continuous next chapter:', err);
      setExtraChapters(prev => prev.map(item => 
        item.chapter.id === nextCh.id 
          ? { ...item, loading: false, error: err.message || 'فشل جلب صور الفصل' }
          : item
      ));
    } finally {
      setLoadingNextChapter(false);
    }
  };

  // Scroll listener to auto-trigger loading next chapter in continuous mode
  useEffect(() => {
    if (!readerSettings.continuousMode || isAnime) return;

    const handleContinuousScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;

      if (documentHeight - scrollBottom < 700 && !loadingNextChapter) {
        loadNextContinuousChapter();
      }
    };

    window.addEventListener('scroll', handleContinuousScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleContinuousScroll);
  }, [readerSettings.continuousMode, extraChapters, activeChapter.id, loadingNextChapter, sortedChapters, isAnime]);

  const lastLoadedChapter = extraChapters.length > 0
    ? extraChapters[extraChapters.length - 1].chapter
    : chapter;
  const lastLoadedIndex = sortedChapters.findIndex(c => c.id === lastLoadedChapter.id);
  const nextChapterAvailable = lastLoadedIndex >= 0 && lastLoadedIndex < sortedChapters.length - 1;

  // Handle Comment Submissions
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: ManhuaComment = {
      id: 'comment-' + Date.now(),
      manhuaId: manhua.id,
      chapterId: chapter.id,
      userEmail: user ? user.email : 'guest@reader.com',
      userName: user ? user.displayName : 'قارئ زائر',
      userAvatar: user ? user.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      content: commentInput.trim(),
      timestamp: 'الآن',
      likes: 0
    };

    setComments([newComment, ...comments]);
    setCommentInput('');
  };

  const handleLikeComment = (id: string) => {
    setComments(comments.map(c => {
      if (c.id === id) {
        return {
          ...c,
          likes: c.hasLiked ? c.likes - 1 : c.likes + 1,
          hasLiked: !c.hasLiked
        };
      }
      return c;
    }));
  };

  // Change page indices
  const handleNextPage = () => {
    if (currentPageIndex < displayPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (nextChapter) {
      onSelectChapter(nextChapter.id);
      setCurrentPageIndex(0);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (prevChapter) {
      onSelectChapter(prevChapter.id);
    }
  };

  // Background style toggling syncing
  const handleBgColorChange = (color: 'black' | 'dark' | 'sepia' | 'light') => {
    setBgColor(color);
    localStorage.setItem('manhua_reader_bg_color', color);
    
    const isNight = color === 'black' || color === 'dark';
    updateReaderSettings({ isNightMode: isNight });
    
    // Apply layout-wide body toggles
    if (isNight) {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = color === 'black' ? '#000000' : '#18181b';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = color === 'sepia' ? '#faf6eb' : '#ffffff';
    }
  };

  // Safe Click to Toggle Focus Mode (Show/Hide UI controls)
  const handleStageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('select') || 
      target.closest('input') || 
      target.closest('#reader-comments-section') || 
      target.closest('.settings-panel')
    ) {
      return;
    }
    setShowUI(prev => !prev);
  };

  // Dynamic progress percentage calculation
  const currentProgress = readerSettings.readingMode === 'webtoon' 
    ? scrollProgress 
    : (displayPages.length > 0 ? Math.round(((currentPageIndex + 1) / displayPages.length) * 100) : 0);

  // Helper to generate the Unicode loading bar (e.g. ██████░░░░ 60%)
  const getUnicodeProgressBar = (percent: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.round(percent / 10);
    const emptyBlocks = Math.max(0, totalBlocks - filledBlocks);
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  };

  // Color mappings
  const themeClasses = {
    black: 'bg-black text-zinc-100',
    dark: 'bg-zinc-950 text-zinc-100 border-zinc-900',
    sepia: 'bg-[#faf6eb] text-[#4a3525] border-[#eae0cc]',
    light: 'bg-zinc-50 text-zinc-900 border-zinc-200'
  }[bgColor];

  const panelThemeClasses = {
    black: 'bg-zinc-950/95 border-zinc-800 text-zinc-100',
    dark: 'bg-zinc-900/95 border-zinc-800 text-zinc-200',
    sepia: 'bg-[#faf6eb]/95 border-[#eae0cc] text-[#4a3525]',
    light: 'bg-white/95 border-zinc-200 text-zinc-900'
  }[bgColor];

  const pageContainerTheme = {
    black: 'bg-black',
    dark: 'bg-zinc-950',
    sepia: 'bg-[#faf6eb]',
    light: 'bg-zinc-50'
  }[bgColor];

  return (
    <div 
      onClick={handleStageClick}
      className={`min-h-screen pb-20 transition-colors duration-300 ${pageContainerTheme}`}
      style={{ direction: 'rtl' }}
      id="reader-view-container"
    >
      {/* 1. TOP EDGE SLIM PROGRESS LINE */}
      <div 
        className="fixed top-0 right-0 h-[4px] bg-gradient-to-l from-red-500 via-amber-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] transition-all duration-300 z-50 rounded-l-full pointer-events-none" 
        style={{ width: `${currentProgress}%` }}
      />

      {/* 2. TRANSLUCENT TOP NAVIGATION / INFO BAR (Focus toggled) */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform ${
          showUI ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        } ${panelThemeClasses} border-b shadow-md backdrop-blur-md px-3 sm:px-4 pb-2 sm:pb-2.5`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Back Button & Title */}
          <div className="flex items-center gap-2 min-w-0 shrink-0 relative z-50">
            <button
              onClick={onBackToManhua}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer shrink-0 z-30 font-bold text-xs ${
                bgColor === 'sepia' 
                  ? 'bg-[#f0e6d2] hover:bg-[#eae0cc] border-[#eae0cc] text-[#4a3525]' 
                  : bgColor === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100'
              }`}
              title="العودة للتفاصيل"
              id="reader-back-btn"
            >
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">خروج</span>
            </button>
            <div className="min-w-0 max-w-[90px] xs:max-w-[140px] sm:max-w-[220px]">
              <h2 className="text-xs font-black opacity-90 truncate">
                {manhua.title}
              </h2>
              <h3 className="text-[11px] font-bold text-red-500 truncate">
                {activeChapter.title || `الفصل ${activeChapter.chapterNumber}`}
              </h3>
            </div>
          </div>

          {/* Quick Controls in Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            {/* Chapter Selection Selector */}
            <select
              value={activeChapter.id}
              onChange={(e) => {
                const selectedId = e.target.value;
                onSelectChapter(selectedId);
                setCurrentPageIndex(0);
                setExtraChapters([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-bold py-1.5 px-2 rounded-lg border focus:outline-none focus:border-red-500 cursor-pointer max-w-[110px] xs:max-w-[160px] sm:max-w-[280px] truncate ${
                bgColor === 'sepia' 
                  ? 'bg-[#f0e6d2] border-[#eae0cc] text-[#4a3525]' 
                  : bgColor === 'light'
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-800'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100'
              }`}
              id="reader-chapter-dropdown"
            >
              {sortedChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  الفصل {ch.chapterNumber} : {ch.title.split(':')[1] || ch.title}
                </option>
              ))}
            </select>

            {/* Settings Quick Trigger */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                showSettings 
                  ? 'bg-red-600 text-white border-red-600'
                  : bgColor === 'sepia'
                  ? 'bg-[#f0e6d2] hover:bg-[#eae0cc] border-[#eae0cc] text-[#4a3525]'
                  : bgColor === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
              title="إعدادات القراءة"
            >
              <Settings className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. RESUME NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Eye className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. MAIN COMIC PANELS CANVAS (Edge-to-Edge Fluid Design) */}
      <div 
        ref={containerRef}
        className={`w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] transition-all duration-300 ${
          readerSettings.readingMode === 'webtoon' ? 'pt-0 pb-6' : 'pt-14 pb-10 px-0 md:px-4'
        }`}
        style={{ 
          // Applies the dynamic zoom settings on desktop views
          maxWidth: window.innerWidth > 768 ? `${readerSettings.zoomLevel}%` : '100%' 
        }}
        id="comic-stage"
      >
        {loadingPages && (
          <div className="py-24 text-center space-y-4 max-w-sm mx-auto px-4" id="reader-pages-loading">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-zinc-300">جاري تحميل صور صفحات الفصل مباشرة...</h4>
            <p className="text-xs text-zinc-500">
              نقوم الآن بجلب الروابط وفك حظر السيرفرات لتجربة تصفح سريعة وخالية من الإعلانات.
            </p>
          </div>
        )}

        {pagesError && (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4" id="reader-pages-error">
            <div className="w-12 h-12 bg-red-950/20 text-red-500 border border-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">فشل تحميل صور الفصل</h4>
            <p className="text-xs text-zinc-400">
              {pagesError}
            </p>
            <button
              onClick={() => {
                setLoadingPages(true);
                setPagesError(null);
                const source = sources.find(s => chapter.id.startsWith(`ch-${s.id}-`));
                if (source) {
                  scrapeChapterPages(source, chapter.pages[0] as string)
                    .then(pages => {
                      setScrapedPages(pages);
                      setCurrentPageIndex(0);
                    })
                    .catch(err => setPagesError(err.message))
                    .finally(() => setLoadingPages(false));
                } else {
                  setLoadingPages(false);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              إعادة محاولة جلب الصور
            </button>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        {!loadingPages && !pagesError && (
          <>
            {preloadProgress.current < preloadProgress.total && !isAnime && (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 backdrop-blur-sm text-xs text-zinc-400 px-4 py-2 rounded-full flex items-center gap-3 z-40 shadow-xl">
                <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                <span>جاري التحميل المسبق ({preloadProgress.current}/{preloadProgress.total})</span>
                <div className="w-20 bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(preloadProgress.current / preloadProgress.total) * 100}%` }}></div>
                </div>
              </div>
            )}
            {/* WEBTOON MODE */}
            {readerSettings.readingMode === 'webtoon' && (
              <div className="w-full space-y-0">
                <div data-chapter-id={chapter.id} className="w-full space-y-0">
                  {displayPages.map((pageUrl, idx) => (
                    <div key={`main-p-${idx}`} className="relative w-full overflow-hidden bg-black flex justify-center">
                      <img
                        src={typeof pageUrl === 'string' ? pageUrl : URL.createObjectURL(pageUrl as Blob)}
                        alt={`صفحة ${idx + 1}`}
                        className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-auto object-contain block mx-auto"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>

                {/* CONTINUOUS EXTRA CHAPTERS */}
                {extraChapters.map((extItem) => (
                  <div key={`ext-ch-${extItem.chapter.id}`} data-chapter-id={extItem.chapter.id} className="w-full">
                    {/* Chapter Header Banner */}
                    <div className="py-8 px-4 my-10 bg-gradient-to-r from-red-950/90 via-zinc-900 to-red-950/90 border-y-2 border-red-500/50 text-center rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2 max-w-4xl mx-auto my-12" id={`continuous-chapter-${extItem.chapter.id}`}>
                      <span className="text-[11px] font-black text-red-400 uppercase tracking-widest px-3.5 py-1 bg-red-950/80 rounded-full border border-red-500/40 shadow-inner">
                        بداية الفصل التالي (قراءة مسترسلة)
                      </span>
                      <h3 className="text-lg sm:text-2xl font-black text-white font-display">
                        {extItem.chapter.title || `الفصل ${extItem.chapter.chapterNumber}`}
                      </h3>
                    </div>

                    {extItem.loading && (
                      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-zinc-300">جاري تحميل صور الفصل {extItem.chapter.chapterNumber}...</p>
                      </div>
                    )}

                    {extItem.error && (
                      <div className="py-12 text-center space-y-3 max-w-md mx-auto px-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
                        <p className="text-xs text-red-400 font-bold">{extItem.error}</p>
                        <button
                          onClick={loadNextContinuousChapter}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          إعادة تجربة تحميل الفصل
                        </button>
                      </div>
                    )}

                    {!extItem.loading && !extItem.error && extItem.pages && (
                      <div className="w-full space-y-0">
                        {extItem.pages.map((pUrl, pIdx) => (
                          <div key={`ext-${extItem.chapter.id}-p-${pIdx}`} className="relative w-full overflow-hidden bg-black flex justify-center">
                            <img
                              src={typeof pUrl === 'string' ? pUrl : URL.createObjectURL(pUrl as Blob)}
                              alt={`صفحة ${pIdx + 1}`}
                              className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-auto object-contain block mx-auto"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* LOAD NEXT CONTINUOUS CHAPTER BUTTON IF CONTINUOUS MODE IS ACTIVE */}
                {readerSettings.continuousMode && (
                  <div className="py-10 text-center">
                    {nextChapterAvailable ? (
                      <button
                        onClick={loadNextContinuousChapter}
                        disabled={loadingNextChapter}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                        id="load-next-continuous-ch-btn"
                      >
                        {loadingNextChapter ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري تحميل الفصل التالي...</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-4 h-4" />
                            <span>تحميل الفصل التالي مباشرة (قراءة مسترسلة)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-xs text-zinc-500 font-bold border border-dashed border-zinc-800 py-3 px-6 rounded-xl inline-block">
                        وصلت إلى آخر فصل متوفر في المانهوا
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VERTICAL MODE */}
            {readerSettings.readingMode === 'vertical' && displayPages.length > 0 && (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-3xl mx-auto overflow-hidden bg-black/10 flex justify-center">
                  <img
                    src={displayPages[currentPageIndex] || undefined}
                    alt={`الصفحة ${currentPageIndex + 1}`}
                    className="w-full h-auto object-contain mx-auto max-h-[90vh]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/85 rounded-lg text-xs font-bold text-red-500 border border-zinc-800 shadow-md">
                    صفحة {currentPageIndex + 1} / {displayPages.length}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full max-w-md px-4 pt-3">
                  <button
                    onClick={handlePrevPage}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white active:scale-95 cursor-pointer bg-red-600 hover:bg-red-700 shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الصفحة السابقة</span>
                  </button>
                  <button
                    onClick={handleNextPage}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white active:scale-95 cursor-pointer bg-red-600 hover:bg-red-700 shadow-md"
                  >
                    <span>الصفحة التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* HORIZONTAL MODE */}
            {readerSettings.readingMode === 'horizontal' && displayPages.length > 0 && (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-3xl mx-auto overflow-hidden bg-black/10 flex justify-center">
                  <img
                    src={displayPages[currentPageIndex] || undefined}
                    alt={`الصفحة ${currentPageIndex + 1}`}
                    className="w-full h-auto object-contain mx-auto max-h-[90vh]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/85 rounded-lg text-xs font-bold text-red-500 border border-zinc-800 shadow-md">
                    صفحة {currentPageIndex + 1} / {displayPages.length}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full max-w-md px-4 pt-3">
                  <button
                    onClick={handleNextPage}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white active:scale-95 cursor-pointer bg-red-600 hover:bg-red-700 shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الصفحة التالية</span>
                  </button>
                  <button
                    onClick={handlePrevPage}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white active:scale-95 cursor-pointer bg-red-600 hover:bg-red-700 shadow-md"
                  >
                    <span>الصفحة السابقة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. GORGEOUS STUNNING PROGRESS CARD */}
      {showUI && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[92%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-zinc-950/90 text-zinc-100 border border-red-500/10 px-5 py-4 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border-t-red-500/20 flex flex-col gap-3 backdrop-blur-md relative overflow-hidden">
            {/* Ambient subtle glow decorator */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header Info Row */}
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850">الفصل {activeChapter.chapterNumber}</span>
              <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850">
                <span className="text-zinc-400 font-medium text-[11px]">موضع القراءة:</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 font-black">
                  {readerSettings.readingMode === 'webtoon' ? `${currentProgress}%` : `الصفحة ${currentPageIndex + 1} من ${displayPages.length}`}
                </span>
              </div>
            </div>
            
            {/* Real Graphic Progress Bar */}
            <div className="flex items-center gap-3">
              {readerSettings.readingMode !== 'webtoon' && (
                <button 
                  onClick={handlePrevPage}
                  className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition-all active:scale-90 cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-300" />
                </button>
              )}
              
              <div className="flex-grow relative h-2 bg-zinc-900 rounded-full border border-zinc-850/30 overflow-hidden">
                <div 
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 via-orange-500 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>

              {readerSettings.readingMode !== 'webtoon' && (
                <button 
                  onClick={handleNextPage}
                  className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition-all active:scale-90 cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. FLOATING GEAR FAB (Open Settings Panel) */}
      {showUI && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-3.5 right-4 z-40 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
          title="افتح إعدادات القراءة"
        >
          <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        </button>
      )}

      {/* 7. GLASSMORPHISM FLOATING SETTINGS DRAWER / MODAL (Focus toggled overlay) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
          
          <div className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border transition-all transform animate-in slide-in-from-bottom duration-300 settings-panel ${panelThemeClasses}`}>
            {/* Drawer line for mobile */}
            <div className="w-12 h-1 bg-zinc-400/20 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-black font-display">تخصيص لوحة القراءة</h4>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors text-zinc-400 hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Progress Bar Section */}
              <div className="space-y-2 bg-black/20 p-3.5 rounded-xl border border-zinc-800/10">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="opacity-70">تقدم القراءة في الفصل</span>
                  <span className="text-red-500 font-mono">{currentProgress}%</span>
                </div>
                <div className="w-full bg-zinc-800/40 rounded-full h-2 overflow-hidden border border-zinc-700/10">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                  <span>الفصل {chapter.chapterNumber}</span>
                  {readerSettings.readingMode === 'webtoon' ? (
                    <span>مستمر (ويب تون)</span>
                  ) : (
                    <span>الصفحة {currentPageIndex + 1} من {displayPages.length}</span>
                  )}
                </div>
              </div>

              {/* Reading style selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold opacity-70">طريقة عرض الصفحات</label>
                <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl border border-zinc-800/10">
                  <button
                    onClick={() => updateReaderSettings({ readingMode: 'webtoon' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      readerSettings.readingMode === 'webtoon' ? 'bg-red-600 text-white shadow' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    ويبتون
                  </button>
                  <button
                    onClick={() => updateReaderSettings({ readingMode: 'vertical' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      readerSettings.readingMode === 'vertical' ? 'bg-red-600 text-white shadow' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    عمودي
                  </button>
                  <button
                    onClick={() => updateReaderSettings({ readingMode: 'horizontal' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      readerSettings.readingMode === 'horizontal' ? 'bg-red-600 text-white shadow' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    أفقي (مانجا)
                  </button>
                </div>
              </div>

              {/* Zoom Scale size */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold opacity-70">حجم عرض الصورة (للشاشات الكبيرة)</label>
                <div className="flex items-center justify-between bg-black/20 px-3 py-1.5 rounded-xl border border-zinc-800/10">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 rounded bg-black/20 hover:bg-black/40 transition-colors"
                    title="تصغير"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold font-mono text-red-500">{readerSettings.zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 rounded bg-black/20 hover:bg-black/40 transition-colors"
                    title="تكبير"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Continuous Mode Toggle */}
              <div className="flex items-center justify-between bg-black/20 p-3.5 rounded-xl border border-zinc-800/10">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-500" />
                    فصول مسترسلة (متتالية)
                  </span>
                  <span className="text-[10px] opacity-60">تصفح الفصول متتالية تلقائياً بدون ضغط التالي</span>
                </div>
                <button
                  onClick={() => {
                    const nextMode = !readerSettings.continuousMode;
                    updateReaderSettings({ continuousMode: nextMode });
                    if (!nextMode) {
                      if (activeChapter.id !== chapter.id) {
                        onSelectChapter(activeChapter.id);
                        setCurrentPageIndex(0);
                      }
                      setExtraChapters([]);
                    }
                  }}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                    readerSettings.continuousMode ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                  id="reader-modal-continuous-toggle"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      readerSettings.continuousMode ? 'transform -translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Background Color themes */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold opacity-70">لون خلفية القارئ</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleBgColorChange('black')}
                    className={`p-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      bgColor === 'black' ? 'bg-black border-red-500 text-white ring-1 ring-red-500' : 'bg-black text-zinc-400 border-zinc-900 hover:text-white'
                    }`}
                  >
                    أسود
                  </button>
                  <button
                    onClick={() => handleBgColorChange('dark')}
                    className={`p-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      bgColor === 'dark' ? 'bg-zinc-900 border-red-500 text-white ring-1 ring-red-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    رمادي
                  </button>
                  <button
                    onClick={() => handleBgColorChange('sepia')}
                    className={`p-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      bgColor === 'sepia' ? 'bg-[#faf6eb] text-[#5c4328] border-red-500 ring-1 ring-red-500' : 'bg-[#faf6eb] text-[#5c4328] border-[#eae0cc] hover:opacity-90'
                    }`}
                  >
                    سيبيا
                  </button>
                  <button
                    onClick={() => handleBgColorChange('light')}
                    className={`p-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      bgColor === 'light' ? 'bg-white text-zinc-900 border-red-500 ring-1 ring-red-500' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    أبيض
                  </button>
                </div>
              </div>

              {/* Reset to Defaults */}
              <button
                onClick={() => {
                  updateReaderSettings({
                    readingMode: 'webtoon',
                    zoomLevel: 100,
                  });
                  handleBgColorChange('black');
                }}
                className="w-full py-2 bg-black/10 hover:bg-black/25 text-[10px] font-bold text-center rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer border border-zinc-800/10"
              >
                استعادة الإعدادات الافتراضية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reader Bottom Cloud Ads */}
      <div className="max-w-xl mx-auto px-4">
        <AdBanner ads={ads} position="reader_bottom" />
      </div>

      {/* 8. CHAPTER PAGINATION BUTTONS (Prev Chapter / Next Chapter) - Focus toggled */}
      {showUI && (
        <div className="max-w-xl mx-auto px-4 py-8 flex items-center justify-between gap-4">
          {prevChapter ? (
            <button
              onClick={() => {
                onSelectChapter(prevChapter.id);
                setCurrentPageIndex(0);
                setExtraChapters([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 py-3 px-4 border text-center flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                bgColor === 'sepia'
                  ? 'bg-[#f0e6d2] hover:bg-[#eae0cc] border-[#eae0cc] text-[#4a3525]'
                  : bgColor === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              id="reader-prev-chapter-btn"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الفصل السابق ({prevChapter.chapterNumber})</span>
            </button>
          ) : (
            <div className="flex-1 text-zinc-500 text-xs text-center border border-dashed border-zinc-800/20 py-3 rounded-xl opacity-65">
              أنت في الفصل الأول
            </div>
          )}

          {nextChapter ? (
            <button
              onClick={() => {
                onSelectChapter(nextChapter.id);
                setCurrentPageIndex(0);
                setExtraChapters([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 text-white active:scale-95 bg-red-600 hover:bg-red-700 shadow-md cursor-pointer"
              id="reader-next-chapter-btn"
            >
              <span>الفصل التالي ({nextChapter.chapterNumber})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-1 text-zinc-500 text-xs text-center border border-dashed border-zinc-800/20 py-3 rounded-xl opacity-65">
              نهاية الفصول المتوفرة
            </div>
          )}
        </div>
      )}

    </div>
  );
}
