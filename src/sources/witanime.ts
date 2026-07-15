import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage } from './types';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://witanime.cam';

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

function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

// XOR decryption for episodes list
function decryptEpisodes(processedEpisodeData: string): any[] {
  try {
    const parts = processedEpisodeData.split('.');
    if (parts.length < 2) return [];

    // Use Buffer for Node environment or fallback to atob
    const payloadStr = typeof Buffer !== 'undefined' 
      ? Buffer.from(parts[0], 'base64').toString('binary')
      : atob(parts[0]);
    const keyStr = typeof Buffer !== 'undefined'
      ? Buffer.from(parts[1], 'base64').toString('binary')
      : atob(parts[1]);
    
    const payload = new Uint8Array(payloadStr.length);
    for (let i = 0; i < payloadStr.length; i++) payload[i] = payloadStr.charCodeAt(i);
    
    const key = new Uint8Array(keyStr.length);
    for (let i = 0; i < keyStr.length; i++) key[i] = keyStr.charCodeAt(i);

    const decryptedBytes = new Uint8Array(payload.length);
    for (let i = 0; i < payload.length; i++) {
      decryptedBytes[i] = payload[i] ^ key[i % key.length];
    }

    const decrypted = new TextDecoder().decode(decryptedBytes);

    // Find JSON boundaries
    const firstBracket = decrypted.indexOf('[');
    const lastBracket = decrypted.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const cleanJson = decrypted.substring(firstBracket, lastBracket + 1);
      return JSON.parse(cleanJson);
    }

    return JSON.parse(decrypted);
  } catch (err) {
    console.error('[WitAnime] Failed to decrypt episodes:', err);
    return [];
  }
}

// Decodes watch server URLs from registries
function getParameterOffset(configSettings: any): number {
  try {
    const indexKey = atob(configSettings.k);
    const index = parseInt(indexKey, 10);
    return configSettings.d[index];
  } catch (e) {
    return 0;
  }
}

function decodeServerUrl(resourceData: string, configSettings: any): string {
  try {
    let reversed = resourceData.split('').reverse().join('');
    reversed = reversed.replace(/[^A-Za-z0-9+/=]/g, '');
    
    const paramOffset = getParameterOffset(configSettings);
    
    let base64Decoded = '';
    try {
      base64Decoded = atob(reversed);
    } catch (e) {
      // Fallback: maybe it's not reversed or already valid base64
      base64Decoded = atob(resourceData.replace(/[^A-Za-z0-9+/=]/g, ''));
    }
    
    let decoded = base64Decoded;
    if (paramOffset > 0 && paramOffset < base64Decoded.length) {
      decoded = base64Decoded.slice(0, -paramOffset);
    }
    
    return decoded;
  } catch (err) {
    console.error('[WitAnime] Failed to decode server URL:', err);
    return '';
  }
}

export const witanimeSourceHandler: SourceHandler = {
  id: 'witanime',
  name: 'وايت أنمي (WitAnime)',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    // URL-encoded for /قائمة-الانمي/
    const listPath = '/%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D8%A7%D9%86%D9%85%D9%8A';
    let url = page > 1 ? `${BASE_URL}${listPath}/page/${page}/` : `${BASE_URL}${listPath}/`;
    
    if (query && query.trim() !== '') {
      // Search results don't have standard page/X/ pagination, they just return all results on one page
      url = `${BASE_URL}/?search_param=animes&s=${encodeURIComponent(query)}`;
    }

    try {
      const response = await proxiedFetch(url);
      if (!response.ok && response.status !== 403) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      const items: Manga[] = [];

      // Unified selector for both search and homepage to increase robustness
      $('.anime-card-container, .cat-post-thumbnail, .post-category-thumbnail, .content.category-posts .row > div, .cat-post-details, .post-item, .post-card, .hentry, .post, article').each((_, el) => {
        const container = $(el);
        
        // Find anchor
        const anchor = container.find('a').first().length 
          ? container.find('a').first() 
          : (container.find('.anime-card-title a').length ? container.find('.anime-card-title a') : container.parent().find('a').first());
        
        const href = anchor.attr('href') || '';
        
        if (!href || !href.includes('/anime/')) {
          return;
        }

        const cleanUrl = normalizeUrl(href, BASE_URL);
        const parts = cleanUrl.replace(/\/$/, '').split('/');
        const id = parts[parts.length - 1] || 'unknown';

        // Check if already added
        if (items.some(item => item.id === id)) {
          return;
        }

        // Find image
        const img = container.find('img').first();
        const cover = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('srcset') || img.attr('data-srcset') || '';

        // Find title
        let title = container.find('h2, h3, h4, .anime-card-title, .post-title, .entry-title').first().text().trim();
        if (!title) {
          title = anchor.text().trim() || img.attr('alt')?.trim() || id;
        }

        items.push({
          id,
          title,
          cover: normalizeUrl(cover, BASE_URL),
          url: cleanUrl,
          sourceId: 'witanime'
        });
      });

      return items;
    } catch (err) {
      console.error('[WitAnime] Failed to parse popular list:', err);
      return [];
    }
  },

  async parseMangaDetails(mangaUrl: string): Promise<Manga> {
    const response = await proxiedFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse Title
    let title = $('.anime-details-title h1, h1').first().text().trim();
    if (!title) {
      title = $('title').text().replace('- WitAnime', '').replace('جميع حلقات انمي', '').replace('مترجمة اون لاين', '').trim();
    }

    // Parse Cover
    let cover = $('.anime-poster img').first().attr('src') || $('.anime-poster img').first().attr('data-src') || '';
    if (!cover) {
      cover = $('meta[property="og:image"]').attr('content') || '';
    }

    // Parse Description
    let description = $('.anime-story').first().text().trim();
    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || 'لا يوجد قصة متاحة.';
    }

    const urlParts = mangaUrl.replace(/\/$/, '').split('/');
    const slug = urlParts[urlParts.length - 1];

    const chapters: Chapter[] = [];

    // Parse Episodes via encrypted inline variable
    const processedEpisodeDataMatch = html.match(/var\s+processedEpisodeData\s*=\s*'([^']+)'/);
    if (processedEpisodeDataMatch) {
      const rawData = processedEpisodeDataMatch[1];
      const decodedEpisodes = decryptEpisodes(rawData);
      
      decodedEpisodes.forEach(ep => {
        chapters.push({
          id: ep.number,
          name: `${ep.type || 'الحلقة'} ${ep.number}`,
          url: ep.url
        });
      });
    }

    // Fallback: search for episode links in HTML if encryption variables aren't present
    if (chapters.length === 0) {
      $('a[href*="/episode/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const cleanUrl = normalizeUrl(href, BASE_URL);
        const parts = cleanUrl.replace(/\/$/, '').split('/');
        const epSlug = parts[parts.length - 1];
        
        // Extract episode number from text or slug
        const match = epSlug.match(/episode-(\d+)/) || epSlug.match(/-(\d+)/) || $(el).text().match(/(\d+)/);
        const num = match ? match[1] : epSlug;

        if (!chapters.some(ch => ch.id === num)) {
          chapters.push({
            id: num,
            name: `الحلقة ${num}`,
            url: cleanUrl
          });
        }
      });
    }

    // Sort chapters ascending by episode number
    chapters.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));

    return {
      id: slug,
      title,
      cover: normalizeUrl(cover, BASE_URL),
      description,
      url: mangaUrl,
      chapters,
      sourceId: 'witanime'
    };
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    const zHMatch = html.match(/var\s+_zH\s*=\s*"([^"]+)"/);
    const zWMatch = html.match(/var\s+_zW\s*=\s*"([^"]+)"/);
    
    if (zHMatch && zWMatch) {
      try {
        const resourceRegistry = JSON.parse(base64ToUtf8(zHMatch[1]));
        const configRegistry = JSON.parse(base64ToUtf8(zWMatch[1]));
        
        $('.server-link').each((_, el) => {
          const idStr = $(el).attr('data-server-id') || '';
          const id = parseInt(idStr, 10);
          const name = $(el).find('.ser').text().trim() || $(el).text().trim() || `سيرفر ${id + 1}`;
          
          const resData = resourceRegistry[id];
          const confData = configRegistry[id];
          
          if (resData && confData) {
            let streamUrl = decodeServerUrl(resData, confData);
            if (streamUrl) {
              streamUrl = normalizeUrl(streamUrl, BASE_URL);
              // Store resolved URL and encode the server name in hash so the client can read it!
              const clientUrl = `${streamUrl}#${encodeURIComponent(name)}`;
              pages.push({ url: clientUrl });
            }
          }
        });
      } catch (err) {
        console.error('[WitAnime] Failed to parse stream registries:', err);
      }
    }

    // Fallback: If no registry was decoded, look for iframes
    if (pages.length === 0) {
      $('iframe').each((_, el) => {
        let src = $(el).attr('src') || '';
        if (src && !src.includes('ads') && !src.includes('analytics')) {
          src = normalizeUrl(src, BASE_URL);
          pages.push({ url: `${src}#سيرفر افتراضي` });
        }
      });
    }

    return pages;
  },
};
