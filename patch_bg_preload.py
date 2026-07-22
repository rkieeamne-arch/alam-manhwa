import re

with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Revert fetchPages
old_fetch = """        // Preload images before displaying
        if (!isAnime && pages.length > 0) {
          setPreloadProgress({ current: 0, total: pages.length });
          const preloadImage = (url: string) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Ignore errors, continue
              img.src = url;
            });
          };

          let loaded = 0;
          const chunkSize = 5;
          for (let i = 0; i < pages.length; i += chunkSize) {
            const chunk = pages.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (p) => {
              if (typeof p === 'string') await preloadImage(p);
              loaded++;
              setPreloadProgress({ current: loaded, total: pages.length });
            }));
          }
        }"""

content = content.replace(old_fetch, "")

# Add background preloader useEffect
bg_preload = """
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
"""

# Find place to inject bg_preload
# After "const getAnimeServerName"

injection_target = """  const getAnimeServerName = (page: any, idx: number) => {
    if (typeof page !== 'string') return `سيرفر محمل ${idx + 1}`;
    const [, name] = page.split('#');
    return decodeURIComponent(name || `سيرفر ${idx + 1}`);
  };"""

content = content.replace(injection_target, injection_target + bg_preload)

# Revert loading state
old_loading = """        {loadingPages && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4" id="reader-loading-pages">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <h4 className="text-sm font-bold text-zinc-300">
              {preloadProgress.total > 0 
                ? `جاري تحميل الصفحات مسبقاً (${preloadProgress.current}/${preloadProgress.total})...`
                : 'جاري تحميل صور صفحات الفصل مباشرة...'}
            </h4>
            <p className="text-xs text-zinc-500">
              {preloadProgress.total > 0 
                ? 'نقوم بتحميل جميع الصور لضمان قراءة سلسة وبدون تقطيع.'
                : 'نقوم الآن بجلب الروابط وفك حظر السيرفرات لتجربة تصفح سريعة وخالية من الإعلانات.'}
            </p>
            {preloadProgress.total > 0 && (
              <div className="w-64 max-w-full bg-zinc-900 rounded-full h-1.5 mt-4 overflow-hidden">
                <div 
                  className="bg-red-500 h-1.5 transition-all duration-300" 
                  style={{ width: `${(preloadProgress.current / preloadProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}"""

new_loading = """        {loadingPages && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4" id="reader-loading-pages">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <h4 className="text-sm font-bold text-zinc-300">جاري تحميل صور صفحات الفصل مباشرة...</h4>
            <p className="text-xs text-zinc-500">
              نقوم الآن بجلب الروابط وفك حظر السيرفرات لتجربة تصفح سريعة وخالية من الإعلانات.
            </p>
          </div>
        )}"""

content = content.replace(old_loading, new_loading)

# We will show the preload progress in a small toast-like bar at the bottom or top of the reader, or just keep it invisible. 
# The user wants them to be preloaded. Keeping it invisible is fine, or maybe a small progress bar.
# Let's add a small progress bar at the top of the reader content if preloading.

progress_bar = """        {/* MAIN CONTENT AREA */}
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
            )}"""

content = content.replace("""        {/* MAIN CONTENT AREA */}
        {!loadingPages && !pagesError && (
          <>""", progress_bar)

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched background preloader")
