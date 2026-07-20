import { ScraperSource, Manhua, Chapter } from '../types';
import { sources, SourceId } from '../sources';
import { getProxiedUrl } from '../sources/fetch';
import { extractNumber, cleanTitle, sortNumerically, deduplicate, validateItem, getCachedData, setCachedData } from './scraperUtils';

export function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  try {
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return new URL(url, baseUrl).href;
  } catch (e) {
    return url;
  }
}

export async function scrapeMangaList(source: ScraperSource, page: number = 1, query?: string): Promise<any[]> {
  const cacheKey = `manga-list-${source.id}-${page}-${query || ''}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const result = await handler.parsePopularList(page, query, source);
    
    const normalized = result
      .filter(m => validateItem(m))
      .map(manga => {
        // Create a dummy chapters array if we have a latestChapter string like "الفصل 105"
        let chapters: any[] = manga.chapters || [];
        if (chapters.length === 0 && manga.latestChapter) {
          const num = extractNumber(manga.latestChapter);
          if (num > 0) {
            chapters = Array(Math.floor(num)).fill(0).map((_, i) => ({ id: `dummy-${i}`, title: `الفصل ${i+1}`, chapterNumber: i+1 }));
          }
        }

        const title = cleanTitle(manga.title);

        return {
          id: `scr-${source.id}-${manga.id}`,
          title,
          englishTitle: manga.title,
          coverUrl: getProxiedUrl(manga.cover),
          rawCoverUrl: manga.cover,
          sourceUrl: manga.url,
          sourceId: source.id,
          description: manga.description || '',
          rating: 4.5,
          views: 0,
          status: 'مستمر' as any,
          categories: [],
          releaseYear: 0,
          chapters: chapters,
          latestChapter: manga.latestChapter || ''
        };
      });

    setCachedData(cacheKey, normalized, 600); // 10 mins cache
    return normalized;
  } catch (err: any) {
    console.warn('Warning in scrapeMangaList (handled):', err.message || err);
    return [];
  }
}

function extractChapterNumber(title: string, index: number, totalChapters: number): number {
  if (!title) return index + 1;

  // 1. Try matching with explicit keywords (الفصل, الحلقة, Chapter, Episode, etc.)
  const match = title.match(/(?:الفصل|Chapter|الحلقة|Episode|OVA|Special|الاوفا|الخاصة|ch\.|ep\.|ch|ep)[^\d]*([\d.]+)/i);
  if (match) {
    return parseFloat(match[1]);
  }

  // 2. Try matching with hyphen/hash/colon separators followed by number, e.g., "- 6" or "#6" or ": 6"
  const sepMatch = title.match(/(?:-|\s|#|:)\s*([\d.]+)(?:\s|$)/);
  if (sepMatch) {
    const num = parseFloat(sepMatch[1]);
    if (!isNaN(num)) return num;
  }

  // 3. Extract all numbers from the title to find the most likely chapter/episode number.
  // Season/year numbers like "4th", "2026", "3" usually come first, and the episode/chapter number comes last.
  // E.g., "Re:Zero 4th Season - 06" -> numbers are [4, 6]. The last one is 6!
  // E.g., "Solo Leveling Season 2 Chapter 150" -> numbers are [2, 150]. The last one is 150!
  const numbers = title.match(/[\d.]+/g);
  if (numbers && numbers.length > 0) {
    const lastNum = parseFloat(numbers[numbers.length - 1]);
    if (!isNaN(lastNum)) {
      return lastNum;
    }
  }

  // 4. Default fallback: use a standard index offset
  return index + 1;
}

export async function scrapeMangaDetails(source: ScraperSource, mangaUrl: string, bypassCache: boolean = false): Promise<Manhua> {
  const cacheKey = `manga-details-${mangaUrl}`;
  if (!bypassCache) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (mangaUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const manga = await handler.parseMangaDetails(mangaUrl, source);
    
    // Deduplicate and Sort numerically
    const uniqueChapters = deduplicate(manga.chapters || []);
    const sortedChapters = sortNumerically(uniqueChapters.map((ch, idx) => ({
      ...ch,
      chapterNumber: extractNumber(ch.name, idx + 1)
    })));

    const chapters: Chapter[] = sortedChapters.map(ch => ({
      id: `ch-${source.id}-${ch.id}`,
      manhuaId: `scr-${source.id}-${manga.id}`,
      title: ch.name,
      chapterNumber: ch.chapterNumber,
      releaseDate: 'محدث',
      pages: [ch.url],
      views: 0,
      isLocked: ch.isLocked
    }));

    const details: Manhua = {
      id: `scr-${source.id}-${manga.id}`,
      title: cleanTitle(manga.title),
      description: manga.description || 'لا يوجد ملخص متوفر.',
      coverUrl: getProxiedUrl(manga.cover),
      author: 'غير معروف',
      artist: 'غير معروف',
      status: 'مستمر',
      categories: ['عام'],
      releaseYear: new Date().getFullYear(),
      views: 0,
      rating: 5.0,
      chapters: chapters
    };

    setCachedData(cacheKey, details, 300); // 5 mins
    return details;
  } catch (err: any) {
    console.warn('Warning in scrapeMangaDetails (handled):', err.message || err);
    throw err;
  }
}

export async function scrapeMangaChapters(source: ScraperSource, mangaUrl: string, page: number): Promise<Chapter[]> {
  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (mangaUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    if (!handler.parseMangaChapters) {
      return []; // Not supported
    }

    const scrapedChapters = await handler.parseMangaChapters(mangaUrl, page, source);
    
    // Deduplicate
    const uniqueChapters = [];
    const seenIds = new Set();
    for (const ch of scrapedChapters) {
      if (!seenIds.has(ch.id)) {
        uniqueChapters.push(ch);
        seenIds.add(ch.id);
      }
    }

    return uniqueChapters.map((ch, idx) => ({
      id: `ch-${source.id}-${ch.id}`,
      manhuaId: `scr-${source.id}-unknown`, // we won't strictly need this for rendering the list
      title: ch.name,
      chapterNumber: extractChapterNumber(ch.name, idx, uniqueChapters.length),
      releaseDate: 'محدث',
      pages: [ch.url],
      views: 0,
      isLocked: ch.isLocked
    }));
  } catch (err: any) {
    console.warn('Warning in scrapeMangaChapters (handled):', err.message || err);
    throw err;
  }
}

export async function scrapeChapterPages(source: ScraperSource, chapterUrl: string): Promise<string[]> {
  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (chapterUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const pages = await handler.parseChapterPages(chapterUrl, source);
    
    // For anime, we don't want to proxy the server URLs because they are often iframes 
    // that need to load their own assets and scripts correctly.
    if (source.type === 'anime') {
      return pages.map(p => p.url);
    }
    
    return pages.map(p => getProxiedUrl(p.url));
  } catch (err: any) {
    console.warn('Warning in scrapeChapterPages (handled):', err.message || err);
    throw err;
  }
}

export async function testSelector(targetUrl: string, selector: string, attribute?: string): Promise<string[]> {
  return ['Not supported with the new architecture.'];
}

export async function scrapePopularList(source: ScraperSource, query?: string): Promise<any[]> {
  try {
    const handlerId = source.id as SourceId;
    // هنا السر: نتأكد من اختيار المعالج الصحيح بناءً على الرابط أو المعرف
    let handler = sources[handlerId];
    
    if (!handler) {
      if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    // نمرر الـ query للمعالج لكي يقوم بالبحث الفعلي
    const result = await handler.parsePopularList(1, query, source);
    
    return result.map(manga => ({
      id: `scr-${source.id}-${manga.id}`,
      title: manga.title,
      coverUrl: getProxiedUrl(manga.cover),
      rawCoverUrl: manga.cover,
      sourceUrl: manga.url,
      sourceId: source.id,
      latestChapter: 'عرض الفصول'
    }));
  } catch (err: any) {
    console.warn('Warning in scrapePopularList (handled):', err.message || err);
    return []; // نرجع مصفوفة فارغة بدل التعطل
  }
}

