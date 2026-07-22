import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage, CATEGORY_ENGLISH_MAP } from './types';
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
    const englishSlug = query && CATEGORY_ENGLISH_MAP[query] ? CATEGORY_ENGLISH_MAP[query][0] : '';
    let url = `${BASE_URL}/manga/`;
    let isGenreSearch = false;

    if (query && englishSlug) {
      url = `${BASE_URL}/manga-genre/${englishSlug}/`;
      isGenreSearch = true;
    } else if (query) {
      url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    } else if (page > 1) {
      url = `${BASE_URL}/manga/page/${page}/`;
    }

    let response;
    let html = '';
    try {
      response = await proxiedFetch(url);
      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }
      html = await response.text();
    } catch (e) {
      if (isGenreSearch && englishSlug) {
        const altUrl = `${BASE_URL}/genre/${englishSlug}/`;
        try {
          response = await proxiedFetch(altUrl);
          if (response.ok) {
            html = await response.text();
            url = altUrl;
          } else {
            throw new Error(`Alt genre page failed with status ${response.status}`);
          }
        } catch (altErr) {
          const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(englishSlug)}&post_type=wp-manga`;
          try {
            response = await proxiedFetch(searchUrl);
            if (response.ok) {
              html = await response.text();
              url = searchUrl;
            } else {
              throw altErr;
            }
          } catch (searchErr) {
            const origSearchUrl = `${BASE_URL}/?s=${encodeURIComponent(query || '')}&post_type=wp-manga`;
            try {
              response = await proxiedFetch(origSearchUrl);
              if (response.ok) {
                html = await response.text();
                url = origSearchUrl;
              } else {
                throw searchErr;
              }
            } catch (origErr) {
              throw e;
            }
          }
        }
      } else {
        throw e;
      }
    }

    const $ = cheerio.load(html);
    const mangas: Manga[] = [];

    const addMangaItem = (el: any) => {
      const linkEl = $(el).find('a').first();
      const titleEl = $(el).find('span, h3, h4, h5, .post-title, a, b').first();
      const coverEl = $(el).find('img').first();

      const rawLink = linkEl.attr('href');
      const rawCoverUrl = coverEl.attr('src') || coverEl.attr('data-src') || coverEl.attr('data-lazy-src') || '';

      if (rawLink) {
        const sourceUrl = normalizeUrl(rawLink, BASE_URL);
        const coverUrl = rawCoverUrl ? normalizeUrl(rawCoverUrl, BASE_URL) : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300';
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
    };

    $('div.unit, .page-item-detail, .manga-entry, .col-6, div.col-md-6').each((_idx, el) => {
      addMangaItem(el);
    });

    if (mangas.length === 0) {
      $('a[href*="/manga/"], a[href*="/series/"]').each((_idx, el) => {
        const href = $(el).attr('href');
        if (href) {
          const sourceUrl = normalizeUrl(href, BASE_URL);
          const titleText = $(el).attr('title') || $(el).text().trim();
          if (titleText && titleText.length > 2) {
            const id = getUniqueId(sourceUrl);
            if (!mangas.some(m => m.id === id)) {
              mangas.push({
                id,
                title: titleText,
                cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
                url: sourceUrl
              });
            }
          }
        }
      });
    }

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
    let description = $('div.entry-content p, .wd-full .entry-content, .summary, .description, .post-content').text().trim().replace(/\s+/g, ' ');
    if (!description) description = $('meta[property="og:description"]').attr('content') || '';
    if (description.length > 500) description = description.substring(0, 500) + '...';

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
