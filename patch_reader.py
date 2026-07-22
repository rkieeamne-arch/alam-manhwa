import re

with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add preloadProgress state
if "const [preloadProgress" not in content:
    content = content.replace("const [pagesError, setPagesError] = useState<string | null>(null);", "const [pagesError, setPagesError] = useState<string | null>(null);\n  const [preloadProgress, setPreloadProgress] = useState({ current: 0, total: 0 });")

# Replace fetchPages logic
old_fetch = """        const pages = await scrapeChapterPages(source, pagesUrl as string);
        if (pages.length === 0) {
          throw new Error('فشل جلب الصفحات المصورة. قد تكون الصور محمية خلف جدار ناري أو نظام عرض تفاعلي خاص.');
        }
        setScrapedPages(pages);
        setCurrentPageIndex(0);
      } catch (err: any) {"""

new_fetch = """        const pages = await scrapeChapterPages(source, pagesUrl as string);
        if (pages.length === 0) {
          throw new Error('فشل جلب الصفحات المصورة. قد تكون الصور محمية خلف جدار ناري أو نظام عرض تفاعلي خاص.');
        }

        // Preload images before displaying
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
        }

        setScrapedPages(pages);
        setCurrentPageIndex(0);
      } catch (err: any) {"""

content = content.replace(old_fetch, new_fetch)

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched fetchPages")
