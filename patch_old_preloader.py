import re

with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_preloader = """  // Image preloader for fast browsing (preloads next 2 pages in page mode)
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
      displayPages.forEach(page => { // Preload ALL images as requested
        const img = new Image();
        img.src = typeof page === 'string' ? page : URL.createObjectURL(page);
      });
    }
  }, [currentPageIndex, displayPages, readerSettings.readingMode]);"""

new_preloader = """  // Image preloader for fast browsing (preloads next 2 pages in page mode)
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
  }, [currentPageIndex, displayPages, readerSettings.readingMode]);"""

content = content.replace(old_preloader, new_preloader)

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched old preloader")
