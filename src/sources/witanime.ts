import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage, CATEGORY_ENGLISH_MAP } from './types';
import { getUniqueId } from './generic';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://ristoanime.me';

function normalizeUrl(url: string, baseUrl: string): string {
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

function cleanText(txt: string): string {
  return txt.replace(/\s+/g, ' ').trim();
}

function getCoverFromElement($: cheerio.CheerioAPI, el: any): string {
  const img = $(el).find('img').first();
  if (img && img.length > 0) {
    const attrs = ['data-src', 'data-lazy-src', 'data-original', 'src', 'srcset'];
    for (const attr of attrs) {
      const val = img.attr(attr);
      if (val && !val.startsWith('data:image/svg') && !val.startsWith('data:image/gif')) {
        return val;
      }
    }
  }

  const style = $(el).find('.poster, .Thumbnail, [style*="background"]').attr('style') || $(el).attr('style') || '';
  const match = style.match(/url\(['"]?(.*?)['"]?\)/);
  return match ? match[1] : '';
}

export const witanimeSourceHandler: SourceHandler = {
  id: 'witanime',
  name: 'WitAnime',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    let url = `${BASE_URL}/series/`;
    let isGenreSearch = false;

    if (query && query.trim() !== '') {
      const trimmedQuery = query.trim();
      let genreSlug = '';
      
      for (const [key, slugs] of Object.entries(CATEGORY_ENGLISH_MAP)) {
        if (key.toLowerCase() === trimmedQuery.toLowerCase() || trimmedQuery.toLowerCase().includes(key.toLowerCase())) {
          genreSlug = slugs[0];
          break;
        }
      }

      if (genreSlug) {
        url = `${BASE_URL}/anime-genre/${genreSlug}/${page > 1 ? `page/${page}/` : ''}`;
        isGenreSearch = true;
      } else {
        url = `${BASE_URL}/${page > 1 ? `page/${page}/` : ''}?s=${encodeURIComponent(trimmedQuery)}`;
      }
    } else if (page > 1) {
      url = `${BASE_URL}/series/page/${page}/`;
    }

    let html = '';
    try {
      const response = await proxiedFetch(url);
      if (response.ok) {
        html = await response.text();
      }
    } catch (e) {
      console.error('[WitAnime] fetch error:', url, e);
    }

    if (isGenreSearch && (!html || html.length < 500)) {
      try {
        const fallbackUrl = `${BASE_URL}/?s=${encodeURIComponent(query!)}`;
        const res = await proxiedFetch(fallbackUrl);
        if (res.ok) html = await res.text();
      } catch (e) {}
    }

    if (!html) return [];

    const $ = cheerio.load(html);
    const animes: Manga[] = [];

    const cardSelectors = [
      '.MovieItem',
      '.animiyat',
      'a.CARTA',
      'a.bita9a-link',
      '.ABBIYAT',
      '.anime-card'
    ].join(', ');

    $(cardSelectors).each((_idx, el) => {
      const linkEl = $(el).is('a') ? $(el) : $(el).find('a[href]').first();
      const rawLink = linkEl.attr('href') || '';

      if (!rawLink || rawLink.includes('#') || rawLink.startsWith('javascript:')) return;
      if (rawLink.includes('/anime-genre/') || rawLink.includes('/tag/') || rawLink.includes('/category/')) return;

      const rawCoverUrl = getCoverFromElement($, el);
      let title = $(el).find('h4, h3, .title, .anime-title, .entry-title').first().text();
      if (!title) title = linkEl.attr('title') || $(el).find('img').first().attr('alt') || '';
      title = cleanText(title);

      if (
        title === 'الرئيسية' || 
        title === 'قائمة الأنمي' || 
        title.includes('التصفح حسب') || 
        title.includes('الصفحة الرئيسية')
      ) {
        return;
      }

      if (rawLink && title && title.length > 1) {
        const sourceUrl = normalizeUrl(rawLink, BASE_URL);
        const coverUrl = normalizeUrl(rawCoverUrl, BASE_URL);

        if (!animes.some(a => a.url === sourceUrl || a.title === title)) {
          animes.push({
            id: getUniqueId(sourceUrl),
            title,
            cover: coverUrl,
            url: sourceUrl,
          });
        }
      }
    });

    return animes;
  },

  async parseMangaDetails(animeUrl: string): Promise<Manga> {
    const response = await proxiedFetch(animeUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = cleanText($('h1.entry-title, h1').first().text()) || 'أنمي';
    const rawCover = $('.anime-poster img, .poster img').attr('src') || $('meta[property="og:image"]').attr('content') || '';
    const description = cleanText($('.StoryArea, .anime-story, .story-text, .post-content').text());

    const episodes: Chapter[] = [];
    const episodeSelectors = [
      'ul.episodes-list a',
      '.List-Episodes a',
      '.episodes-card a',
      'a[href*="/episode/"]',
      'a[href*="%d8%a7%d9%84%d8%ad%d9%82%d8%a9"]'
    ].join(', ');

    $(episodeSelectors).each((_idx, el) => {
      const episodeName = cleanText($(el).text());
      const episodeUrl = $(el).attr('href');

      if (episodeName && episodeUrl && !episodes.some(e => e.url === episodeUrl)) {
        episodes.push({
          id: getUniqueId(episodeUrl),
          name: episodeName,
          url: normalizeUrl(episodeUrl, BASE_URL),
        });
      }
    });

    return {
      id: getUniqueId(animeUrl),
      title,
      cover: normalizeUrl(rawCover, BASE_URL),
      description,
      url: animeUrl,
      chapters: episodes,
    };
  },

  async parseChapterPages(episodeUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(episodeUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const videoServers: ChapterPage[] = [];

    $('iframe[src]').each((_idx, el) => {
      const iframeSrc = $(el).attr('src');
      if (iframeSrc && !iframeSrc.includes('facebook') && !iframeSrc.includes('google')) {
        videoServers.push({
          url: normalizeUrl(iframeSrc, BASE_URL),
        });
      }
    });

    $('li[data-watch], a[data-url]').each((_idx, el) => {
      const dataUrl = $(el).attr('data-watch') || $(el).attr('data-url');
      if (dataUrl) {
        videoServers.push({
          url: normalizeUrl(dataUrl, BASE_URL),
        });
      }
    });

    return videoServers;
  },
};
