import { ScraperSource, Manhua, Chapter } from '../types';
import { sources, SourceId } from '../sources';
import { getProxiedUrl } from '../sources/fetch';

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
  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (source.baseUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const result = await handler.parsePopularList(page, query, source);
    
    return result.map(manga => ({
      id: `scr-${source.id}-${manga.id}`,
      title: manga.title,
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
      releaseYear: new Date().getFullYear(),
      chapters: [],
      latestChapter: 'عرض الفصول'
    }));
  } catch (err: any) {
    console.warn('Warning in scrapeMangaList (handled):', err.message || err);
    return [];
  }
}

function extractChapterNumber(title: string, index: number, totalChapters: number): number {
  const match = title.match(/(?:الفصل|Chapter)\s*([\d.]+)/i);
  if (match) {
    return parseFloat(match[1]);
  }
  const numMatch = title.match(/^[\d.]+$/);
  if (numMatch) {
     return parseFloat(numMatch[0]);
  }
  return totalChapters - index; 
}

export async function scrapeMangaDetails(source: ScraperSource, mangaUrl: string): Promise<Manhua> {
  try {
    const handlerId = source.id as SourceId;
    let handler = sources[handlerId];
    if (!handler) {
      if (mangaUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (mangaUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else if (source.baseUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const manga = await handler.parseMangaDetails(mangaUrl, source);
    
    // Deduplicate chapters just in case
    const uniqueChapters = [];
    const seenIds = new Set();
    for (const ch of (manga.chapters || [])) {
      if (!seenIds.has(ch.id)) {
        uniqueChapters.push(ch);
        seenIds.add(ch.id);
      }
    }

    const chapters: Chapter[] = uniqueChapters.map((ch, idx) => ({
      id: `ch-${source.id}-${ch.id}`,
      manhuaId: `scr-${source.id}-${manga.id}`,
      title: ch.name,
      chapterNumber: extractChapterNumber(ch.name, idx, uniqueChapters.length),
      releaseDate: 'محدث',
      pages: [ch.url],
      views: 0,
      isLocked: ch.isLocked
    }));

    return {
      id: `scr-${source.id}-${manga.id}`,
      title: manga.title,
      description: manga.description || 'لا يوجد ملخص מתوفر.',
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
      if (mangaUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (mangaUrl.includes('azorafly.com')) handler = sources['azorafly'];
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
      if (chapterUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (chapterUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else if (source.baseUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
      else handler = sources['generic'];
    }
    
    const pages = await handler.parseChapterPages(chapterUrl, source);
    
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
      if (source.baseUrl.includes('olympustaff.com')) handler = sources['olympustaff'];
      else if (source.baseUrl.includes('azorafly.com')) handler = sources['azorafly'];
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

