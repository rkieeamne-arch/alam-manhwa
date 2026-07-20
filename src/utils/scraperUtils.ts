import { Chapter } from '../types';
import { proxiedFetch } from '../sources/fetch';

/**
 * Retries a fetch request with exponential backoff.
 */
export async function retryFetch(url: string, options: RequestInit = {}, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await proxiedFetch(url, options);
      if (response.ok) return response;
      if (response.status === 404) throw new Error('404 Not Found');
      // For other statuses, we might want to retry
      throw new Error(`Status ${response.status}`);
    } catch (err: any) {
      lastError = err;
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.log(`[Scraper] Retrying ${url} (${i + 1}/${maxRetries}) after ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

/**
 * Extracts a numeric value from a title string using regex.
 */
export function extractNumber(title: string, fallback: number | null = null): number | null {
  if (!title) return fallback;

  // Remove dates like YYYY/MM/DD or DD/MM/YYYY or YYYY-MM-DD
  let cleanTitle = title.replace(/\d{2,4}[-/]\d{1,2}[-/]\d{2,4}/g, '');

  // 1. Explicit patterns: الفصل 5, Chapter 10, Episode 12.5
  const explicitMatch = cleanTitle.match(/(?:الفصل|Chapter|الحلقة|Episode|OVA|Special|الاوفا|الخاصة|ch\.|ep\.|ch|ep|v\.)[^\d]*([\d.]+)/i);
  if (explicitMatch) {
    const num = parseFloat(explicitMatch[1]);
    if (!isNaN(num)) return num;
  }

  // 2. Patterns like " - 6 " or "#6" or ": 6"
  const separatorMatch = cleanTitle.match(/(?:-|\s|#|:)\s*([\d.]+)(?:\s|$)/);
  if (separatorMatch) {
    const num = parseFloat(separatorMatch[1]);
    if (!isNaN(num)) return num;
  }

  // 3. Extract all numbers and take the last one (usually chapter number follows season/year)
  const numbers = cleanTitle.match(/[\d.]+/g);
  if (numbers && numbers.length > 0) {
    // Filter out common years or large unrelated numbers if needed, but last one is usually safest
    // Let's take the first number if it's the only one, otherwise the last
    const lastNum = parseFloat(numbers[numbers.length - 1]);
    if (!isNaN(lastNum)) return lastNum;
  }

  return fallback;
}

/**
 * Cleans a title by removing common noise and unnecessary spaces.
 */
export function cleanTitle(title: string): string {
  if (!title) return '';
  
  // Remove "RISTO" prefix
  let cleaned = title.replace(/^RISTO\s*/i, '');
  
  // Comprehensive list of metadata terms that often get concatenated at the beginning or end of titles
  const metadataTerms = [
    'الحالةالنوعالفصولآخرتحديث', 'الحالةالنوعالفصولآخر\\s*تحديث', 'الحالةالنوعالفصول',
    'الحالة', 'النوع', 'الفصول', 'آخر\\s*تحديث', 'آخر', 'تحديث',
    'التصنيف', 'المؤلف', 'الرسام', 'القصة', 'الاسم', 'اسم',
    'مانجا', 'مانهو', 'سلسلة', 'الفصل', 'الحلقة', 'مشاهدة',
    'تحميل', 'شاهد', 'كامل', 'مترجم', 'مترجمة', 'اون\\s*لاين',
    'مستمر', 'منتهي', 'متوقف', 'مكتمل', 'منتهية', 'مكتملة', 'العرض',
    'rating', 'status', 'type', 'chapters', 'author', 'artist', 'genre'
  ];

  // We build a regex that matches any sequence of these words (including spaces, colons, vertical bars, hyphens, slashes, or brackets) at the start
  const cleanPrefixRegex = new RegExp(`^(${metadataTerms.join('|')}|\\d+|[\\s|:./\\\\_\\-()!])+`, 'i');
  cleaned = cleaned.replace(cleanPrefixRegex, '').trim();

  // Remove duplicate concatenated texts
  cleaned = cleaned.split('....')[0];
  
  // Clean prefix
  cleaned = cleaned.replace(/^(مشاهدة\s*انمي|جميع\s*حلقات\s*انمي|جميع\s*حلقات|انمي\s*|تحميل\s*انمي|مسلسل\s*انمي)/gi, '');
  
  // Split by common suffixes
  const parts = cleaned.split(/(?:الموسم|الحلقة|مترجم|مترجمة|مترجمه|كامل|اون\s?لاين|بجودة|جودة|شاهد)/i);
  
  cleaned = parts[0];
  
  // Clean prefixes/metadata again after splitting
  cleaned = cleaned.replace(cleanPrefixRegex, '').trim();
  
  // Remove trailing non-alphanumeric/Arabic characters
  cleaned = cleaned.replace(/[-,\s.:|]+$/g, '').trim();
  
  return cleaned || title;
}

/**
 * Sorts chapters/episodes numerically by their extracted number.
 */
export function sortNumerically<T extends { chapterNumber?: number; episodeNumber?: number; title?: string; name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const numA = a.chapterNumber ?? a.episodeNumber ?? extractNumber(a.title || a.name || '');
    const numB = b.chapterNumber ?? b.episodeNumber ?? extractNumber(b.title || b.name || '');
    return numA - numB;
  });
}

/**
 * Deduplicates chapters/episodes by ID or unique URL.
 */
export function deduplicate<T extends { id?: string; url?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.id || item.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Validates a scraper item before returning it.
 */
export function validateItem(item: any): boolean {
  if (!item) return false;
  if (!item.title || item.title.trim().length === 0) return false;
  const url = item.url || item.sourceUrl;
  if (!url || !url.startsWith('http')) return false;
  return true;
}

/**
 * Simple in-memory cache for scraper results.
 */
const scraperCache: Record<string, { data: any; expiry: number }> = {};

export function getCachedData(key: string): any | null {
  const cached = scraperCache[key];
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any, ttlSeconds: number = 300): void {
  scraperCache[key] = {
    data,
    expiry: Date.now() + ttlSeconds * 1000
  };
}

/**
 * Normalizes all extracted data to a standard structure.
 */
export function normalizeScrapedData(item: any, sourceId: string): any {
  const cleanT = cleanTitle(item.title);
  return {
    ...item,
    id: item.id || `scr-${sourceId}-${Math.random().toString(36).substring(7)}`,
    title: cleanT,
    chapterNumber: item.chapterNumber ?? (item.type === 'manga' ? extractNumber(item.title) : undefined),
    episodeNumber: item.episodeNumber ?? (item.type === 'anime' ? extractNumber(item.title) : undefined),
    source: sourceId,
    url: item.url,
    releaseDate: item.releaseDate || 'محدث مؤخراً'
  };
}
