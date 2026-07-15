import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage } from './types';
import { getUniqueId } from './generic';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://w1.anime4up.rest';

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

export const anime4upSourceHandler: SourceHandler = {
  id: 'anime4up',
  name: 'Anime4Up',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    let url = `${BASE_URL}/home8/`;
    if (query) {
      url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    } else if (page > 1) {
      url = `${BASE_URL}/home8/`;
    }

    const response = await proxiedFetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const animes: Manga[] = [];

    $('div.anime-card-container, .last-episodes .anime-card').each((_idx, el) => {
      const linkEl = $(el).find('a').first();
      const titleEl = $(el).find('.anime-title, .title').first();
      const coverEl = $(el).find('img').first();

      const rawLink = linkEl.attr('href');
      const rawCoverUrl = coverEl.attr('src') || coverEl.attr('data-src') || '';

      if (rawLink && titleEl.length > 0 && rawCoverUrl) {
        const sourceUrl = normalizeUrl(rawLink, BASE_URL);
        const coverUrl = normalizeUrl(rawCoverUrl, BASE_URL);
        const title = titleEl.text().trim();

        animes.push({
          id: getUniqueId(sourceUrl),
          title,
          cover: coverUrl,
          url: sourceUrl,
        });
      }
    });
    return animes;
  },

  async parseMangaDetails(animeUrl: string): Promise<Manga> {
    const response = await proxiedFetch(animeUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, .anime-details .title').text().trim();
    const cover = $('div.anime-thumbnail img, .anime-poster img').attr('src') || $('meta[property="og:image"]').attr('content') || '';
    const description = $('div.anime-story p, .anime-details .story').text().trim();

    const episodes: Chapter[] = [];
    $('ul.episodes-list li a, .episodes-block .episode-item a').each((_idx, el) => {
      const episodeName = $(el).text().trim();
      const episodeUrl = $(el).attr('href');

      if (episodeName && episodeUrl) {
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
      cover: normalizeUrl(cover, BASE_URL),
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

    $('div.watch-servers iframe, .video-player iframe').each((_idx, el) => {
      const iframeSrc = $(el).attr('src');
      if (iframeSrc) {
        videoServers.push({
          url: normalizeUrl(iframeSrc, BASE_URL),
        });
      }
    });

    $('div.watch-servers a[data-url], .video-player a[data-url]').each((_idx, el) => {
      const dataUrl = $(el).attr('data-url');
      if (dataUrl) {
        videoServers.push({
          url: normalizeUrl(dataUrl, BASE_URL),
        });
      }
    });

    return videoServers;
  },
};
