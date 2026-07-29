import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage } from './types';
import { getUniqueId } from './generic';
import { proxiedFetch } from './fetch';

const PRIMARY_BASE_URL = 'https://eta.animerco.org';
const FALLBACK_BASE_URLS = ['https://animerco.net', 'https://ristoanime.me'];

function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  try {
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
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
  const style = $(el).find('.poster, .img-box, .Thumbnail, [style*="background"]').attr('style') || $(el).attr('style') || '';
  const match = style.match(/url\(['"]?(.*?)['"]?\)/);
  return match ? match[1] : '';
}

export const animercoSourceHandler: SourceHandler = {
  id: 'animerco',
  name: 'Animerco',
  lang: 'ar',
  baseUrl: PRIMARY_BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    const urlsToTry = [
      query
        ? `${PRIMARY_BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`
        : `${PRIMARY_BASE_URL}/animes/page/${page}/`,
      query
        ? `${FALLBACK_BASE_URLS[0]}/page/${page}/?s=${encodeURIComponent(query)}`
        : `${FALLBACK_BASE_URLS[0]}/`,
      query
        ? `${FALLBACK_BASE_URLS[1]}/${page > 1 ? `page/${page}/` : ''}?s=${encodeURIComponent(query)}`
        : `${FALLBACK_BASE_URLS[1]}/series/${page > 1 ? `page/${page}/` : ''}`
    ];

    let html = '';
    let usedBaseUrl = PRIMARY_BASE_URL;

    for (const url of urlsToTry) {
      try {
        const res = await proxiedFetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.includes('Just a moment...') && text.length > 1000) {
            html = text;
            usedBaseUrl = url.startsWith(FALLBACK_BASE_URLS[1]) ? FALLBACK_BASE_URLS[1] : url.startsWith(FALLBACK_BASE_URLS[0]) ? FALLBACK_BASE_URLS[0] : PRIMARY_BASE_URL;
            break;
          }
        }
      } catch (e) {
        console.warn('[Animerco Scraper] URL failed:', url, e);
      }
    }

    if (!html) return [];

    const $ = cheerio.load(html);
    const results: Manga[] = [];

    const cardSelectors = '.anime-card, .post-item, .item, .box-item, article, .MovieItem, .animiyat, a.CARTA, .bita9a-link';

    $(cardSelectors).each((_, el) => {
      const a = $(el).is('a') ? $(el) : $(el).find('a').first();
      const href = normalizeUrl(a.attr('href') || '', usedBaseUrl);
      if (!href || href === usedBaseUrl + '/' || href.includes('javascript:')) return;

      let title = cleanText($(el).find('h3, h4, .title, .anime-title, .entry-title').first().text() || a.text() || $(el).attr('title') || '');
      if (!title) title = cleanText($(el).find('img').first().attr('alt') || a.attr('title') || '');

      title = title
        .replace(/^قائمة الانمي.*?انمي\s+/i, 'انمي ')
        .replace(/مترجم\s+اونلاين/i, '')
        .replace(/مترجم\s+اون\s+لاين/i, '')
        .trim();

      if (!title || title === 'الرئيسية' || title.includes('التصفح حسب')) return;

      const cover = normalizeUrl(getCoverFromElement($, el), usedBaseUrl);

      if (!results.some(r => r.url === href || r.title === title)) {
        results.push({
          id: getUniqueId(href),
          title,
          cover,
          url: href,
          sourceId: 'animerco',
          description: `مشاهدة وتحميل ${title}`
        });
      }
    });

    return results;
  },

  async parseMangaDetails(url: string): Promise<Manga> {
    let res = await proxiedFetch(url);
    if (!res.ok) {
      // Fallback if needed
      const slug = url.replace(/\/$/, '').split('/').pop();
      const fallbackUrl = `${FALLBACK_BASE_URLS[1]}/anime/${slug}/`;
      res = await proxiedFetch(fallbackUrl);
    }

    if (!res.ok) throw new Error(`Animerco: Failed to fetch details (${res.status})`);
    
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = cleanText($('h1.entry-title, h1, .anime-title').first().text() || $('title').text());
    const cover = normalizeUrl(getCoverFromElement($, $('.anime-poster, .poster, .thumb, .single-poster').first()), PRIMARY_BASE_URL)
                  || normalizeUrl($('meta[property="og:image"]').attr('content') || '', PRIMARY_BASE_URL);

    const description = cleanText($('.anime-story, .story, .description, .entry-content, .StoryArea').first().text() || '');

    return {
      id: getUniqueId(url),
      title,
      cover,
      url,
      sourceId: 'animerco',
      description
    };
  },

  async parseMangaChapters(mangaUrl: string): Promise<Chapter[]> {
    let res = await proxiedFetch(mangaUrl);
    if (!res.ok) {
      const slug = mangaUrl.replace(/\/$/, '').split('/').pop();
      const fallbackUrl = `${FALLBACK_BASE_URLS[1]}/anime/${slug}/`;
      res = await proxiedFetch(fallbackUrl);
    }

    if (!res.ok) throw new Error(`Animerco: Failed to fetch episodes (${res.status})`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];

    $('.episodes-list a, .episodio a, a[href*="/episode/"], a[href*="/ep-"], .List-Episodes a, ul.episodes-list a').each((_, el) => {
      const href = normalizeUrl($(el).attr('href') || '', PRIMARY_BASE_URL);
      if (!href || href.includes('javascript:')) return;

      const title = cleanText($(el).find('span, h4, h3, .title').text() || $(el).text());
      if (!title) return;

      chapters.push({
        id: `ch-animerco-${getUniqueId(href)}`,
        name: title,
        url: href
      });
    });

    return chapters.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      return numB - numA; 
    });
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const res = await proxiedFetch(chapterUrl);
    if (!res.ok) throw new Error(`Animerco: Failed to fetch servers (${res.status})`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.includes('http')) {
        pages.push({ url: src });
      }
    });

    $('.server-list a, .servers a, ul.servers li a, #episode-servers li a, ul.episodes-list a').each((_, el) => {
       const src = $(el).attr('data-url') || $(el).attr('data-ep-url') || $(el).attr('href');
       if (src && src.includes('http') && src !== '#') {
         pages.push({ url: src });
       }
    });

    const uniquePages = Array.from(new Map(pages.map(p => [p.url, p])).values());
    return uniquePages;
  }
};
