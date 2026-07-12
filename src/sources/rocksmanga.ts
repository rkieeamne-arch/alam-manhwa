import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage } from './types';
import { getUniqueId } from './generic';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://rocksmanga.com';

function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  try {
    if (url.startsWith('//')) {
      return 'https://' + url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return new URL(url, baseUrl).href;
  } catch (e) {
    return url;
  }
}

export const rocksMangaSourceHandler: SourceHandler = {
  id: 'rocksmanga',
  name: 'Rocks Manga',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    let url = `${BASE_URL}/manga/`;
    if (query) {
      url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    } else if (page > 1) {
      url = `${BASE_URL}/manga/page/${page}/`;
    }

    const response = await proxiedFetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const mangas: Manga[] = [];

    $('div.unit').each((_idx, el) => {
      const linkEl = $(el).find('a').first();
      const titleEl = $(el).find('span').first();
      const coverEl = $(el).find('img').first();

      const rawLink = linkEl.attr('href');
      const rawCoverUrl = coverEl.attr('src') || coverEl.attr('data-src') || coverEl.attr('data-lazy-src') || '';

      if (rawLink && rawCoverUrl) {
        const sourceUrl = normalizeUrl(rawLink, BASE_URL);
        const coverUrl = normalizeUrl(rawCoverUrl, BASE_URL);
        const title = titleEl.text().trim() || $(el).find('b').text().trim() || 'مانجا';

        const id = getUniqueId(sourceUrl);
        if (id && !mangas.some(m => m.id === id)) {
          mangas.push({
            id,
            title,
            cover: coverUrl,
            url: sourceUrl,
          });
        }
      }
    });
    return mangas;
  },

  async parseMangaDetails(mangaUrl: string): Promise<Manga> {
    const response = await proxiedFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, .series-title, h1').first().text().trim() || 'روكس مانجا';
    const cover = $('div.thumb img, .infox img, .poster img').first().attr('src') || 
                  $('div.thumb img, .infox img, .poster img').first().attr('data-src') ||
                  $('meta[property="og:image"]').attr('content') || '';
    const description = $('div.entry-content p, .wd-full .entry-content, .summary').text().trim();

    const chapters: Chapter[] = [];
    $('ul.scroll-sm li.item, .scroll-sm li, ul.cl li, .eplister li').each((_idx, el) => {
      const chapterLink = $(el).find('a').first();
      const chapterName = chapterLink.find('.chapternum, .lchx').text().trim() || chapterLink.text().trim().replace(/\s+/g, ' ');
      const chapterUrl = chapterLink.attr('href');

      if (chapterName && chapterUrl) {
        chapters.push({
          id: getUniqueId(chapterUrl),
          name: chapterName,
          url: normalizeUrl(chapterUrl, BASE_URL),
        });
      }
    });

    return {
      id: getUniqueId(mangaUrl),
      title,
      cover: normalizeUrl(cover, BASE_URL),
      description,
      url: mangaUrl,
      chapters: chapters.reverse(), // List chapters oldest-to-newest
    };
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $('img.preload-image, div#readerarea img, .entry-content img, .read-container img').each((_idx, el) => {
      const imageUrl = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('rocks-logo')) {
        pages.push({
          url: normalizeUrl(imageUrl, BASE_URL),
        });
      }
    });
    return pages;
  },
};
