import { SourceHandler, Manga, Chapter, ChapterPage, CATEGORY_ENGLISH_MAP } from './types';
import { getUniqueId } from './generic';
import * as cheerio from 'cheerio';
import { proxiedFetch } from './fetch';

const BASE_URL = 'https://azorafly.com';

function getSlugTitle(url: string): string {
  try {
    const parts = url.replace(/\/$/, '').split('/');
    const slug = parts.pop() || '';
    return slug
      .split('-')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .filter(Boolean)
      .join(' ');
  } catch {
    return 'عمل مجهول';
  }
}

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

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // remove diacritics
    .trim();
}

export const azoraflySourceHandler: SourceHandler = {
  id: 'azorafly',
  name: 'Azora Manga',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    const list: Manga[] = [];

    // Try the API first!
    try {
      let apiRes;
      if (query && query.trim() !== '') {
        apiRes = await proxiedFetch(`https://api.azorafly.com/api/posts?searchTerm=${encodeURIComponent(query)}`);
      } else {
        apiRes = await proxiedFetch(`https://api.azorafly.com/api/posts?page=${page}`);
      }
      
      const textData = await apiRes.text();
      let apiData: any = null;
      try {
        apiData = JSON.parse(textData);
      } catch (e) {
        if (query && query.trim() !== '') {
          // Search fallback parameter
          apiRes = await proxiedFetch(`https://api.azorafly.com/api/posts?title=${encodeURIComponent(query)}`);
          apiData = await apiRes.json();
        }
      }

      if (apiData?.data && Array.isArray(apiData.data)) {
        for (const post of apiData.data) {
          const url = `${BASE_URL}/series/${post.slug}`;
          
          let latestChapter = '';
          if (post.chapters && post.chapters.length > 0) {
            const firstCh = post.chapters[0];
            if (firstCh) {
              latestChapter = `الفصل ${firstCh.number}`;
            }
          } else if (post._count?.chapters) {
            latestChapter = `الفصل ${post._count.chapters}`;
          }

          list.push({
            id: getUniqueId(url),
            title: post.postTitle || 'بدون عنوان',
            cover: post.featuredImage || 'https://images.unsplash.com/photo-1604276583-eef5d076aa5f?w=300',
            url: url,
            sourceId: 'azorafly',
            latestChapter
          });
        }
        if (list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn("Azorafly API failed, falling back to HTML parsing:", err);
    }

    const url = `${BASE_URL}/series?page=${page}`;
    const response = await proxiedFetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Narrow down to anchor elements that have images (manga cards)
    $('a').each((_, anchor) => {
      const $anchor = $(anchor);
      if ($anchor.find('img').length === 0) return; // Skip navigation links without images
      
      const href = $anchor.attr('href') || '';
      if (!href || href === '/series' || href === '/series/' || href.includes('?page=') || href.includes('/chapter')) return;
      if (!href.includes('/series') && !href.includes('/manga')) return;

      const normalizedHref = normalizeUrl(href, this.baseUrl);
      const uniqueId = getUniqueId(normalizedHref);

      if (list.some(item => item.id === uniqueId)) return;

      let title = $(anchor).attr('title') || $(anchor).attr('aria-label') || $(anchor).find('h3, h2, h4, h5, h6, .title, .name').first().text().trim() || $(anchor).text().replace(/\s+/g, ' ').trim() || 'بدون عنوان';
      
      // Sibling / Parent text traversal fallback
      if (!title || title.length < 2 || title === 'بدون عنوان' || title.includes('مشاهدة') || title.includes('تحميل')) {
        const parent = $(anchor).parent();
        title = parent.find('h3, h2, h4, h5, h6, .title, .name').first().text().trim() || 
                parent.text().replace(/\s+/g, ' ').trim() || 
                getSlugTitle(normalizedHref);
      }

      // Clean title from random badges
      title = title.replace(/(تحديث|مستمر|مكتمل|جديد|حصرية|مميزة|حصريه|مميزه)/gi, '').replace(/\s+/g, ' ').trim();

      let latestChapter = '';
      const chapText = $(anchor).find('.chapter, .ep, .epxs, .chapter-name, :contains("الفصل")').last().text() || $(anchor).parent().find('.chapter, .ep, .epxs, .chapter-name, :contains("الفصل")').last().text();
      const chapMatch = chapText.match(/(?:الفصل|ch|chapter)\s*([\d.]+)/i) || chapText.match(/\b(\d+)\b/);
      if (chapMatch) {
          latestChapter = `الفصل ${chapMatch[1]}`;
      }

      let cover = $(anchor).find('img').attr('src') || 
                  $(anchor).find('img').attr('data-src') || 
                  $(anchor).find('img').attr('data-lazy-src') || 
                  $(anchor).parent().find('img').attr('src') || 
                  $(anchor).parent().find('img').attr('data-src') || 
                  $(anchor).closest('div.bg-card, div.rounded-xl, .card, .item').find('img').attr('src') ||
                  $(anchor).closest('div.bg-card, div.rounded-xl, .card, .item').find('img').attr('data-src') ||
                  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300';

      if (cover && cover.startsWith('/')) {
        cover = normalizeUrl(cover, BASE_URL);
      }

      list.push({
          id: uniqueId,
          title,
          cover,
          url: normalizedHref,
          sourceId: 'azorafly',
          latestChapter
      });
    });

    const validList = list.filter(m => m.title && m.title.length >= 2 && m.title !== 'بدون عنوان' && m.title !== 'عمل مجهول');

    if (query && query.trim() !== '') {
      const isCategory = CATEGORY_ENGLISH_MAP[query] !== undefined;
      if (!isCategory) {
        const normalizedQuery = normalizeArabic(query);
        return validList.filter(m => {
          const normalizedTitle = normalizeArabic(m.title);
          if (normalizedTitle.includes(normalizedQuery)) return true;
          
          const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
          if (queryWords.length > 0 && queryWords.every(word => normalizedTitle.includes(word))) {
            return true;
          }
          return false;
        });
      }
    }

    return validList;
  },

  async parseMangaDetails(mangaUrl: string): Promise<Manga> {
    const pRes = await proxiedFetch(mangaUrl);
    const html = await pRes.text();

    const $first = cheerio.load(html);
    
    const title = $first('h1').text().trim();
    const description = $first('div[id*="description"]').text().trim();
    const cover = $first('img[src*="storage"]').first().attr('src') || '';

    let allChapters: Chapter[] = [];
    
    // First try extracting chapters from Astro JSON props
    const jsonPropsMatch = html.match(/&quot;initialChap&quot;:\[1,\[(.*?)\]\]\]/);
    const postIdMatch = html.match(/&quot;postId&quot;:\[0,(\d+)\]/);
    
    if (postIdMatch) {
      const postId = postIdMatch[1];
      try {
        const apiRes = await proxiedFetch(`https://api.azorafly.com/api/chapters?postId=${postId}`);
        const apiData = await apiRes.json();
        if (apiData?.data && Array.isArray(apiData.data)) {
          for (const ch of apiData.data) {
            const num = ch.number;
            const slug = ch.slug;
            const chapterTitle = ch.title;
            const fullUrl = `${BASE_URL}/series/${mangaUrl.split('/').pop()}/${slug}`;
            const id = getUniqueId(fullUrl);
            const name = chapterTitle ? `الفصل ${num} - ${chapterTitle}` : `الفصل ${num}`;
            const isLocked = ch.price > 0 || 
                             ch.coins > 0 || 
                             ch.price_coins > 0 || 
                             ch.isPremium === true || 
                             ch.is_premium === true || 
                             ch.type === 'premium' || 
                             (chapterTitle && (chapterTitle.includes('مدفوع') || chapterTitle.includes('VIP') || chapterTitle.includes('vip') || chapterTitle.includes('بريميوم')));
            if (!allChapters.some(c => c.id === id)) {
              allChapters.push({ id, name, url: fullUrl, isLocked: !!isLocked });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch Azorafly chapters from API", err);
      }
    }
    
    if (allChapters.length === 0 && jsonPropsMatch) {
      const inner = jsonPropsMatch[1];
      // Extract number, slug, title
      const regex = /&quot;number&quot;:\[0,([0-9.]+)\](.*?)&quot;slug&quot;:\[0,&quot;([^&]+)&quot;\](.*?)&quot;title&quot;:\[0,&quot;([^&]*)&quot;\]/g;
      let m;
      while ((m = regex.exec(inner)) !== null) {
        const num = m[1];
        const slug = m[3];
        const chapterTitle = m[5].replace(/\\&quot;/g, '"');
        const fullUrl = `${BASE_URL}/series/${mangaUrl.split('/').pop()}/${slug}`;
        const id = getUniqueId(fullUrl);
        const name = chapterTitle ? `الفصل ${num} - ${chapterTitle}` : `الفصل ${num}`;
        const isLocked = chapterTitle && (chapterTitle.includes('مدفوع') || chapterTitle.includes('VIP') || chapterTitle.includes('vip') || chapterTitle.includes('بريميوم'));
        if (!allChapters.some(c => c.id === id)) {
          allChapters.push({ id, name, url: fullUrl, isLocked: !!isLocked });
        }
      }
    } 
    
    if (allChapters.length === 0) {
      // More aggressive fallback: find all links with hrefs containing 'chapter' or 'الفصل' in text
      $first('a').each((_, el) => {
        const href = $first(el).attr('href');
        const text = $first(el).text().trim();
        if (href && (href.toLowerCase().includes('chapter') || text.includes('الفصل'))) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          const name = text.replace(/\s+/g, ' ').trim() || 'فصل';
          const id = getUniqueId(fullUrl);
          
          if (!allChapters.some(c => c.id === id)) {
            allChapters.push({ id, name, url: fullUrl, isLocked: false });
          }
        }
      });
    }

    return {
      id: getUniqueId(mangaUrl),
      title,
      description,
      cover,
      url: mangaUrl,
      chapters: allChapters
    };
  },

  async parseMangaChapters(mangaUrl: string, page: number): Promise<Chapter[]> {
    // Azorafly might use an API for pagination, but if we don't know it, we just return empty
    // OR we could try fetching ?page=X if it server-renders the props
    const pageUrl = page === 1 ? mangaUrl : `${mangaUrl}?page=${page}`;
    const pRes = await proxiedFetch(pageUrl);
    const html = await pRes.text();
    const $ = cheerio.load(html);
    
    const pageChapters: Chapter[] = [];
    
    const jsonPropsMatch = html.match(/&quot;initialChap&quot;:\[1,\[(.*?)\]\]\]/);
    const postIdMatch = html.match(/&quot;postId&quot;:\[0,(\d+)\]/);
    
    if (postIdMatch) {
      const postId = postIdMatch[1];
      try {
        const apiRes = await proxiedFetch(`https://api.azorafly.com/api/chapters?postId=${postId}`);
        const apiData = await apiRes.json();
        if (apiData?.data && Array.isArray(apiData.data)) {
          for (const ch of apiData.data) {
            const num = ch.number;
            const slug = ch.slug;
            const chapterTitle = ch.title;
            const fullUrl = `${BASE_URL}/series/${mangaUrl.split('/').pop()}/${slug}`;
            const id = getUniqueId(fullUrl);
            const name = chapterTitle ? `الفصل ${num} - ${chapterTitle}` : `الفصل ${num}`;
            if (!pageChapters.some(c => c.id === id)) {
              pageChapters.push({ id, name, url: fullUrl });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch Azorafly chapters from API in parseMangaChapters", err);
      }
    }

    if (pageChapters.length === 0 && jsonPropsMatch) {
      const inner = jsonPropsMatch[1];
      const regex = /&quot;number&quot;:\[0,([0-9.]+)\](.*?)&quot;slug&quot;:\[0,&quot;([^&]+)&quot;\](.*?)&quot;title&quot;:\[0,&quot;([^&]*)&quot;\]/g;
      let m;
      while ((m = regex.exec(inner)) !== null) {
        const num = m[1];
        const slug = m[3];
        const chapterTitle = m[5].replace(/\\&quot;/g, '"');
        const fullUrl = `${BASE_URL}/series/${mangaUrl.split('/').pop()}/${slug}`;
        const id = getUniqueId(fullUrl);
        const name = chapterTitle ? `الفصل ${num} - ${chapterTitle}` : `الفصل ${num}`;
        if (!pageChapters.some(c => c.id === id)) {
          pageChapters.push({ id, name, url: fullUrl });
        }
      }
    } 
    
    if (pageChapters.length === 0) {
      $('a[href*="/chapter-"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          let nameText = $(el).text().replace(/\s+/g, ' ').trim();
          const match = nameText.match(/الفصل\s*[\d.]+/);
          const name = match ? match[0] : nameText || 'فصل مجهول';
          const id = getUniqueId(fullUrl);
          if (!pageChapters.some(c => c.id === id)) {
            pageChapters.push({ id, name, url: fullUrl });
          }
        }
      });
    }
    return pageChapters;
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pagesSet = new Set<string>();

    $('img[data-reader-page-image], .comic-images-wrapper img, .reader-mode-strip img, article img').each((_, img) => {
      const rawImgUrl = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-reader-page-image') || '';
      const cleanImgUrl = normalizeUrl(rawImgUrl, this.baseUrl);
      if (cleanImgUrl && cleanImgUrl.startsWith('http') && !cleanImgUrl.includes('logo') && !cleanImgUrl.includes('avatar') && !cleanImgUrl.includes('emote')) {
        pagesSet.add(cleanImgUrl);
      }
    });

    const regex = /https:\/\/storage\.azorafly\.com\/upload\/series\/[^\s"']+/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      let url = match[0].replace(/[\\'">\)]+$/, '');
      if (url.includes('/page-') || url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) {
        pagesSet.add(url);
      }
    }

    const regexAlt = /https:\/\/storage\.azorafly\.com\/[0-9]{4}\/[^\s"']+/gi;
    while ((match = regexAlt.exec(html)) !== null) {
      let url = match[0].replace(/[\\'">\)]+$/, '');
      if (url.includes('.webp') || url.includes('.jpg')) {
        pagesSet.add(url);
      }
    }

    return Array.from(pagesSet).map(url => ({ url }));
  }
};
