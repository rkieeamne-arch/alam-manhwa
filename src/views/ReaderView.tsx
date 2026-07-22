import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, 
  Settings, MessageSquare, RefreshCw, Send, ThumbsUp, Layers, Eye, Loader2, X, Maximize2
} from 'lucide-react';
import { Manhua, Chapter, ReaderSettings, ManhuaComment, ReadingHistoryItem, ScraperSource } from '../types';
import { mockComments } from '../data';
import { scrapeChapterPages } from '../utils/scraper';

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
  appMode = 'manga'
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    } else {
      // Preload first 5 images in Webtoon mode
      displayPages.slice(0, 5).forEach(page => {
        const img = new Image();
        img.src = typeof page === 'string' ? page : URL.createObjectURL(page);
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
  const currentChIndex = sortedChapters.findIndex(c => c.id === chapter.id);
  
  const prevChapter = currentChIndex > 0 ? sortedChapters[currentChIndex - 1] : null;
  const nextChapter = currentChIndex < sortedChapters.length - 1 ? sortedChapters[currentChIndex + 1] : null;

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
                {chapter.title}
              </h3>
            </div>
          </div>

          {/* Quick Controls in Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            {/* Chapter Selection Selector */}
            <select
              value={chapter.id}
              onChange={(e) => {
                onSelectChapter(e.target.value);
                setCurrentPageIndex(0);
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
            <h4 className="text-sm font-bold text-zinc-300">جاري كشط صور صفحات الفصل مباشرة...</h4>
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
            {/* WEBTOON MODE */}
            {readerSettings.readingMode === 'webtoon' && (
              <div className="w-full space-y-0">
                {displayPages.map((pageUrl, idx) => (
                  <div key={idx} className="relative w-full overflow-hidden bg-black flex justify-center">
                    <img
                      src={pageUrl || undefined}
                      alt={`صفحة ${idx + 1}`}
                      className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-auto object-contain block mx-auto"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
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
              <span className="text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850">الفصل {chapter.chapterNumber}</span>
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

      {/* 8. CHAPTER PAGINATION BUTTONS (Prev Chapter / Next Chapter) - Focus toggled */}
      {showUI && (
        <div className="max-w-xl mx-auto px-4 py-8 flex items-center justify-between gap-4">
          {prevChapter ? (
            <button
              onClick={() => {
                onSelectChapter(prevChapter.id);
                setCurrentPageIndex(0);
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

      {/* 9. DISCUSSION SECTION (Always visible at page end, togglable shortcut in settings drawer) */}
      <div className="max-w-3xl mx-auto px-4 mt-12 border-t border-zinc-800/10" id="reader-comments-section">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5 border-r-4 border-red-500 pr-3">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-black font-display">التعليقات والمناقشات</h3>
            <span className="text-xs opacity-60">({comments.length} تعليق للفصل)</span>
          </div>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className={`text-xs font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
              showComments 
                ? 'bg-red-600/10 text-red-500 border-red-500/20' 
                : 'bg-black/10 border-zinc-800/10 opacity-70 hover:opacity-100'
            }`}
          >
            {showComments ? 'إخفاء التعليقات' : 'إظهار التعليقات'}
          </button>
        </div>

        {showComments && (
          <div className="space-y-6">
            {/* Post comment input form */}
            <form onSubmit={handlePostComment} className="flex gap-3 bg-black/10 p-4 rounded-xl border border-zinc-800/10">
              <img 
                src={(user && user.avatarUrl) ? user.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-red-500 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder={user ? "اكتب تعليقك هنا..." : "سجل الدخول أولاً لتتمكن من التعليق..."}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={!user}
                  className={`flex-1 text-xs border rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    bgColor === 'light' || bgColor === 'sepia' 
                      ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400' 
                      : 'bg-zinc-950 border-zinc-800/60 text-zinc-100 placeholder-zinc-500'
                  }`}
                  id="comment-text-input"
                />
                <button
                  type="submit"
                  disabled={!user || !commentInput.trim()}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  id="post-comment-btn"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </form>

            {/* Comments threads list */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div 
                    key={c.id} 
                    className={`flex gap-3 p-4 rounded-xl border transition-colors ${
                      bgColor === 'light' || bgColor === 'sepia'
                        ? 'bg-white/50 border-zinc-200 text-zinc-900'
                        : 'bg-zinc-900/10 hover:bg-zinc-900/30 border-zinc-800/40 text-zinc-100'
                    }`}
                  >
                    <img 
                      src={c.userAvatar || undefined} 
                      alt={c.userName} 
                      className="w-9 h-9 rounded-full border border-zinc-800 object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black">
                          {c.userName}
                          {c.userEmail === 'rkieeamne@gmail.com' && (
                            <span className="mr-1.5 text-[9px] bg-red-600/10 text-red-500 border border-red-500/20 px-1.5 py-0.25 rounded">
                              مدير الموقع
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] opacity-50">{c.timestamp}</span>
                      </div>
                      
                      <p className="text-xs opacity-90 mt-2 leading-relaxed">
                        {c.content}
                      </p>

                      <div className="flex items-center gap-1.5 mt-3">
                        <button 
                          onClick={() => handleLikeComment(c.id)}
                          className={`text-[10px] flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            c.hasLiked 
                              ? 'bg-red-600/10 text-red-500 border-red-500/20' 
                              : 'bg-black/15 text-zinc-400 border-zinc-800/10 hover:text-red-500'
                          }`}
                          id={`like-comment-${c.id}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{c.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-400">
                <MessageSquare className="w-7 h-7 mx-auto opacity-30 mb-2" />
                <p className="text-xs">لا توجد تعليقات بعد في هذا الفصل. كن أول من يكتب!</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
