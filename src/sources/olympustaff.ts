import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage } from './types';
import { getUniqueId } from './generic';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://olympustaff.com';

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // remove diacritics
    .trim();
}

export const olympusStaffSource: SourceHandler = {
  id: 'olympustaff',
  name: 'Olympus Scanlation',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parseMangaDetails(mangaUrl: string): Promise<Manga> {
    const response = await proxiedFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim();
    const cover = $('img.card-img-top').attr('src') || '';
    const description = $('p.text-white.text-justify').text().trim();

    let allChapters: Chapter[] = [];
    const pRes = await proxiedFetch(mangaUrl);
    const pHtml = await pRes.text();
    const $p = cheerio.load(pHtml);
    
    $p('a').each((_, el) => {
      const href = $p(el).attr('href');
      const text = $p(el).text().trim().replace(/\s+/g, ' ');
      
      // Look for a more specific structure if possible, but keep it robust
      if (href && (text.includes('الفصل') || href.toLowerCase().includes('/chapter'))) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const id = getUniqueId(fullUrl);
        
        // Clean title: try to extract chapter number/name more specifically
        const nameMatch = text.match(/(الفصل\s*[\d.]+|الفصل\s*[^\s]+|\d+)/i);
        const name = nameMatch ? nameMatch[0] : text;
        
        const isLocked = text.includes('مدفوع') || 
                         text.includes('مغلق') || 
                         text.includes('VIP') || 
                         $p(el).find('.fa-lock, i.lock, svg[class*="lock"]').length > 0;
        
        if (!allChapters.some(c => c.id === id)) {
          allChapters.push({ id, name, url: fullUrl, isLocked: !!isLocked });
        }
      }
    });

    return {
      id: getUniqueId(mangaUrl),
      title: title || 'عمل مجهول',
      cover: cover ? (cover.startsWith('/') ? `${BASE_URL}${cover}` : cover) : '',
      description: description || 'لا يوجد ملخص متوفر.',
      url: mangaUrl,
      chapters: allChapters
    };
  },

  async parseMangaChapters(mangaUrl: string, page: number): Promise<Chapter[]> {
    const pageUrl = page === 1 ? mangaUrl : `${mangaUrl}?page=${page}`;
    const pRes = await proxiedFetch(pageUrl);
    const pHtml = await pRes.text();
    const $p = cheerio.load(pHtml);
    
    const pageChapters: Chapter[] = [];
    $p('a').each((_, el) => {
      const href = $p(el).attr('href');
      const text = $p(el).text().trim().replace(/\s+/g, ' ');
      
      if (href && (text.includes('الفصل') || href.toLowerCase().includes('/chapter'))) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const id = getUniqueId(fullUrl);
        
        // Clean title: try to extract chapter number/name more specifically
        const nameMatch = text.match(/(الفصل\s*[\d.]+|الفصل\s*[^\s]+|\d+)/i);
        const name = nameMatch ? nameMatch[0] : text;
        
        const isLocked = text.includes('مدفوع') || 
                         text.includes('مغلق') || 
                         text.includes('VIP') || 
                         text.includes('vip') || 
                         text.includes('بريميوم') || 
                         $p(el).find('.fa-lock, i.lock, svg[class*="lock"], svg[class*="coin"]').length > 0 || 
                         $p(el).parent().find('.fa-lock, i.lock, svg[class*="lock"], svg[class*="coin"]').length > 0;
        
        if (!pageChapters.some(c => c.id === id)) {
          pageChapters.push({ id, name: name || 'فصل', url: fullUrl, isLocked: !!isLocked });
        }
      }
    });
    return pageChapters;
  },

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    if (query && query.trim() !== '') {
      try {
        const searchUrl = `${BASE_URL}/ajax/search?keyword=${encodeURIComponent(query)}`;
        const response = await proxiedFetch(searchUrl);
        const html = await response.text();
        const $ = cheerio.load(html);
        const results: Manga[] = [];
        
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          const title = $(el).find('h4').text().trim() || $(el).attr('title')?.trim() || '';
          const coverEl = $(el).find('img').first();
          const cover = coverEl.attr('src') || coverEl.attr('data-src') || coverEl.attr('data-lazy-src') || '';
          
          if (href && title) {
            const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
            const uniqueId = getUniqueId(fullUrl);
            if (fullUrl.includes('/series/') && !results.some(m => m.id === uniqueId)) {
              results.push({
                id: uniqueId,
                title,
                cover: cover ? (cover.startsWith('/') ? `${BASE_URL}${cover}` : cover) : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
                url: fullUrl,
                sourceId: 'olympustaff'
              });
            }
          }
        });
        
        if (results.length > 0) {
          return results;
        }
      } catch (err) {
        console.error("Olympus AJAX search failed, falling back", err);
      }
    }

    const url = query ? `${BASE_URL}/series?search=${query}&page=${page}` : `${BASE_URL}/series?page=${page}`;
    const response = await proxiedFetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const mangas: Manga[] = [];

    // Try multiple selectors for the grid items
    $('.col-6, .card, .series-card, div.mb-3, .bs, .bsx').each((_, el) => {
      const linkEl = $(el).find('a[href*="/series/"]').first();
      if (linkEl.length === 0) return;

      const title = linkEl.text().trim() || $(el).find('h5, h6, .card-title, .title').text().trim();
      const link = linkEl.attr('href');
      const coverEl = $(el).find('img').first();
      const cover = coverEl.attr('src') || coverEl.attr('data-src') || coverEl.attr('data-lazy-src');
      
      if (title && link && cover) {
        const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
        const uniqueId = getUniqueId(fullUrl);
        // Ensure it's a series link and not already in the list
        if (!fullUrl.includes('/series/') || mangas.some(m => m.id === uniqueId)) return;

        mangas.push({
          id: uniqueId,
          title,
          cover: cover.startsWith('/') ? `${BASE_URL}${cover}` : cover,
          url: fullUrl,
          sourceId: 'olympustaff'
        });
      }
    });

    // Fallback if no items found
    if (mangas.length === 0) {
      $('a[href*="/series/"]').each((_, anchor) => {
        if (mangas.length >= 30) return;
        const href = $(anchor).attr('href') || '';
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        
        // Skip some common non-manga links
        if (fullUrl === `${BASE_URL}/series` || fullUrl === `${BASE_URL}/series/` || fullUrl.endsWith('/series')) return;
        const uniqueId = getUniqueId(fullUrl);
        if (mangas.some(m => m.id === uniqueId)) return;
        
        const title = $(anchor).text().trim() || $(anchor).attr('title')?.trim();
        if (!title || title.length < 2) return;

        mangas.push({
          id: uniqueId,
          title,
          cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
          url: fullUrl,
          sourceId: 'olympustaff'
        });
      });
    }

    if (query && query.trim() !== '') {
      const normalizedQuery = normalizeArabic(query);
      return mangas.filter(m => {
        const normalizedTitle = normalizeArabic(m.title);
        if (normalizedTitle.includes(normalizedQuery)) return true;
        
        // Split and match partial words
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
        if (queryWords.length > 0 && queryWords.every(word => normalizedTitle.includes(word))) {
          return true;
        }
        return false;
      });
    }

    return mangas;
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];
    
    // Madara and custom theme selectors
    $('div.page-break img, .wp-manga-chapter-img, .reader-area img, .comic-images img, article img').each((_, el) => {
      const url = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (url && !url.includes('logo') && !url.includes('avatar') && !url.includes('emote')) {
        pages.push({ url: url.startsWith('/') ? `${BASE_URL}${url}` : url });
      }
    });

    // Regex fallback for high-quality images if hidden in scripts
    if (pages.length === 0) {
      const regex = /"url":"(https:\/\/[^"]+\.(jpg|png|webp|jpeg))"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        pages.push({ url: match[1].replace(/\\/g, '') });
      }
    }

    return pages;
  }
};
