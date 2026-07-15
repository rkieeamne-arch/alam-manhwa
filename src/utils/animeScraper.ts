import * as cheerio from 'cheerio';
import { proxiedFetch } from '../sources/fetch';
import { getProxiedUrl } from '../sources/fetch';

// Based on the user's provided description, we need these helpers
const ANIME_HOME_URL = 'https://witaanime.com/';
const SEARCH_BASE_URL = 'https://ristoanime.org/';

// Mock placeholders for the helper functions mentioned in the description
function parseEpisodeNumber(title: string): number {
  const match = title.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function cleanTitle(title: string): string {
  return title.replace(/مترجم|جودة عالية|شاهد|تحميل/gi, '').trim();
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

export async function fetchLatestEpisodes(): Promise<Anime[]> {
  try {
    const res = await proxiedFetch(ANIME_HOME_URL);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const text = await res.text();
    const $ = cheerio.load(text);

    const episodes: Anime[] = [];
    
    $('a.CARTA, a.bita9a-link').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href) return;
      
      const titleRaw = $(el).text().trim().replace(/\s+/g, ' ');
      const imgEl = $(el).find('img').first();
      const rawCover = imgEl.attr('src') || imgEl.attr('data-src') || '';
      const coverUrl = getProxiedUrl(rawCover); 
      
      const epNum = parseEpisodeNumber(titleRaw);
      const cleanAnimeTitle = cleanTitle(titleRaw.split(/الحلقة|الحلقه|Episode|Ep/i)[0]);
      const id = href.split('/').filter(Boolean).pop() || '';
      
      if (!episodes.some(item => item.id === id)) {
        episodes.push({
          id,
          title: cleanAnimeTitle || titleRaw,
          coverUrl,
          rawCoverUrl: rawCover,
          description: `شاهد الحلقة ${epNum} من انمي ${cleanAnimeTitle} مترجمة...`,
          rating: 8.0,
          views: Math.floor(Math.random() * 5000) + 1000,
          status: 'مستمر',
          categories: ['اكشن', 'مغامرة'],
          releaseYear: new Date().getFullYear(),
          episodes: [
            { id, animeId: id, title: `الحلقة ${epNum}`, episodeNumber: epNum, servers: [], url: href }
          ],
          latestEpisode: `الحلقة ${epNum}`,
          sourceUrl: href,
          sourceId: 'witanime'
        });
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
    const res = await proxiedFetch(ANIME_HOME_URL);
    const text = await res.text();
    const $ = cheerio.load(text);
    const seriesList: Anime[] = [];

    $('.animiyat, .ABBIYAT').each((_, el) => {
      const a = $(el).find('a');
      const href = a.attr('href') || '';
      const img = a.find('img');
      const altTitle = img.attr('alt') || '';
      const rawCover = img.attr('src') || img.attr('data-src') || '';
      const coverUrl = getProxiedUrl(rawCover);
      const rawText = a.text().trim();
      const isCompleted = rawText.includes('مكتمل');
      const cleanAnimeTitle = altTitle || cleanTitle(rawText);
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
    return [];
  }
}

export async function searchAnime(query: string): Promise<Anime[]> {
  if (!query || query.trim() === '') return [];
  try {
    const searchUrl = `${SEARCH_BASE_URL}?s=${encodeURIComponent(query)}`;
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
    const res = await proxiedFetch(animeUrl);
    const text = await res.text();
    const $ = cheerio.load(text);

    const titleText = $('h1').first().text().trim();
    const storyText = $('.StoryArea').text().trim().replace('قصة العمل :', '').trim();
    
    const episodes: Episode[] = [];
    const slug = animeUrl.split('/').filter(Boolean).pop() || '';
    const animeId = `series-${slug}`;
    $('.MovieItem, .EpisodesList a').each((idx, el) => {
      const a = $(el).find('a').length ? $(el).find('a').first() : $(el);
      const epHref = a.attr('href') || '';
      if (!epHref) return;

      const titleText = $(el).find('h4').text().trim() || a.text().trim();
      const epNum = parseEpisodeNumber(titleText);
      const epId = `${idx}-${epHref.split('/').filter(Boolean).pop() || ''}`;

      episodes.push({
        id: epId,
        animeId,
        title: `الحلقة ${epNum}`,
        episodeNumber: epNum,
        servers: [],
        url: epHref
      });
    });

    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

    const rawCover = $('img').first().attr('src') || '';
    return {
      id: `series-${animeUrl.split('/').filter(Boolean).pop()}`,
      title: cleanTitle(titleText) || titleText,
      coverUrl: getProxiedUrl(rawCover),
      rawCoverUrl: rawCover,
      description: storyText || 'لا يوجد ملخص متاح.',
      rating: 8.8,
      status: 'مستمر',
      categories: ['مغامرة', 'أكشن'],
      releaseYear: 2025,
      episodes,
      sourceUrl: animeUrl,
      sourceId: 'witanime'
    };
  } catch (err) {
    return null;
  }
}

export async function fetchWatchServers(watchUrl: string): Promise<{ name: string; url: string }[]> {
  try {
    let targetUrl = watchUrl;
    if (!targetUrl.endsWith('/watch') && !targetUrl.endsWith('/watch/')) {
      targetUrl = targetUrl.replace(/\/$/, '') + '/watch';
    }

    const res = await proxiedFetch(targetUrl);
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
