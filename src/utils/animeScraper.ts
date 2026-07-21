import * as cheerio from 'cheerio';
import { proxiedFetch, getProxiedUrl } from '../sources/fetch';
import { extractNumber, cleanTitle, sortNumerically, deduplicate, validateItem, retryFetch } from './scraperUtils';

// Based on the user's provided description, we need these helpers
const ANIME_HOME_URL = 'https://witaanime.com/';
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
      url = ANIME_HOME_URL.replace(/\/$/, '') + `/page/${pageNum}/`;
    }
    const res = await retryFetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const text = await res.text();
    const $ = cheerio.load(text);

    const episodes: Anime[] = [];
    
    $('a.CARTA, a.bita9a-link, .MovieItem a, .animiyat a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href) return;
      
      let titleRaw = $(el).find('h4').text().trim() || $(el).find('.title').text().trim() || $(el).text().trim().replace(/\s+/g, ' ');
      if (!titleRaw) return;

      const imgEl = $(el).find('img').first();
      const rawCover = imgEl.attr('src') || imgEl.attr('data-src') || '';
      const coverUrl = getProxiedUrl(rawCover); 
      
      const epNum = parseEpisodeNumber(titleRaw);
      const animeTitle = extractAnimeTitleFromEpisodeTitle(titleRaw);
      const id = href.split('/').filter(Boolean).pop() || '';
      
      if (!episodes.some(item => item.id === id)) {
        const item: Anime = {
          id,
          title: animeTitle || titleRaw,
          coverUrl,
          rawCoverUrl: rawCover,
          description: `شاهد الحلقة ${epNum} من انمي ${animeTitle || 'هذا'} مترجم بجودة عالية.`,
          rating: 8.0,
          views: Math.floor(Math.random() * 5000) + 1000,
          status: 'مستمر',
          categories: ['اكشن', 'مغامرة'],
          releaseYear: new Date().getFullYear(),
          episodes: [
            { id, animeId: id, title: titleRaw || `الحلقة ${epNum}`, episodeNumber: epNum, servers: [], url: href }
          ],
          latestEpisode: `الحلقة ${epNum}`,
          sourceUrl: href,
          sourceId: 'witanime'
        };

        if (validateItem(item)) {
          episodes.push(item);
        }
      }
    });
    return episodes;
  } catch (err) {
    console.error('[Anime Scraper] fetchLatestEpisodes failed:', err);
    return [];
  }
}

export async function fetchLatestSeries(): Promise<Anime[]> {
  try {
    const res = await retryFetch(ANIME_HOME_URL.replace(/\/$/, '') + '/series/');
    const text = await res.text();
    const $ = cheerio.load(text);
    const seriesList: Anime[] = [];

    $('.MovieItem, .animiyat, .ABBIYAT').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      if (!href) return;
      
      const img = $(el).find('img');
      const altTitle = img.attr('alt') || '';
      const rawCover = img.attr('src') || img.attr('data-src') || '';
      const coverUrl = getProxiedUrl(rawCover);
      
      const titleRaw = $(el).find('h4').text().trim() || $(el).find('.title').text().trim() || a.text().trim();
      const isCompleted = titleRaw.includes('مكتمل');
      const cleanAnimeTitle = altTitle || cleanTitle(titleRaw);
      const slug = href.split('/').filter(Boolean).pop() || '';

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
    let searchUrl = `${SEARCH_BASE_URL}?s=${encodeURIComponent(query)}`;
    if (pageNum > 1) {
      searchUrl = `${SEARCH_BASE_URL}page/${pageNum}/?s=${encodeURIComponent(query)}`;
    }
    const res = await proxiedFetch(searchUrl);
    const text = await res.text();
    const $ = cheerio.load(text);
    const results: Anime[] = [];

    $('.MovieItem').each((_, el) => {
      const a = $(el).find('a');
      const href = a.attr('href') || '';
      if (!href) return;

      const titleRaw = $(el).find('.title h4').text().trim() || $(el).find('.title p').text().trim();
      const style = $(el).find('.poster').attr('style') || '';
      const rawCover = style.match(/url\(([^)]+)\)/)?.[1] || '';
      const coverUrl = getProxiedUrl(rawCover);
      const genre = $(el).find('.genre').text().trim() || 'عام';
      const yearStr = $(el).find('.year').text().trim();

      results.push({
        id: `series-${href.split('/').filter(Boolean).pop()}`,
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
    });
    return results;
  } catch (err) {
    return [];
  }
}

export async function fetchAnimeDetails(animeUrl: string): Promise<Anime | null> {
  try {
    let targetUrl = animeUrl;
    if (targetUrl && !targetUrl.startsWith('http')) {
      const slug = targetUrl.replace('series-', '');
      targetUrl = `https://witaanime.com/anime/${slug}/`;
    }
    let res = await retryFetch(targetUrl);
    let text = await res.text();
    let $ = cheerio.load(text);

    // If this is an episode page instead of the anime details page,
    // let's locate the link to the full anime page so we can scrape the entire series details correctly.
    if (targetUrl.includes('/episode/')) {
      let foundAnimeUrl = '';
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('/anime/') && !href.includes('/episode/')) {
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
      return {
        ...ep,
        episodeNumber: extracted !== null ? extracted : ep.episodeNumber
      };
    }).sort((a, b) => {
      // Sort ascending numerically by episode number
      return a.episodeNumber - b.episodeNumber;
    });

    const rawCover = $('img').first().attr('src') || '';
    return {
      id: `series-${slug}`,
      title: cleanAnimeTitle(titleText) || titleText || 'أنمي غير معروف',
      coverUrl: getProxiedUrl(rawCover),
      rawCoverUrl: rawCover,
      description: storyText || 'لا يوجد ملخص متاح لهذا الأنمي حالياً.',
      rating: 8.8,
      status: statusText,
      categories,
      releaseYear,
      episodes: finalEpisodes,
      sourceUrl: targetUrl,
      sourceId: 'witanime'
    };
  } catch (err) {
    console.error('[Anime Scraper] fetchAnimeDetails failed:', err);
    return null;
  }
}

export async function fetchWatchServers(watchUrl: string): Promise<{ name: string; url: string }[]> {
  try {
    let targetUrl = watchUrl;
    if (!targetUrl.endsWith('/watch') && !targetUrl.endsWith('/watch/')) {
      targetUrl = targetUrl.replace(/\/$/, '') + '/watch';
    }

    const res = await retryFetch(targetUrl);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const text = await res.text();
    const $ = cheerio.load(text);

    const servers: { name: string; url: string }[] = [];

    $('li[data-watch]').each((_, el) => {
      const url = $(el).attr('data-watch') || '';
      if (!url) return;

      const serverText = $(el).text().trim();
      const cleanName = serverText.replace(/^\d+/, '').replace('سيرفر', 'سيرفر ').replace(/\s+/g, ' ').trim();

      servers.push({
        name: cleanName || 'سيرفر مشاهدة',
        url
      });
    });

    if (servers.length === 0) {
      $('iframe').each((i, el) => {
        const src = $(el).attr('src') || '';
        if (src) {
          servers.push({
            name: `سيرفر رئيسي ${i + 1}`,
            url: src
          });
        }
      });
    }

    return servers;
  } catch (err) {
    console.error('[Anime Scraper] fetchWatchServers failed:', err);
    return [];
  }
}
