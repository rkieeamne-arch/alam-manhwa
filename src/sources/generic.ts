import * as cheerio from 'cheerio';
import { Manga, Chapter, ChapterPage, SourceHandler, CATEGORY_ENGLISH_MAP } from './types';
import { proxiedFetch } from './fetch';
import { ScraperSource } from '../types';

export function getUniqueId(url: string): string {
  if (!url) return 'unknown-' + Math.random().toString(36).substring(7);
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
    const slug = path.substring(path.lastIndexOf('/') + 1) || 'manga';
    
    // Normalize URL for hash (remove trailing slash to avoid duplicate IDs for same chapter)
    const urlForHash = url.replace(/\/$/, '');
    
    // Use a safe simple hash instead of btoa which fails on Unicode
    let hash = 0;
    for (let i = 0; i < urlForHash.length; i++) {
      const char = urlForHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${slug}-${Math.abs(hash).toString(36).substring(0, 6)}`;
  } catch (e) {
    return `unknown-${Math.random().toString(36).substring(0, 6)}`;
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

export const genericSourceHandler: SourceHandler = {
  id: 'generic',
  name: 'Generic Scraper',
  lang: 'en',
  baseUrl: '',

  async parsePopularList(page: number = 1, query?: string, source?: ScraperSource): Promise<Manga[]> {
    if (!source) {
      console.warn('Generic parsePopularList called without source configuration.');
      return [];
    }

    // Attempt to build URL
    const baseUrl = source.baseUrl.replace(/\/$/, '');
    const englishSlug = query && CATEGORY_ENGLISH_MAP[query] ? CATEGORY_ENGLISH_MAP[query][0] : '';
    let url = '';
    let isGenreSearch = false;

    if (query && englishSlug) {
      url = `${baseUrl}/manga-genre/${englishSlug}/`;
      isGenreSearch = true;
    } else if (query) {
      url = `${baseUrl}/?s=${encodeURIComponent(query)}`;
    } else {
      url = `${baseUrl}${source.popularPath?.startsWith('/') ? source.popularPath : '/' + (source.popularPath || '')}`;
    }
    
    // Add page if > 1 with multiple patterns (some sites use ?paged=X, some use /page/X/)
    if (page > 1) {
      if (url.includes('?')) {
        url += `&paged=${page}&page=${page}&p=${page}`; // Try common query params
      } else {
        url += `/page/${page}/`;
      }
    }

    let html = '';
    try {
      console.log(`[Scraper] Fetching popular list from: ${url}`);
      const response = await proxiedFetch(url);
      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }
      html = await response.text();
    } catch (e) {
      if (isGenreSearch && englishSlug) {
        const altUrl = `${baseUrl}/genre/${englishSlug}/`;
        console.log(`[Scraper] Retrying with alternative genre URL: ${altUrl}`);
        try {
          const response = await proxiedFetch(altUrl);
          if (response.ok) {
            html = await response.text();
            url = altUrl;
          } else {
            throw new Error(`Alt genre page failed with status ${response.status}`);
          }
        } catch (altErr) {
          const searchUrl = `${baseUrl}/?s=${encodeURIComponent(englishSlug)}&post_type=wp-manga`;
          console.log(`[Scraper] Retrying with search URL: ${searchUrl}`);
          try {
            const response = await proxiedFetch(searchUrl);
            if (response.ok) {
              html = await response.text();
              url = searchUrl;
            } else {
              throw altErr;
            }
          } catch (searchErr) {
            const origSearchUrl = `${baseUrl}/?s=${encodeURIComponent(query || '')}&post_type=wp-manga`;
            console.log(`[Scraper] Last resort search URL: ${origSearchUrl}`);
            try {
              const response = await proxiedFetch(origSearchUrl);
              if (response.ok) {
                html = await response.text();
                url = origSearchUrl;
              } else {
                throw searchErr;
              }
            } catch (origErr) {
              throw e; // throw original error if everything fails
            }
          }
        }
      } else {
        // Automatic Fallback: If popular path is blocked (403/503) or fails, try the home page baseUrl directly!
        console.warn(`[Scraper] Failed fetching ${url}, falling back to homepage ${baseUrl} due to:`, e);
        try {
          const response = await proxiedFetch(baseUrl);
          if (response.ok) {
            html = await response.text();
          } else {
            throw new Error(`Homepage also failed with status ${response.status}`);
          }
        } catch (homeErr) {
          throw e; // throw original error if homepage fails too
        }
      }
    }

    const $ = cheerio.load(html);
    const list: Manga[] = [];

    // Helper to process element
    const addMangaItem = (el: any) => {
      let linkEl = source.listLinkSelector ? $(el).find(source.listLinkSelector).addBack(source.listLinkSelector).first() : null;
      if (!linkEl || linkEl.length === 0) {
        // Fallback links - look inside OR check if element itself is a link
        linkEl = $(el).find('a[href*="/manga/"], a[href*="/series/"], a[href*="/work/"]').first();
        if (linkEl.length === 0) {
          linkEl = $(el).is('a') ? $(el) : $(el).find('a').first();
        }
      }

      let titleEl = source.listTitleSelector ? $(el).find(source.listTitleSelector).addBack(source.listTitleSelector).first() : null;
      if (!titleEl || titleEl.length === 0) {
        titleEl = $(el).find('.post-title, .title, h3, h4, h5, .tt').first();
        if (titleEl.length === 0 && $(el).is('h1, h2, h3, h4, h5')) {
          titleEl = $(el);
        }
      }

      let coverEl = source.listCoverSelector ? $(el).find(source.listCoverSelector).addBack(source.listCoverSelector).first() : null;
      if (!coverEl || coverEl.length === 0) {
        coverEl = $(el).find('img').first();
      }

      const rawLink = linkEl.attr('href');
      if (rawLink) {
        const coverAttr = source.listCoverAttr || 'src';
        let rawCoverUrl = '';
        if (coverEl.length > 0) {
          rawCoverUrl = coverEl.attr(coverAttr) || coverEl.attr('data-src') || coverEl.attr('data-lazy-src') || coverEl.attr('src') || '';
        }
        
        const coverUrl = normalizeUrl(rawCoverUrl, baseUrl);
        const sourceUrl = normalizeUrl(rawLink, baseUrl);
        const uniqueId = getUniqueId(sourceUrl);
        
        let titleText = titleEl.text().trim();
        if (!titleText && linkEl.attr('title')) {
          titleText = linkEl.attr('title') || '';
        }
        if (!titleText) {
          titleText = linkEl.text().trim();
        }

        if (sourceUrl && !list.some(item => item.id === uniqueId)) {
          list.push({
            id: uniqueId,
            title: titleText || 'بدون عنوان',
            cover: coverUrl || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
            url: sourceUrl
          });
        }
      }
    };

    // 1. Try configured card selector
    if (source.listCardSelector) {
      $(source.listCardSelector).each((_, el) => {
        addMangaItem(el);
      });
    }

    // 2. If list is still empty, run standard self-healing card selectors (for Madara, MangaReader, custom themes)
    if (list.length === 0) {
      const fallbackCardSelectors = [
        '.page-item-detail',
        '.manga-entry',
        '.manga-card',
        '.entry',
        '.card',
        '.bs',
        '.bsx',
        'div.col-6',
        '.slider__item',
        '.slider__thumb_item',
        '.series-card',
        '.manga-item',
        '.item-manga',
        '.post-item',
        'div.relative.rounded-md',
        '.bg-card'
      ];

      for (const cardSel of fallbackCardSelectors) {
        const cards = $(cardSel);
        if (cards.length > 0) {
          cards.each((_, el) => {
            addMangaItem(el);
          });
          if (list.length > 0) {
            console.log(`[Scraper] Successfully parsed ${list.length} items using fallback selector: "${cardSel}"`);
            break;
          }
        }
      }
    }

    // 3. Absolute last resort fallback: find any links pointing to /manga/* or /series/*
    if (list.length === 0) {
      $('a[href*="/manga/"], a[href*="/series/"], a[href*="/work/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const sourceUrl = normalizeUrl(href, baseUrl);
          const titleText = $(el).attr('title') || $(el).text().trim();
          if (titleText && titleText.length > 2) {
            let imgEl = $(el).find('img').first();
            if (imgEl.length === 0) {
              imgEl = $(el).parent().find('img').first();
            }
            const rawCoverUrl = imgEl.attr('src') || imgEl.attr('data-src') || '';
            const coverUrl = normalizeUrl(rawCoverUrl, baseUrl);
            const uniqueId = getUniqueId(sourceUrl);

            if (!list.some(item => item.id === uniqueId)) {
              list.push({
                id: uniqueId,
                title: titleText,
                cover: coverUrl,
                url: sourceUrl
              });
            }
          }
        }
      });
    }

    if (query && query.trim() !== '') {
      const normalizedQuery = normalizeArabic(query);
      return list.filter(m => {
        const normalizedTitle = normalizeArabic(m.title);
        if (normalizedTitle.includes(normalizedQuery)) return true;
        
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
        if (queryWords.length > 0 && queryWords.every(word => normalizedTitle.includes(word))) {
          return true;
        }
        return false;
      });
    }

    return list;
  },

  async parseMangaDetails(mangaUrl: string, source?: ScraperSource): Promise<Manga> {
    if (!source) throw new Error("Source configuration missing for generic scraper.");
    
    const baseUrl = source.baseUrl;
    const response = await proxiedFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Self-healing selectors for title
    let title = '';
    if (source.detailTitleSelector) {
      title = $(source.detailTitleSelector).first().text().trim();
    }
    if (!title) {
      title = $('.post-title h1, .post-content h1, .entry-title, h1, h1[itemProp="name"]').first().text().trim();
    }
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
    }

    // Self-healing selectors for cover
    let cover = '';
    const ogCover = $('meta[property="og:image"]').attr('content');
    if (ogCover) {
      cover = ogCover;
    } else {
      const coverImg = $('.summary_image img, .manga-about img, .post-content img, img[itemprop="image"]').first();
      cover = coverImg.attr('src') || coverImg.attr('data-src') || '';
    }
    cover = normalizeUrl(cover, baseUrl);

    // Self-healing selectors for description
    let description = '';
    if (source.detailDescSelector) {
      description = $(source.detailDescSelector).first().text().trim();
    }
    if (!description) {
      description = $('.description-summary, .manga-about, .entry-content, [itemProp="description"], div.summary-content, .description, .p-4.rounded-2xl.border.border-zinc-800').first().text().trim();
    }
    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || '';
    }

    let allChapters: Chapter[] = [];
    
    const extractChapters = (doc: cheerio.CheerioAPI) => {
      let chapterItems = source.detailChapterItemSelector ? doc(source.detailChapterItemSelector) : null;
      if (!chapterItems || chapterItems.length === 0) {
        // Fallback chapter item selectors
        chapterItems = doc('li.wp-manga-chapter, li.chapter-item, #cl li, #chapterlist li, .chapter-list li, tr.chapter-row');
      }
      if (!chapterItems || chapterItems.length === 0) {
        // Absolute fallback: any links containing "chapter-" or "chapter/" or "/الفصل-"
        chapterItems = doc('a[href*="/chapter-"], a[href*="/chapter/"], a[href*="/الفصل-"]');
      }
      
      chapterItems.each((idx, el) => {
        const isLocked = doc(el).find('.fa-lock, i.lock, svg.lock, .premium, .locked, svg[class*="lock"], svg[class*="coin"]').length > 0 || 
                         doc(el).text().includes('مدفوع') || 
                         doc(el).text().includes('مغلق') || 
                         doc(el).text().includes('VIP') || 
                         doc(el).text().includes('vip') || 
                         doc(el).text().includes('بريميوم');

        let linkEl = source.detailChapterLinkSelector ? (doc(el).is(source.detailChapterLinkSelector) ? doc(el) : doc(el).find(source.detailChapterLinkSelector).first()) : null;
        if (!linkEl || linkEl.length === 0) {
          linkEl = doc(el).is('a') ? doc(el) : doc(el).find('a').first();
        }
        
        const rawChapterUrl = linkEl.attr('href');
        if (!rawChapterUrl) return;
        
        const chapterUrl = normalizeUrl(rawChapterUrl, baseUrl);
        
        let titleEl: any = source.detailChapterTitleSelector ? doc(el).find(source.detailChapterTitleSelector).first() : null;
        if (!titleEl || titleEl.length === 0) {
          titleEl = doc(el).find('.chaptext, span, p').first();
        }
        if (!titleEl || titleEl.length === 0) {
          titleEl = linkEl;
        }

        let chapterTitle = titleEl.text().trim() || linkEl.text().trim();
        
        // Advanced cleanup to prevent dates from being parsed as chapter numbers
        chapterTitle = chapterTitle.split('\n')[0].replace(/\s+/g, ' ').trim();
        // Remove common date strings
        chapterTitle = chapterTitle.replace(/(منذ|قبل)?\s*\d+\s*(ساعات|ساعة|ايام|أيام|يوم|شهر|أشهر|دقائق|دقيقة|ثواني|ثانية|days|day|hours|hour|mins|min|months|month|years|year)(\s*(مضت|ago))?/gi, '');
        chapterTitle = chapterTitle.trim().replace(/^-|-$/g, '').trim();

        if (/^[\d.]+$/.test(chapterTitle)) {
          chapterTitle = `الفصل ${chapterTitle}`;
        }
        
        if (!chapterTitle || /^(\s|-)*$/.test(chapterTitle)) {
          chapterTitle = `الفصل ${idx + 1}`;
        }
        
        const uniqueId = getUniqueId(chapterUrl);
        if (!allChapters.some(ch => ch.id === uniqueId)) {
          allChapters.push({
            id: uniqueId,
            name: chapterTitle,
            url: chapterUrl,
            isLocked: !!isLocked
          });
        }
      });
    };

    // Attempt Madara AJAX chapter fetch first
    const mangaId = $('#manga-chapters-holder').attr('data-id') || 
                    $('.wp-manga-action-button').attr('data-post') || 
                    $('input.rating-post-id').val();
                    
    if (mangaId) {
      try {
        const ajaxUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'wp-admin/admin-ajax.php';
        const ajaxRes = await proxiedFetch(ajaxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `action=manga_get_chapters&manga=${mangaId}`
        });
        const ajaxHtml = await ajaxRes.text();
        if (ajaxHtml && ajaxHtml.length > 50 && !ajaxHtml.includes('{"error"')) {
           const $ajax = cheerio.load(ajaxHtml);
           extractChapters($ajax);
        }
      } catch (e) {
        console.warn("[Scraper] Madara AJAX chapters failed:", e);
      }
    }

    extractChapters($);

    // Try finding next page for chapters if pagination exists (basic heuristic)
    let currentPage = 2;
    let hasMore = true;
    while (hasMore && currentPage <= 10) {
      const nextLink = $('a').filter((_, el) => $(el).text().includes('Next') || $(el).text().includes('التالي') || $(el).text().includes('›'));
      if (nextLink.length > 0) {
         try {
           const pRes = await proxiedFetch(`${mangaUrl}?page=${currentPage}`);
           const pHtml = await pRes.text();
           const $p = cheerio.load(pHtml);
           const countBefore = allChapters.length;
           extractChapters($p);
           if (allChapters.length > countBefore) currentPage++;
           else hasMore = false;
         } catch {
           hasMore = false;
         }
      } else {
        hasMore = false;
      }
    }
    
    // Sort logic: if chapters are newest first, reverse them to ascending order
    if (allChapters.length > 1) {
      const firstNumStr = allChapters[0].name.match(/\d+/)?.[0] || '0';
      const lastNumStr = allChapters[allChapters.length - 1].name.match(/\d+/)?.[0] || '0';
      const firstNum = parseInt(firstNumStr, 10);
      const lastNum = parseInt(lastNumStr, 10);
      if (firstNum > lastNum) {
        allChapters.reverse();
      }
    }

    return {
      id: getUniqueId(mangaUrl),
      title: title || 'اسم غير معروف',
      cover: cover || '',
      description: description || 'لا يوجد وصف متاح.',
      url: mangaUrl,
      chapters: allChapters,
    };
  },

  async parseChapterPages(chapterUrl: string, source?: ScraperSource): Promise<ChapterPage[]> {
    if (!source) throw new Error("Source configuration missing for generic scraper.");
    const baseUrl = source.baseUrl;
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const pages: ChapterPage[] = [];

    // A. Check for WordPress / Mangareader dynamic scripts (ts_reader.run)
    let tsReaderScript = '';
    $('script').each((_idx, el) => {
      const content = $(el).html() || '';
      if (content.includes('ts_reader.run')) {
        tsReaderScript = content;
      }
    });

    if (tsReaderScript) {
      const startIdx = tsReaderScript.indexOf('{');
      const endIdx = tsReaderScript.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          const jsonStr = tsReaderScript.substring(startIdx, endIdx + 1);
          const data = JSON.parse(jsonStr);
          const extractedUrls: string[] = [];
          
          if (data.sources && Array.isArray(data.sources)) {
            for (const src of data.sources) {
              if (src.images && Array.isArray(src.images)) {
                for (const img of src.images) {
                  if (typeof img === 'string' && img.trim()) {
                    extractedUrls.push(img.trim());
                  }
                }
              }
            }
          }
          
          if (data.images && Array.isArray(data.images)) {
            for (const img of data.images) {
              if (typeof img === 'string' && img.trim() && !extractedUrls.includes(img.trim())) {
                extractedUrls.push(img.trim());
              }
            }
          }

          if (extractedUrls.length > 0) {
            for (const rawImgUrl of extractedUrls) {
              const cleanUrl = normalizeUrl(rawImgUrl, baseUrl);
              if (cleanUrl.startsWith('http') && 
                  !cleanUrl.includes('logo') && 
                  !cleanUrl.includes('avatar') && 
                  !cleanUrl.includes('banner') &&
                  !cleanUrl.endsWith('.gif') &&
                  !pages.some(p => p.url === cleanUrl)) {
                pages.push({ url: cleanUrl });
              }
            }
            if (pages.length > 0) {
              console.log(`[Scraper] Successfully extracted ${pages.length} pages via ts_reader.run`);
              return pages; // Return immediately to avoid picking up unrelated layout/ads images
            }
          }
        } catch (err) {
          console.warn('[Scraper] Failed to parse ts_reader.run JSON:', err);
        }
      }
    }

    // B. Check for other generic arrays of image URLs inside script tags (e.g. var pages = [...])
    $('script').each((_idx, el) => {
      const content = $(el).html() || '';
      if (content.includes('http') && (content.includes('.jpg') || content.includes('.png') || content.includes('.webp') || content.includes('.avif'))) {
        const arrayRegex = /["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"']*)?)["']/gi;
        let match;
        const foundUrls: string[] = [];
        while ((match = arrayRegex.exec(content)) !== null) {
          foundUrls.push(match[1]);
        }
        if (foundUrls.length > 5) { // Only count if there are enough pages to look like a chapter
          for (const rawImgUrl of foundUrls) {
            const cleanUrl = normalizeUrl(rawImgUrl, baseUrl);
            if (cleanUrl.startsWith('http') && 
                !cleanUrl.includes('logo') && 
                !cleanUrl.includes('avatar') && 
                !cleanUrl.includes('banner') &&
                !cleanUrl.endsWith('.gif') &&
                !pages.some(p => p.url === cleanUrl)) {
              pages.push({ url: cleanUrl });
            }
          }
          if (pages.length > 0) {
            console.log(`[Scraper] Extracted ${pages.length} pages from custom script URL array`);
          }
        }
      }
    });

    if (pages.length > 0) {
      return pages;
    }
    
    const extractFromSelector = (sel: string, attr: string) => {
      $(sel).each((_idx, el) => {
        // Find the best attribute that has a real image URL
        const possibleAttrs = [attr, 'data-src', 'data-lazy-src', 'data-cdn-src', 'data-original', 'src'];
        let rawImgUrl = '';
        
        for (const possibleAttr of possibleAttrs) {
          if (!possibleAttr) continue;
          const val = $(el).attr(possibleAttr);
          if (val && val.trim() !== '') {
            // If it's a placeholder base64 or a tiny loader image, don't use it as the primary URL
            const isPlaceholder = val.startsWith('data:') || 
                                  val.includes('placeholder') || 
                                  val.includes('transparent') || 
                                  val.includes('blank') || 
                                  val.includes('spacer') ||
                                  val.includes('loading') ||
                                  val.endsWith('.gif') ||
                                  val.endsWith('.svg');
            if (!isPlaceholder) {
              rawImgUrl = val.trim();
              break;
            }
          }
        }
        
        // Fallback to the requested attribute or src if all are placeholders
        if (!rawImgUrl) {
          rawImgUrl = $(el).attr(attr) || $(el).attr('src') || '';
        }

        if (rawImgUrl) {
          let cleanUrl = normalizeUrl(rawImgUrl, baseUrl);
          if (cleanUrl.startsWith('http') && 
              !cleanUrl.includes('logo') && 
              !cleanUrl.includes('avatar') && 
              !cleanUrl.endsWith('.gif') &&
              !cleanUrl.includes('banner') &&
              !pages.some(p => p.url.split('#')[0] === cleanUrl.split('#')[0])) {
            
            if (source.type === 'anime') {
              let text = $(el).text().trim();
              if (!text && $(el).attr('title')) {
                text = $(el).attr('title') || '';
              }
              if (!text) {
                text = $(el).parent().text().trim();
              }
              // Clean up text
              text = text.replace(/[\s\n]+/g, ' ').trim();
              if (text && text.length > 0 && text.length < 40) {
                cleanUrl = `${cleanUrl}#${encodeURIComponent(text)}`;
              }
            }

            pages.push({
              url: cleanUrl,
            });
          }
        }
      });
    };

    // 1. Try configured page image selector and attribute
    const imgSelector = source.pageImgSelector || 'img';
    const imgAttr = source.pageImgAttr || 'src';
    extractFromSelector(imgSelector, imgAttr);

    // 2. Self-healing fallback selectors if no pages found
    if (pages.length === 0) {
      const fallbackSelectors = source.type === 'anime' ? [
        { sel: 'iframe', attr: 'src' },
        { sel: 'iframe', attr: 'data-src' },
        { sel: '.server-list li a', attr: 'data-src' },
        { sel: '.server-list li a', attr: 'data-ep-url' },
        { sel: '.episodes-links li a', attr: 'data-src' },
        { sel: '#episode-servers li a', attr: 'data-src' },
        { sel: 'ul.servers li a', attr: 'data-src' }
      ] : [
        { sel: '.page-break img', attr: 'src' },
        { sel: '.page-break img', attr: 'data-src' },
        { sel: '#readerarea img', attr: 'src' },
        { sel: '#readerarea img', attr: 'data-src' },
        { sel: '.wp-manga-chapter-img', attr: 'src' },
        { sel: '.wp-manga-chapter-img', attr: 'data-src' },
        { sel: 'div.reading-content img', attr: 'src' },
        { sel: 'div.reading-content img', attr: 'data-src' },
        { sel: '.vung-doc img', attr: 'src' },
        { sel: '.vung-doc img', attr: 'data-src' },
        { sel: 'img[class*="chapter-img"]', attr: 'src' },
        { sel: 'img[class*="reader"]', attr: 'src' }
      ];

      for (const fallback of fallbackSelectors) {
        extractFromSelector(fallback.sel, fallback.attr);
        if (pages.length > 0) {
          console.log(`[Scraper] Successfully extracted ${pages.length} pages using fallback: "${fallback.sel}"`);
          break;
        }
      }
    }

    // 3. Ultimate last resort: parse all image tags that look like story pages (high height or width, from upload directories)
    if (pages.length === 0) {
      $('img').each((_idx, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
        const cleanUrl = normalizeUrl(src, baseUrl);
        if (cleanUrl.startsWith('http') && 
            (cleanUrl.includes('wp-content/uploads') || cleanUrl.includes('manga') || cleanUrl.includes('chapter')) &&
            !cleanUrl.includes('logo') && 
            !cleanUrl.includes('avatar') && 
            !cleanUrl.includes('banner') &&
            !cleanUrl.endsWith('.gif') &&
            !pages.some(p => p.url === cleanUrl)) {
          pages.push({
            url: cleanUrl,
          });
        }
      });
    }

    return pages;
  },
};
