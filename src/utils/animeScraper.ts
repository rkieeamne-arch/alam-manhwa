import * as cheerio from 'cheerio';
import { proxiedFetch, getProxiedUrl } from '../sources/fetch';
import { extractNumber, cleanTitle, sortNumerically, deduplicate, validateItem, retryFetch } from './scraperUtils';
import { sources } from '../sources';

// Based on the user's provided description, we need these helpers
const ANIME_HOME_URL = 'https://ristoanime.me/';
const SEARCH_BASE_URL = 'https://ristoanime.me/';

// Safe URI decoding to prevent crashes on bad percent encoded data
function safeDecodeURI(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str.replace(/%([0-9A-Fa-f]{2})/g, ' ');
  }
}

// Check if a link is noise (e.g. sidebar widget, related content, footer updates, etc.)
function isNoiseLink(el: any, $: cheerio.CheerioAPI, animeSlug: string): boolean {
  try {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    
    // 1. Check parent hierarchy for sidebar / related / footer / slider classes
    let isNoise = false;
    $(el).parents().each((_, parent) => {
      const cls = ($(parent).attr('class') || '').toLowerCase();
      const id = ($(parent).attr('id') || '').toLowerCase();
      
      if (
        cls.includes('sidebar') || id.includes('sidebar') ||
        cls.includes('related') || id.includes('related') ||
        cls.includes('widget') || id.includes('widget') ||
        cls.includes('footer') || id.includes('footer') ||
        cls.includes('header') || id.includes('header') ||
        cls.includes('recommend') || id.includes('recommend') ||
        cls.includes('latest') || id.includes('latest') ||
        cls.includes('recent') || id.includes('recent') ||
        cls.includes('slider') || id.includes('slider') ||
        cls.includes('carousel') || id.includes('carousel') ||
        cls.includes('breadcrumbs') || id.includes('breadcrumbs') ||
        cls.includes('breadcrumb') || id.includes('breadcrumb') ||
        cls.includes('navbar') || id.includes('navbar') ||
        cls.includes('menu') || id.includes('menu') ||
        cls.includes('comment') || id.includes('comment') ||
        cls.includes('reply') || id.includes('reply') ||
        cls.includes('nav-links') || cls.includes('navigation') ||
        cls.includes('blocks-holder') || id.includes('blocks-holder') ||
        cls.includes('mainfiltar') || id.includes('mainfiltar')
      ) {
        isNoise = true;
        return false; // break parents loop
      }
    });
    
    if (isNoise) return true;

    // 2. Keyword matching fallback
    if (animeSlug) {
      const decodedSlug = safeDecodeURI(animeSlug).toLowerCase();
      const decodedHref = safeDecodeURI(href).toLowerCase();
      const titleLower = text.toLowerCase();

      if (decodedHref.includes(decodedSlug)) return false; // definitely related

      const stopWords = new Set([
        'جميع', 'حلقات', 'انمي', 'الموسم', 'مترجمة', 'اون', 'لاين', 'مترجم', 'مترجمه',
        'الاول', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'الأولى', 'الاولى',
        'الرابعة', 'الخامسة', 'الحلقة', 'حلقة', 'series', 'anime', 'season', 'episode',
        'episodes', 'watch', 'download', 'تحميل', 'مشاهدة', 'من', 'في', 'على', 'بث',
        'مباشر', 'كامل', 'كاملة', 'الجديد', 'بجودة', 'عالية', 'hd', 'fhd', 'موقع', 'انميات',
        'لاي', 'فصل', 'الفصل', 'فصول', 'الفصول', 'manga', 'manhua', 'chapters', 'chapter'
      ]);

      const slugParts = decodedSlug
        .replace(/[-_+]/g, ' ')
        .split(/\s+/)
        .map(p => p.trim())
        .filter(p => p.length > 2 && !stopWords.has(p));

      if (slugParts.length > 0) {
        const matchesHref = slugParts.some(part => decodedHref.includes(part));
        const matchesTitle = slugParts.some(part => titleLower.includes(part));
        
        if (!matchesHref && !matchesTitle) {
          return true; // No keywords match, it's likely noise
        }
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

// Use utility functions for reliability
function parseEpisodeNumber(title: string): number {
  return extractNumber(title);
}

function cleanAnimeTitle(title: string): string {
  return cleanTitle(title);
}

function extractAnimeTitleFromEpisodeTitle(title: string): string {
  return cleanTitle(title);
}

export interface RelatedSeason {
  id: string;
  title: string;
  url: string;
  coverUrl?: string;
  type?: string;
}

export interface Anime {
  id: string;
  title: string;
  coverUrl: string;
  rawCoverUrl: string;
  description: string;
  rating: number;
  views?: number;
  status: string;
  categories: string[];
  releaseYear: number;
  episodes: Episode[];
  latestEpisode?: string;
  sourceUrl: string;
  sourceId: string;
  relatedSeasons?: RelatedSeason[];
}

export interface Episode {
  id: string;
  animeId: string;
  title: string;
  episodeNumber: number;
  servers: { name: string; url: string }[];
  url: string;
}

export async function fetchLatestEpisodes(pageNum: number = 1): Promise<Anime[]> {
  try {
    let url = ANIME_HOME_URL;
    if (pageNum > 1) {
      url = `${ANIME_HOME_URL.replace(/\/$/, '')}/filtering/page/${pageNum}/`;
    }
    const res = await retryFetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const text = await res.text();
    const $ = cheerio.load(text);

    const episodes: Anime[] = [];
    
    $('.CARTA, .bita9a-link, .MovieItem, .animiyat, .DivCARTA, .ABBIYAT, .anime-card, .series-card').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || $(el).attr('href') || '';
      if (!href || href === '#' || href.includes('/category/') || href.includes('/genre/')) return;
      
      let titleRaw = $(el).find('h4').text().trim() || $(el).find('.title').text().trim() || $(el).find('.title h4').text().trim() || a.text().trim();
      if (!titleRaw) return;

      const imgEl = $(el).find('img').first();
      let rawCover = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
      if (!rawCover) {
        const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || $(el).attr('style') || '';
        rawCover = style.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
      }
      const coverUrl = getProxiedUrl(rawCover); 
      
      const epNum = parseEpisodeNumber(titleRaw);
      const animeTitle = extractAnimeTitleFromEpisodeTitle(titleRaw);
      const slug = href.split('/').filter(Boolean).pop() || '';
      const id = slug || `anime-p${pageNum}-${episodes.length}`;
      
      if (!episodes.some(item => item.id === id)) {
        const item: Anime = {
          id,
          title: animeTitle || titleRaw,
          coverUrl,
          rawCoverUrl: rawCover,
          description: `شاهد ${animeTitle || 'هذا العمل'} مترجم بجودة عالية.`,
          rating: 8.0,
          views: Math.floor(Math.random() * 5000) + 1000,
          status: 'مستمر',
          categories: ['اكشن', 'مغامرة'],
          releaseYear: new Date().getFullYear(),
          episodes: [
            { id, animeId: id, title: titleRaw || `الحلقة ${epNum || 1}`, episodeNumber: epNum || 1, servers: [], url: href }
          ],
          latestEpisode: epNum ? `الحلقة ${epNum}` : 'مشاهدة',
          sourceUrl: href,
          sourceId: 'witanime'
        };

        if (validateItem(item)) {
          episodes.push(item);
        }
      }
    });

    // Fallback for page > 1 if filtering yielded no results
    if (episodes.length === 0 && pageNum > 1) {
      const fallbackUrl = `${ANIME_HOME_URL.replace(/\/$/, '')}/series/page/${pageNum}/`;
      const fallbackRes = await retryFetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fbText = await fallbackRes.text();
        const $fb = cheerio.load(fbText);
        $fb('.MovieItem, .CARTA, .animiyat, .ABBIYAT, .DivCARTA').each((_, el) => {
          const a = $fb(el).find('a').first();
          const href = a.attr('href') || $fb(el).attr('href') || '';
          if (!href || href === '#' || href.includes('/category/')) return;
          const titleRaw = $fb(el).find('h4').text().trim() || $fb(el).find('.title').text().trim() || a.text().trim();
          if (!titleRaw) return;
          const imgEl = $fb(el).find('img').first();
          let rawCover = imgEl.attr('src') || imgEl.attr('data-src') || '';
          if (!rawCover) {
            const style = $fb(el).find('.poster').attr('data-style') || $fb(el).find('.poster').attr('style') || '';
            rawCover = style.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
          }
          const coverUrl = getProxiedUrl(rawCover);
          const slug = href.split('/').filter(Boolean).pop() || '';
          const id = slug || `anime-fb-p${pageNum}-${episodes.length}`;
          if (!episodes.some(item => item.id === id)) {
            episodes.push({
              id,
              title: cleanTitle(titleRaw) || titleRaw,
              coverUrl,
              rawCoverUrl: rawCover,
              description: `مشاهدة وتحميل ${cleanTitle(titleRaw)} مترجم بجودة عالية.`,
              rating: 8.0,
              views: 1200,
              status: 'مستمر',
              categories: ['أنمي'],
              releaseYear: new Date().getFullYear(),
              episodes: [],
              latestEpisode: 'مشاهدة',
              sourceUrl: href,
              sourceId: 'witanime'
            });
          }
        });
      }
    }

    return episodes;
  } catch (err) {
    console.error('[Anime Scraper] fetchLatestEpisodes failed:', err);
    return [];
  }
}

export async function fetchLatestSeries(pageNum: number = 1): Promise<Anime[]> {
  try {
    let url = `${ANIME_HOME_URL.replace(/\/$/, '')}/series/`;
    if (pageNum > 1) {
      url = `${ANIME_HOME_URL.replace(/\/$/, '')}/filtering/page/${pageNum}/`;
    }
    const res = await retryFetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);
    const seriesList: Anime[] = [];

    $('.MovieItem, .animiyat, .ABBIYAT, .CARTA, .DivCARTA').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || $(el).attr('href') || '';
      if (!href || href === '#' || href.includes('/category/')) return;
      
      const img = $(el).find('img').first();
      const altTitle = img.attr('alt') || '';
      let rawCover = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
      if (!rawCover) {
        const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || '';
        rawCover = style.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
      }
      const coverUrl = getProxiedUrl(rawCover);
      
      const titleRaw = $(el).find('h4').text().trim() || $(el).find('.title').text().trim() || a.text().trim();
      const isCompleted = titleRaw.includes('مكتمل');
      const cleanAnimeTitle = altTitle || cleanTitle(titleRaw);
      const slug = href.split('/').filter(Boolean).pop() || '';

      if (cleanAnimeTitle && !seriesList.some(s => s.id === `series-${slug}`)) {
        seriesList.push({
          id: `series-${slug}`,
          title: cleanAnimeTitle,
          coverUrl,
          rawCoverUrl: rawCover,
          description: `تابع حلقات انمي ${cleanAnimeTitle} مترجمة بالكامل وبأعلى جودة.`,
          rating: 8.5,
          status: isCompleted ? 'مكتمل' : 'مستمر',
          categories: ['خيال', 'خارق للطبيعة'],
          releaseYear: 2025,
          episodes: [],
          latestEpisode: isCompleted ? 'مكتمل' : 'مستمر',
          sourceUrl: href,
          sourceId: 'witanime'
        });
      }
    });
    return seriesList;
  } catch (err) {
    console.error('[Anime Scraper] fetchLatestSeries failed:', err);
    return [];
  }
}

export async function searchAnime(query: string, pageNum: number = 1): Promise<Anime[]> {
  if (!query || query.trim() === '') return [];
  try {
    let searchUrl = `${ANIME_HOME_URL}?s=${encodeURIComponent(query)}`;
    if (pageNum > 1) {
      searchUrl = `${ANIME_HOME_URL}page/${pageNum}/?s=${encodeURIComponent(query)}`;
    }
    const res = await retryFetch(searchUrl);
    const text = await res.text();
    const $ = cheerio.load(text);
    const results: Anime[] = [];

    $('.MovieItem, .CARTA, .animiyat, .DivCARTA, .ABBIYAT, .bita9a-link, .anime-card, .series-card').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || $(el).attr('href') || '';
      if (!href || href === '#' || href.includes('/category/') || href.includes('/genre/')) return;

      let titleRaw = $(el).find('h4').text().trim() || $(el).find('.title').text().trim() || $(el).find('.title h4').text().trim() || $(el).find('.title p').text().trim() || a.text().trim();
      if (!titleRaw) return;

      const imgEl = $(el).find('img').first();
      let rawCover = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
      if (!rawCover) {
        const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || '';
        rawCover = style.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
      }
      const coverUrl = getProxiedUrl(rawCover);
      const genre = $(el).find('.genre').text().trim() || 'عام';
      const yearStr = $(el).find('.year').text().trim();
      const slug = href.split('/').filter(Boolean).pop() || '';
      const id = slug || `search-${results.length}`;

      if (!results.some(r => r.id === id)) {
        results.push({
          id,
          title: cleanTitle(titleRaw) || titleRaw,
          coverUrl,
          rawCoverUrl: rawCover,
          description: `مشاهدة وتحميل انمي ${cleanTitle(titleRaw)} مترجم بجودة عالية.`,
          rating: 8.2,
          views: 0,
          status: 'مستمر',
          categories: [genre],
          releaseYear: parseInt(yearStr) || 2025,
          episodes: [],
          sourceUrl: href,
          sourceId: 'witanime'
        });
      }
    });
    return results;
  } catch (err) {
    return [];
  }
}

async function probeLatestEpisodes(sampleUrl: string, currentMax: number): Promise<number> {
  if (!sampleUrl || sampleUrl.includes('NaN') || isNaN(currentMax) || currentMax < 1) {
    return currentMax || 1;
  }

  const numStr = currentMax.toString();
  let template = '';
  if (sampleUrl.includes(`-${numStr}-`)) {
    template = sampleUrl.replace(`-${numStr}-`, '-{EP}-');
  } else if (sampleUrl.includes(`-${numStr}/`)) {
    template = sampleUrl.replace(`-${numStr}/`, '-{EP}/');
  } else if (sampleUrl.includes(`/${numStr}/`)) {
    template = sampleUrl.replace(`/${numStr}/`, '/{EP}/');
  } else if (numStr.length >= 2) {
    const idx = sampleUrl.lastIndexOf(numStr);
    if (idx !== -1) {
      template = sampleUrl.substring(0, idx) + '{EP}' + sampleUrl.substring(idx + numStr.length);
    }
  }

  if (!template || template.includes('NaN')) return currentMax;

  let highest = currentMax;
  let batchStart = currentMax + 1;
  const BATCH_SIZE = 4;
  let consecutiveEmptyBatches = 0;

  while (consecutiveEmptyBatches < 2 && (batchStart - currentMax) <= 80) {
    const probes = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      probes.push(batchStart + i);
    }

    const results = await Promise.all(
      probes.map(async ep => {
        const url = template.replace('{EP}', ep.toString());
        try {
          const res = await retryFetch(url);
          return { ep, ok: res.ok };
        } catch {
          return { ep, ok: false };
        }
      })
    );

    let foundInBatch = 0;
    for (const r of results) {
      if (r.ok) {
        if (r.ep > highest) highest = r.ep;
        foundInBatch++;
      }
    }

    if (foundInBatch === 0) {
      consecutiveEmptyBatches++;
    } else {
      consecutiveEmptyBatches = 0;
    }

    batchStart += BATCH_SIZE;
  }

  return highest;
}

function extractSmartKeywords(title: string): string[] {
  const keywords: string[] = [];
  let clean = title
    .replace(/^مشاهدة\s+/gi, '')
    .replace(/^تحميل\s+/gi, '')
    .replace(/^انمي\s+/gi, '')
    .replace(/^جميع\s+حلقات\s+/gi, '')
    .replace(/مترجم\s+اونلاين.*/gi, '')
    .replace(/مترجم\s+اون\s+لاين.*/gi, '')
    .replace(/مترجم.*/gi, '')
    .replace(/(الموسم|Season|Movie|فيلم|الحلقة|Part|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الأخير).*/gi, '')
    .trim();

  const engMatch = clean.match(/[a-zA-Z0-9\s']{3,}/g);
  if (engMatch) {
    engMatch.forEach(eng => {
      const trimmed = eng.trim();
      const words = trimmed.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        keywords.push(words.slice(0, 3).join(' '));
        if (words[0].length >= 4) {
          keywords.push(words[0]);
        }
      }
    });
  }

  const arbMatch = clean.match(/[\u0600-\u06FF\s]{3,}/g);
  if (arbMatch) {
    arbMatch.forEach(arb => {
      const trimmed = arb.trim();
      const words = trimmed.split(/\s+/).filter(w => w.length > 2 && !['مشاهدة', 'تحميل', 'حلقات', 'انمي', 'جميع', 'مترجم'].includes(w));
      if (words.length > 0) {
        keywords.push(words.slice(0, 3).join(' '));
        if (words[0].length >= 3) {
          keywords.push(words[0]);
        }
      }
    });
  }

  return Array.from(new Set(keywords.filter(k => k.length >= 3)));
}

function cleanSeasonTitle(raw: string): string {
  let title = raw;
  if (title.includes('....')) {
    title = title.split('....').pop() || title;
  }
  return title
    .replace(/^مشاهدة\s+/i, '')
    .replace(/^تحميل\s+/i, '')
    .replace(/مترجم\s+اونلاين/gi, '')
    .replace(/مترجم\s+اون\s+لاين/gi, '')
    .replace(/مترجم/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStrictlyRelatedFranchise(mainTitle: string, candidateTitle: string): boolean {
  if (!mainTitle || !candidateTitle) return false;

  const normMain = mainTitle.toLowerCase();
  const normCand = candidateTitle.toLowerCase();

  const cleanMain = normMain
    .replace(/^مشاهدة\s+/gi, '')
    .replace(/^تحميل\s+/gi, '')
    .replace(/^انمي\s+/gi, '')
    .replace(/^جميع\s+حلقات\s+/gi, '')
    .replace(/مترجم\s+اونلاين.*/gi, '')
    .replace(/مترجم\s+اون\s+لاين.*/gi, '')
    .replace(/مترجم.*/gi, '')
    .replace(/(الموسم|season|movie|فيلم|الحلقة|part|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الأخير).*/gi, '')
    .trim();

  const stopWords = new Set([
    'مشاهدة', 'تحميل', 'حلقات', 'انمي', 'جميع', 'مترجم', 'اونلاين', 'الموسم', 'حلقة', 'فيلم', 'الجزء',
    'anime', 'season', 'movie', 'episodes', 'episode', 'series', 'part', 'mowasem', 'isekai', 'no', 'to', 'wa', 'ga', 'san', 'kun', 'sama', 'hen'
  ]);

  const engWords = (cleanMain.match(/[a-z0-9]{3,}/g) || []).filter(w => !stopWords.has(w));
  const arbWords = (cleanMain.match(/[\u0600-\u06FF]{3,}/g) || []).filter(w => !stopWords.has(w));

  if (engWords.length > 0) {
    const match = engWords.some(w => normCand.includes(w));
    if (match) return true;
  }

  if (arbWords.length > 0) {
    const match = arbWords.some(w => normCand.includes(w));
    if (match) return true;
  }

  return false;
}

function detectSeasonType(title: string): string {
  if (title.includes('فيلم') || title.toLowerCase().includes('movie')) return 'فيلم';
  if (title.includes('أونا') || title.toLowerCase().includes('ona')) return 'أونا';
  if (title.includes('أوفا') || title.toLowerCase().includes('ova')) return 'أوفا';
  if (title.includes('خاصة') || title.toLowerCase().includes('special')) return 'خاصة';
  if (title.includes('الموسم') || title.toLowerCase().includes('season')) return 'موسم';
  return 'مواسم أخرى';
}

async function fetchRelatedSeasons(
  $: cheerio.CheerioAPI,
  animeTitle: string,
  targetUrl: string
): Promise<RelatedSeason[]> {
  const seasons: RelatedSeason[] = [];
  const addedUrls = new Set<string>();

  const normUrl = (u: string) => {
    try {
      return decodeURIComponent(u).replace(/\/$/, '').toLowerCase();
    } catch (e) {
      return u.replace(/\/$/, '').toLowerCase();
    }
  };

  const isInvalidSeasonLink = (href: string) => {
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return true;
    if (href.includes('/episode/') || href.includes('/watch') || href.includes('/filtering/')) return true;
    const decoded = normUrl(href);
    if (decoded.includes('الحلقة') || decoded.includes('episode')) return true;
    return false;
  };

  addedUrls.add(normUrl(targetUrl));

  // 1. Direct HTML Selectors for Season Links
  const containerSelectors = [
    '.related-anime', '.anime-seasons', '.seasons-list', '.related-series',
    '.related_posts', '.series-seasons', '.seasons', '.other-seasons',
    '#seasons', '.anime-relations', '.related-list', '.mowasem',
    '.related-content', '.related_anime', '.anime-parts', '.parts-list',
    '.series-parts', '.mowasem-list', '.seasons-container', '.related-box'
  ].join(', ');

  $(containerSelectors).find('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (isInvalidSeasonLink(href) || addedUrls.has(normUrl(href))) return;

    let title = $(a).find('h3, h4, h5, .title, .season-title, .name').first().text().trim() ||
                $(a).attr('title') || $(a).text().trim().replace(/\s+/g, ' ');

    if (!title || title.length < 2 || title.includes('الرئيسية')) return;
    let coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';
    if (coverUrl && coverUrl.includes('http')) {
      coverUrl = coverUrl.substring(coverUrl.indexOf('http'));
    }

    seasons.push({
      id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
      title: cleanSeasonTitle(title),
      url: href,
      coverUrl: coverUrl ? getProxiedUrl(coverUrl) : undefined,
      type: detectSeasonType(title)
    });
    addedUrls.add(normUrl(href));
  });

  // 2. Check headings for season keywords
  if (seasons.length === 0) {
    $('h1, h2, h3, h4, h5, h6, div, span, .widget-title, .title').each((_, el) => {
      const ownText = $(el).clone().children().remove().end().text().trim();
      if (
        ownText.includes('مواسم') || ownText.includes('المواسم') ||
        ownText.includes('أجزاء') || ownText.includes('الأجزاء') ||
        ownText.includes('سلاسل') || ownText.includes('مرتبطة') ||
        ownText.toLowerCase().includes('seasons') || ownText.toLowerCase().includes('related')
      ) {
        const parent = $(el).closest('div, section, ul, article, aside');
        parent.find('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          if (isInvalidSeasonLink(href) || addedUrls.has(normUrl(href))) return;

          let title = $(a).find('h3, h4, h5, .title, .season-title, .name').first().text().trim() ||
                      $(a).attr('title') || $(a).text().trim().replace(/\s+/g, ' ');

          if (!title || title.length < 2 || title.includes('الرئيسية') || title.includes('قائمة')) return;
          let coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';
          if (coverUrl && coverUrl.includes('http')) {
            coverUrl = coverUrl.substring(coverUrl.indexOf('http'));
          }

          seasons.push({
            id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
            title: cleanSeasonTitle(title),
            url: href,
            coverUrl: coverUrl ? getProxiedUrl(coverUrl) : undefined,
            type: detectSeasonType(title)
          });
          addedUrls.add(normUrl(href));
        });
      }
    });
  }

  // 3. Smart Search Enrichment if no or few seasons found directly in HTML
  if (seasons.length < 3 && animeTitle && animeTitle !== 'RISTO') {
    const keywords = extractSmartKeywords(animeTitle);
    for (const kw of keywords) {
      if (!kw || kw.length < 3) continue;
      try {
        const searchUrl = `https://ristoanime.me/?s=${encodeURIComponent(kw)}`;
        const res = await retryFetch(searchUrl);
        if (res.ok) {
          const html = await res.text();
          const $s = cheerio.load(html);

          $s('a[href*="/series/"]').each((_, a) => {
            const href = $s(a).attr('href') || '';
            if (isInvalidSeasonLink(href) || addedUrls.has(normUrl(href)) || href === 'https://ristoanime.me/series/') return;

            let title = $s(a).find('h3, h4, h5, .title, .name').first().text().trim() ||
                        $s(a).attr('title') || $s(a).text().trim().replace(/\s+/g, ' ');

            title = cleanSeasonTitle(title);
            if (!title || title.length < 3 || title.includes('الرئيسية') || title.includes('قائمة الأنمي')) return;
            if (!isStrictlyRelatedFranchise(animeTitle, title)) return;

            let coverUrl = $s(a).find('img').attr('src') || $s(a).find('img').attr('data-src') || '';
            if (coverUrl && coverUrl.includes('http')) {
              coverUrl = coverUrl.substring(coverUrl.indexOf('http'));
            }

            seasons.push({
              id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
              title,
              url: href,
              coverUrl: coverUrl ? getProxiedUrl(coverUrl) : undefined,
              type: detectSeasonType(title)
            });
            addedUrls.add(normUrl(href));
          });
        }
      } catch (err) {
        console.warn('[Anime Scraper] Season enrichment search error:', err);
      }
      if (seasons.length >= 2) break;
    }
  }

  return seasons;
}

export async function fetchAnimeDetails(animeUrl: string): Promise<Anime | null> {
  try {
    let targetUrl = animeUrl;
    if (targetUrl && (targetUrl.includes('http://') || targetUrl.includes('https://'))) {
      const httpIdx = targetUrl.indexOf('http://');
      const httpsIdx = targetUrl.indexOf('https://');
      let idx = -1;
      if (httpIdx !== -1 && httpsIdx !== -1) idx = Math.min(httpIdx, httpsIdx);
      else if (httpIdx !== -1) idx = httpIdx;
      else idx = httpsIdx;
      if (idx !== -1) targetUrl = targetUrl.substring(idx);
    } else if (targetUrl && !targetUrl.startsWith('http')) {
      const slug = targetUrl.replace('series-', '').replace('scr-witanime-', '').replace('scr-anime4up-', '');
      targetUrl = `https://ristoanime.me/series/${slug}/`;
    }

    if (targetUrl.includes('anime4up')) {
      try {
        const m = await sources.anime4up.parseMangaDetails(targetUrl);
        if (m && m.title) {
          return {
            id: m.id,
            title: m.title,
            coverUrl: getProxiedUrl(m.cover),
            rawCoverUrl: m.cover,
            description: m.description || 'لا يوجد ملخص متاح.',
            rating: 8.8,
            status: 'مستمر',
            categories: ['أنمي'],
            releaseYear: 2026,
            episodes: (m.chapters || []).map((ch, idx) => ({
              id: ch.id,
              animeId: m.id,
              title: ch.name || `الحلقة ${idx + 1}`,
              episodeNumber: parseEpisodeNumber(ch.name) || (idx + 1),
              servers: [],
              url: ch.url
            })),
            sourceUrl: targetUrl,
            sourceId: 'anime4up'
          };
        }
      } catch (e) {
        console.warn('[Anime Scraper] anime4up parseMangaDetails fallback:', e);
      }
    }

    let res = await retryFetch(targetUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    let text = await res.text();
    let $ = cheerio.load(text);

    // If this is an episode page instead of the anime details page,
    // let's locate the link to the full anime page so we can scrape the entire series details correctly.
    const isEpisodePage = $('ul.episodes-list, .List-Episodes, .episodes-card').length === 0 || targetUrl.includes('/episode/') || targetUrl.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9');
    
    if (isEpisodePage) {
      let foundAnimeUrl = '';
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if ((href.includes('/series/') || href.includes('/anime/')) && href.split('/').filter(Boolean).length > 3) {
          foundAnimeUrl = href;
          return false; // break
        }
      });

      if (foundAnimeUrl) {
        targetUrl = foundAnimeUrl;
        const resReal = await retryFetch(targetUrl);
        if (resReal.ok) {
          const textReal = await resReal.text();
          text = textReal;
          $ = cheerio.load(text);
        }
      }
    }

    let titleText = '';
    $('h1').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text !== 'RISTO' && text.length > titleText.length) {
        titleText = text;
      }
    });
    if (!titleText) {
      titleText = $('.title').first().text().trim();
    }
    
    // Attempt multiple selectors for the description / story to ensure we find it
    let storyText = $('.StoryArea, .anime-story, .story-text, .post-content').first().text().trim();
    storyText = storyText
      .replace(/قصة العمل\s*:/gi, '')
      .replace(/قصة الأنمي\s*:/gi, '')
      .replace(/قصة\s*:/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Parse details card info
    const statusText = $('.anime-status, .info-list li:contains("حالة")').text().trim().includes('مكتمل') ? 'مكتمل' : 'مستمر';
    
    // Parse categories / genres
    const categories: string[] = [];
    $('.anime-genres a, .genres-list a, .info-list li:contains("تصنيف") a').each((_, el) => {
      const cat = $(el).text().trim();
      if (cat && !categories.includes(cat)) categories.push(cat);
    });
    if (categories.length === 0) {
      categories.push('مغامرة', 'أكشن');
    }

    // Parse release year
    let releaseYear = 2025;
    const yearMatch = $('.info-list, .anime-info').text().match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) {
      releaseYear = parseInt(yearMatch[1]);
    }

    const episodes: Episode[] = [];
    const slug = targetUrl.split('/').filter(Boolean).pop() || '';
    const animeId = `series-${slug}`;

    // Select potential episode anchors specifically inside container blocks
    const episodeSelectors = [
      '.eplister a',
      '.episodes a',
      '.episode-list a',
      '.list-episodes a',
      '.episodes-container a',
      '.EpisodesList a',
      '.episodes-card-container a',
      '.episodes-list-content a',
      '.episodes-card-title a',
      '.MovieItem a',
      '.MvCv a'
    ].join(', ');

    $(episodeSelectors).each((idx, el) => {
      const epHref = $(el).attr('href') || '';
      if (!epHref) return; 
      if (epHref.includes('/series/') || epHref.includes('/anime/')) return; // skip series links
      if (epHref === targetUrl) return; // skip self link
      if (epHref.startsWith('#')) return; // skip anchors

      // Avoid duplicates
      if (episodes.some(e => e.url === epHref)) return;

      let epTitleText = $(el).find('h4').text().trim() || $(el).find('.episode-title').text().trim() || $(el).text().trim().replace(/\s+/g, ' ');
      if (!epTitleText) return;
      if (epTitleText.includes('جميع حلقات')) return; // skip related series links that might appear in related sections

      // Check if this link is noise (e.g. sidebar widget, unrelated category list, footer)
      if (isNoiseLink(el, $, slug)) return;

      const epNum = parseEpisodeNumber(epTitleText);
      const epId = `${idx}-${epHref.split('/').filter(Boolean).pop() || ''}`;

      episodes.push({
        id: epId,
        animeId,
        title: epTitleText || `الحلقة ${epNum}`,
        episodeNumber: epNum,
        servers: [],
        url: epHref
      });
    });

    // If no episodes found with container-specific selectors, try general a tags that contain episode indicators
    if (episodes.length === 0) {
      $('a').each((idx, el) => {
        const epHref = $(el).attr('href') || '';
        if (!epHref || epHref === targetUrl || epHref.includes('/series/') || epHref.startsWith('#')) return;
        
        let isEpisodeLink = false;
        if (epHref.includes('/episode/') || epHref.includes('/watch')) isEpisodeLink = true;
        try {
            const decoded = decodeURIComponent(epHref);
            if (decoded.includes('الحلقة') || decoded.includes('episode')) isEpisodeLink = true;
        } catch(e) {}
        
        let epTitleText = $(el).text().trim().replace(/\s+/g, ' ');
        if (epTitleText.includes('جميع حلقات')) return;
        if (!isEpisodeLink && !epTitleText.includes('الحلقة')) return;

        if (episodes.some(e => e.url === epHref)) return;

        // Check if this link is noise (e.g. sidebar widget, unrelated category list, footer)
        if (isNoiseLink(el, $, slug)) return;

        const epNum = parseEpisodeNumber(epTitleText);
        const epId = `gen-${idx}-${epHref.split('/').filter(Boolean).pop() || ''}`;

        episodes.push({
          id: epId,
          animeId,
          title: epTitleText || `الحلقة ${epNum}`,
          episodeNumber: epNum,
          servers: [],
          url: epHref
        });
      });
    }

    // Final cleaning and sorting
    let finalEpisodes = deduplicate(episodes);
    finalEpisodes = finalEpisodes.map(ep => {
      const extracted = extractNumber(ep.title);
      const epNum = (extracted !== null && !isNaN(extracted)) ? extracted : (ep.episodeNumber && !isNaN(ep.episodeNumber) ? ep.episodeNumber : 1);
      return {
        ...ep,
        episodeNumber: epNum
      };
    })
    .filter(e => typeof e.episodeNumber === 'number' && !isNaN(e.episodeNumber) && e.episodeNumber > 0 && e.episodeNumber <= 2500)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

    // --- GAP FILLING LOGIC FOR LONG ANIMES (e.g. One Piece, Detective Conan) ---
    // Only run gap-filling/probing if there are AT LEAST 2 episodes and max episode > 1
    if (finalEpisodes.length >= 2) {
      const origMinEp = finalEpisodes[0].episodeNumber;
      let origMaxEp = finalEpisodes[finalEpisodes.length - 1].episodeNumber;

      if (!isNaN(origMinEp) && !isNaN(origMaxEp) && origMaxEp > origMinEp && origMaxEp >= 2) {
        const startEp = 1;

        // Probe for newly released episodes beyond origMaxEp
        if (origMaxEp > 10) {
          const lastEp = finalEpisodes[finalEpisodes.length - 1];
          if (lastEp && lastEp.url && !lastEp.url.includes('NaN')) {
            const probedMax = await probeLatestEpisodes(lastEp.url, origMaxEp);
            if (probedMax > origMaxEp && !isNaN(probedMax)) {
              origMaxEp = probedMax;
            }
          }
        }

        const maxEp = origMaxEp;
        const existingMap = new Map(finalEpisodes.map(e => [e.episodeNumber, e]));

        // Select reference episode for pattern URL
        const refEp = finalEpisodes[finalEpisodes.length - 1] || finalEpisodes[0];
        const patternUrl = refEp.url;
        const epNumStr = refEp.episodeNumber.toString();
        let urlTemplate = '';

        if (patternUrl && !patternUrl.includes('NaN')) {
          if (patternUrl.includes(`-${epNumStr}-`)) {
            urlTemplate = patternUrl.replace(`-${epNumStr}-`, '-{EP}-');
          } else if (patternUrl.includes(`-${epNumStr}/`)) {
            urlTemplate = patternUrl.replace(`-${epNumStr}/`, '-{EP}/');
          } else if (patternUrl.includes(`/${epNumStr}/`)) {
            urlTemplate = patternUrl.replace(`/${epNumStr}/`, '/{EP}/');
          } else if (epNumStr.length >= 2) {
            const idx = patternUrl.lastIndexOf(epNumStr);
            if (idx !== -1) {
              urlTemplate = patternUrl.substring(0, idx) + '{EP}' + patternUrl.substring(idx + epNumStr.length);
            }
          }
        }

        let isValidTemplate = false;
        if (urlTemplate && !urlTemplate.includes('NaN')) {
          const checkEp = finalEpisodes[0];
          if (checkEp && checkEp.episodeNumber !== refEp.episodeNumber) {
            const testUrl = urlTemplate.replace('{EP}', checkEp.episodeNumber.toString());
            const checkSlug = checkEp.url.split('/').filter(Boolean).pop() || '';
            const testSlug = testUrl.split('/').filter(Boolean).pop() || '';
            if (checkSlug === testSlug || testUrl.replace('-hi-', '-') === checkEp.url.replace('-hi-', '-')) {
              isValidTemplate = true;
            }
          } else {
            isValidTemplate = true;
          }
        }

        if (isValidTemplate && urlTemplate) {
          const filled: Episode[] = [];
          for (let i = startEp; i <= maxEp; i++) {
            if (existingMap.has(i)) {
              filled.push(existingMap.get(i)!);
            } else {
              filled.push({
                id: `ep-filled-${i}-${slug}`,
                animeId,
                title: `الحلقة ${i}`,
                episodeNumber: i,
                servers: [],
                url: urlTemplate.replace('{EP}', i.toString())
              });
            }
          }
          finalEpisodes = filled;
        }
      }
    }
    // --------------------------------------------------------

    if (finalEpisodes.length === 0) {
      finalEpisodes.push({
        id: `ep-1-${slug}`,
        animeId,
        title: 'مشاهدة الفيلم / الحلقة 1',
        episodeNumber: 1,
        servers: [],
        url: targetUrl
      });
    }

    let rawCover = $('img').first().attr('src') || '';
    if (!rawCover || rawCover.includes('logo')) {
      const style = $('.Thumbnail .bg-image, .anime-poster, .poster').attr('data-style') || $('.Thumbnail .bg-image, .anime-poster, .poster').attr('style') || '';
      const bgMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (bgMatch) rawCover = bgMatch[1];
      if (!rawCover) {
          rawCover = $('.Thumbnail img, .anime-poster img').attr('src') || rawCover;
      }
    }
    const cleanFinalTitle = cleanAnimeTitle(titleText) || titleText || 'أنمي غير معروف';
    const relatedSeasons = await fetchRelatedSeasons($, cleanFinalTitle, targetUrl);

    return {
      id: `series-${slug}`,
      title: cleanFinalTitle,
      coverUrl: getProxiedUrl(rawCover),
      rawCoverUrl: rawCover,
      description: storyText || 'لا يوجد ملخص متاح لهذا الأنمي حالياً.',
      rating: 8.8,
      status: statusText,
      categories,
      releaseYear,
      episodes: finalEpisodes,
      sourceUrl: targetUrl,
      sourceId: 'witanime',
      relatedSeasons
    };
  } catch (err) {
    console.error('[Anime Scraper] fetchAnimeDetails failed:', err);
    return null;
  }
}

export async function fetchWatchServers(watchUrl: string): Promise<{ name: string; url: string }[]> {
  try {
    if (!watchUrl || watchUrl.includes('NaN') || watchUrl.includes('undefined') || watchUrl.includes('null')) {
      console.warn('[Anime Scraper] Invalid watchUrl passed to fetchWatchServers:', watchUrl);
      return [];
    }

    let urlsToTry = [watchUrl];
    if (!watchUrl.endsWith('/watch') && !watchUrl.endsWith('/watch/')) {
      urlsToTry.unshift(watchUrl.replace(/\/$/, '') + '/watch');
    }

    const servers: { name: string; url: string }[] = [];

    for (const urlCandidate of urlsToTry) {
      try {
        const res = await retryFetch(urlCandidate);
        if (!res.ok) continue;
        const text = await res.text();
        const $ = cheerio.load(text);

        $('li[data-watch], li[data-url], a[data-url]').each((_, el) => {
          let rawUrl = $(el).attr('data-watch') || $(el).attr('data-url') || '';
          if (!rawUrl) return;

          // Try to decode base64 if it is base64
          if (!rawUrl.startsWith('http') && rawUrl.length > 20 && !rawUrl.includes(' ')) {
            try {
              // Usually Witanime base64 encodes the iframe URL
              const decoded = Buffer.from(rawUrl, 'base64').toString('utf-8');
              if (decoded.startsWith('http')) {
                rawUrl = decoded;
              }
            } catch(e) {}
          }

          const serverText = $(el).text().trim();
          const cleanName = serverText.replace(/^\d+/, '').replace('سيرفر', 'سيرفر ').replace(/\s+/g, ' ').trim();

          if (!servers.some(s => s.url === rawUrl)) {
            servers.push({
              name: cleanName || `سيرفر ${servers.length + 1}`,
              url: rawUrl
            });
          }
        });

        $('iframe[src]').each((i, el) => {
          const src = $(el).attr('src') || '';
          if (src && !src.includes('facebook') && !src.includes('google') && !src.includes('twitter')) {
            if (!servers.some(s => s.url === src)) {
              servers.push({
                name: `سيرفر ${servers.length + 1}`,
                url: src
              });
            }
          }
        });

        if (servers.length > 0) {
          break; // Found servers, stop trying candidates
        }
      } catch (e) {
        console.warn('[Anime Scraper] Candidate failed:', urlCandidate, e);
      }
    }

    return servers;
  } catch (err) {
    console.error('[Anime Scraper] fetchWatchServers failed:', err);
    return [];
  }
}
