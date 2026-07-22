import * as cheerio from 'cheerio';
import { Manga, Chapter, ChapterPage, SourceHandler, CATEGORY_ENGLISH_MAP } from './types';
import { proxiedFetch } from './fetch';
import { ScraperSource } from '../types';
import { retryFetch, extractNumber, cleanTitle, sortNumerically, deduplicate, validateItem } from '../utils/scraperUtils';

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
      const response = await retryFetch(url);
      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }
      html = await response.text();
    } catch (e) {
      if (isGenreSearch && englishSlug) {
        const altUrl = `${baseUrl}/genre/${englishSlug}/`;
        console.log(`[Scraper] Retrying with alternative genre URL: ${altUrl}`);
        try {
          const response = await retryFetch(altUrl);
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
            const response = await retryFetch(searchUrl);
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
              const response = await retryFetch(origSearchUrl);
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
          const response = await retryFetch(baseUrl);
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

        const item = {
            id: uniqueId,
            title: cleanTitle(titleText || 'بدون عنوان'),
            cover: coverUrl || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
            url: sourceUrl
          };

        if (sourceUrl && validateItem(item) && !list.some(item => item.id === uniqueId)) {
          list.push(item);
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
    const response = await retryFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Self-healing selectors for title
    let title = '';
    if (source.detailTitleSelector) {
      title = cleanTitle($(source.detailTitleSelector).first().text());
    }
    if (!title) {
      title = cleanTitle($('.post-title h1, .post-content h1, .entry-title, h1, h1[itemProp="name"]').first().text());
    }
    if (!title) {
      title = cleanTitle($('meta[property="og:title"]').attr('content') || $('title').text());
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
      description = $('.description-summary, .manga-about, .entry-content, [itemProp="description"], div.summary-content, .description, .p-4.rounded-2xl.border.border-zinc-800, .post-content, .summary, .desc, .review-content, .story-info-right-extent').text().trim().replace(/\s+/g, ' ');
      if (description.length > 500) description = description.substring(0, 500) + '...';
    }
    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || '';
    }

    let allChapters: Chapter[] = [];
    
    const extractChapters = (doc: cheerio.CheerioAPI) => {
      let chapterItems = source.detailChapterItemSelector ? doc(source.detailChapterItemSelector) : null;
      const isAnime = source.type === 'anime';

      if (!chapterItems || chapterItems.length === 0) {
        if (isAnime) {
          // Fallback episode item selectors
          chapterItems = doc('.episodios a, .episodiodata a, .episodes-list a, .episodes-card a, .episode-item a, li.episode a, .episodes a, li.episodio a, .ep-card a, .episode-title a, a.episode-link, .season-list a, .seasons-list a, #episodes a, .episode a, [class*="episod"] a, [class*="ep_list"] a, [class*="ep-list"] a, [id*="episod"] a, [id*="episode"] a');
        } else {
          // Fallback chapter item selectors
          chapterItems = doc('li.wp-manga-chapter, li.chapter-item, #cl li, #chapterlist li, .chapter-list li, tr.chapter-row, .eplister li, #chapterlist a, .eplister a');
        }
      }
      
      if (!chapterItems || chapterItems.length === 0) {
        if (isAnime) {
          // Absolute fallback for anime: any links containing episode patterns or Arabic "الحلقة" / "حلقة"
          chapterItems = doc('a[href*="/episode-"], a[href*="/episode/"], a[href*="/episodes/"], a[href*="/episodio/"], a[href*="/episodios/"], a[href*="/ep-"], a[href*="/ep/"], a[href*="/الحلقة-"], a[href*="/الحلقة/"], a[href*="/%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-"], a[href*="/%d8%ad%d9%84%d9%82%d8%a9-"], a[href*="/%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-"], a[href*="/%D8%AD%D9%84%D9%82%D9%81-"], a[href*="%d8%ad%d9%84%d9%82"]');
        } else {
          // Absolute fallback: any links containing "chapter" or "الفصل"
          chapterItems = doc('a[href*="chapter-"], a[href*="chapter/"], a[href*="-chapter"], a[href*="الفصل-"], a[href*="-الفصل"]');
        }
      }

      if (!chapterItems || chapterItems.length === 0) {
        // Ultimate fallback: scan all <a> tags for keyword/pattern matches in href or text
        const matchedLinks: any[] = [];
        doc('a').each((_, el) => {
          const href = doc(el).attr('href');
          const text = doc(el).text().toLowerCase();
          if (!href) return;
          
          const hrefLower = href.toLowerCase();
          
          if (isAnime) {
            const isEpisodeLink = 
              hrefLower.includes('/episode/') || 
              hrefLower.includes('/episode-') || 
              hrefLower.includes('/episodes/') || 
              hrefLower.includes('/episodio/') || 
              hrefLower.includes('/episodios/') || 
              hrefLower.includes('/ep-') || 
              hrefLower.includes('/ep/') || 
              hrefLower.includes('الحلقة') || 
              hrefLower.includes('حلقة') || 
              hrefLower.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d9%81') || 
              hrefLower.includes('%d8%ad%d9%84%d9%82%d9%81') || 
              hrefLower.includes('%d8%ad%d9%84%d9%82') || 
              text.includes('الحلقة') || 
              text.includes('حلقة') || 
              text.includes('episode') || 
              text.includes('ep ');
              
            const isExcluded = 
              hrefLower.endsWith('/anime/') || 
              hrefLower.endsWith('/category/') || 
              hrefLower.endsWith('/genre/') || 
              hrefLower.includes('/genres/') ||
              text.includes('جميع حلقات') ||
              text.includes('جميع الفصول');
              
            if (isEpisodeLink && !isExcluded) {
              matchedLinks.push(el);
            }
          } else {
            const isChapterLink = 
              hrefLower.includes('/chapter-') || 
              hrefLower.includes('/chapter/') || 
              hrefLower.includes('الفصل') || 
              hrefLower.includes('%d8%a7%d9%84%d9%81%d8%b5%d9%84') || 
              text.includes('الفصل') || 
              text.includes('chapter');
              
            const isExcluded = 
              hrefLower.endsWith('/manga/') || 
              hrefLower.endsWith('/series/') || 
              hrefLower.endsWith('/genre/') ||
              text.includes('جميع حلقات') ||
              text.includes('جميع الفصول');
              
            if (isChapterLink && !isExcluded) {
              matchedLinks.push(el);
            }
          }
        });
        
        if (matchedLinks.length > 0) {
          chapterItems = doc(matchedLinks);
        }
      }
      
      if (!chapterItems) return;

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
        
        // Clone element and strip common non-title components like dates/views
        const tempEl = linkEl.clone();
        tempEl.find('.chapterdate, .chapter-date, .date, .time, .views, .view, span[class*="date"], span[class*="time"], span[class*="view"]').remove();

        let chapterTitle = '';
        if (source.detailChapterTitleSelector) {
          const tEl = doc(el).is(source.detailChapterTitleSelector) ? doc(el) : doc(el).find(source.detailChapterTitleSelector).first();
          if (tEl.length > 0) {
            const tempTEl = tEl.clone();
            tempTEl.find('.chapterdate, .chapter-date, .date, .time, .views, .view, span[class*="date"], span[class*="time"], span[class*="view"]').remove();
            chapterTitle = tempTEl.text().trim();
          }
        }
        
        if (!chapterTitle) {
          const linkText = tempEl.text().trim();
          const lowerLinkText = linkText.toLowerCase();
          const hasChapterKeyword = linkText.includes('الفصل') || linkText.includes('الحلقة') || lowerLinkText.includes('chapter') || lowerLinkText.includes('episode') || lowerLinkText.includes('ch.') || lowerLinkText.includes('ep.') || /^\s*\d+/.test(linkText);
          
          if (linkText && (hasChapterKeyword || linkText.length > 3)) {
            chapterTitle = linkText;
          } else {
            const chapTextEl = doc(el).find('.chaptext, span, p').first();
            if (chapTextEl.length > 0) {
              const tempChapTextEl = chapTextEl.clone();
              tempChapTextEl.find('.chapterdate, .chapter-date, .date, .time, .views, .view, span[class*="date"], span[class*="time"], span[class*="view"]').remove();
              chapterTitle = tempChapTextEl.text().trim() || linkText;
            } else {
              chapterTitle = linkText;
            }
          }
        }

        // Clean common site-specific noise from chapter titles
        chapterTitle = chapterTitle
          .replace(/[\d,.]+\s*(قراءة|مشاهدة)/gi, '')
          .replace(/محدث\s*الآن/gi, '')
          .replace(/جديد/gi, '')
          .trim();
        
        // Advanced cleanup to prevent dates from being parsed as chapter numbers
        chapterTitle = chapterTitle.split('\n')[0].replace(/\s+/g, ' ').trim();
        // Remove common date strings
        chapterTitle = chapterTitle.replace(/(منذ|قبل)?\s*\d+\s*(ساعات|ساعة|ايام|أيام|يوم|شهر|أشهر|دقائق|دقيقة|ثواني|ثانية|days|day|hours|hour|mins|min|months|month|years|year)(\s*(مضت|ago))?/gi, '');
        chapterTitle = chapterTitle.trim().replace(/^-|-$/g, '').trim();

        const prefix = isAnime ? 'الحلقة' : 'الفصل';

        if (/^[\d.]+$/.test(chapterTitle)) {
          chapterTitle = `${prefix} ${chapterTitle}`;
        }
        
        if (!chapterTitle || /^(\s|-)*$/.test(chapterTitle)) {
          chapterTitle = `${prefix} ${idx + 1}`;
        }
        
        // Skip links that are actually just series links or table headers
        if (
          chapterTitle.includes('جميع حلقات') || 
          chapterTitle.includes('جميع الفصول') ||
          chapterTitle.includes('الحالة') ||
          chapterTitle.includes('النوع') ||
          chapterTitle.includes('الفصول') ||
          chapterTitle.includes('تحديث') ||
          chapterTitle.includes('آخر تحديث')
        ) {
          return;
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

    // Attempt Madara AJAX chapter fetch first with enhanced post id discovery
    let mangaId = $('#manga-chapters-holder').attr('data-id') || 
                  $('.wp-manga-action-button').attr('data-post') || 
                  $('input.rating-post-id').val() ||
                  $('[data-post-id]').attr('data-post-id') ||
                  $('input[name="post_id"]').val() ||
                  $('input#manga-id').val();

    if (!mangaId) {
      $('script').each((_, el) => {
        const scriptContent = $(el).text();
        const match = scriptContent.match(/(?:wp_manga_post_id|manga_id|post_id)\s*=\s*["']?(\d+)["']?/i);
        if (match) {
          mangaId = match[1];
          return false;
        }
      });
    }
                    
    if (mangaId) {
      try {
        const ajaxUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'wp-admin/admin-ajax.php';
        const ajaxRes = await retryFetch(ajaxUrl, {
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

    // Try a second common Madara-specific AJAX endpoint /ajax/chapters/ if we got few or no chapters
    if (allChapters.length < 5) {
      try {
        const ajaxUrl = mangaUrl.endsWith('/') ? `${mangaUrl}ajax/chapters/` : `${mangaUrl}/ajax/chapters/`;
        const ajaxRes = await retryFetch(ajaxUrl, {
          method: 'POST'
        });
        const ajaxHtml = await ajaxRes.text();
        if (ajaxHtml && ajaxHtml.length > 50 && !ajaxHtml.includes('{"error"')) {
           const $ajax = cheerio.load(ajaxHtml);
           extractChapters($ajax);
        }
      } catch (e) {
        // Fallback to GET for /ajax/chapters/
        try {
          const ajaxUrl = mangaUrl.endsWith('/') ? `${mangaUrl}ajax/chapters/` : `${mangaUrl}/ajax/chapters/`;
          const ajaxRes = await retryFetch(ajaxUrl);
          const ajaxHtml = await ajaxRes.text();
          if (ajaxHtml && ajaxHtml.length > 50 && !ajaxHtml.includes('{"error"')) {
             const $ajax = cheerio.load(ajaxHtml);
             extractChapters($ajax);
          }
        } catch (_) {}
      }
    }

    // Extract any chapters already rendered in the main page's static HTML as well
    extractChapters($);
    
        // Try finding next page for chapters if pagination exists
        let currentPage = 2;
        let hasMore = true;
        let $currentDoc = $;
        
        while (hasMore && currentPage <= 50) {
          // Look for common next page link selectors or text
          let nextLink = $currentDoc('.pagination a.next, .nav-previous a, a[rel="next"]').first().attr('href');
          if (!nextLink) {
             const nextEl = $currentDoc('a').filter((_, el) => {
               const t = $currentDoc(el).text().toLowerCase();
               return t.includes('next') || t.includes('التالي') || t.includes('›') || t.includes('الصفحة التالية');
             }).first();
             nextLink = nextEl.attr('href');
          }

          // Also check for Madara specific "load more" if it wasn't caught by AJAX
          if (!nextLink) {
             hasMore = false;
             break;
          }

          try {
             const pUrl = nextLink.startsWith('http') ? nextLink : normalizeUrl(nextLink, baseUrl);
             // Prevent infinite loops on same URL
             if (pUrl === mangaUrl || allChapters.some(c => c.url === pUrl)) {
               hasMore = false;
               break;
             }
             
             const pRes = await retryFetch(pUrl);
             const pHtml = await pRes.text();
             $currentDoc = cheerio.load(pHtml);
             
             const countBefore = allChapters.length;
             extractChapters($currentDoc);
             
             if (allChapters.length > countBefore) {
                currentPage++;
             } else {
                hasMore = false;
             }
          } catch {
             hasMore = false;
          }
        }
        
        // Final cleaning
        allChapters = deduplicate(allChapters);
    
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
    const response = await retryFetch(chapterUrl);
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

  async parseMangaChapters(mangaUrl: string, page: number, source?: ScraperSource): Promise<Chapter[]> {
    if (!source) return [];
    const baseUrl = source.baseUrl;
    const chapters: Chapter[] = [];
    
    // Some sites have chapter lists paginated via ${mangaUrl}page/${page}/ or ${mangaUrl}?paged=${page}
    const urlsToTry = [
      mangaUrl.endsWith('/') ? `${mangaUrl}page/${page}/` : `${mangaUrl}/page/${page}/`,
      mangaUrl.includes('?') ? `${mangaUrl}&paged=${page}` : `${mangaUrl}?paged=${page}`
    ];
    
    for (const url of urlsToTry) {
      try {
        const response = await retryFetch(url);
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          let chapterItems = source.detailChapterItemSelector ? $(source.detailChapterItemSelector) : null;
          const isAnime = source.type === 'anime';

          if (!chapterItems || chapterItems.length === 0) {
            if (isAnime) {
              chapterItems = $('.episodios a, .episodiodata a, .episodes-list a, .episodes-card a, .episode-item a, li.episode a, .episodes a, li.episodio a, .ep-card a, .episode-title a, a.episode-link, .season-list a, .seasons-list a, #episodes a, .episode a, [class*="episod"] a, [class*="ep_list"] a, [class*="ep-list"] a, [id*="episod"] a, [id*="episode"] a');
            } else {
              chapterItems = $('li.wp-manga-chapter, li.chapter-item, #cl li, #chapterlist li, .chapter-list li, tr.chapter-row, .eplister li, #chapterlist a, .eplister a');
            }
          }
          
          if (!chapterItems || chapterItems.length === 0) {
            if (isAnime) {
              chapterItems = $('a[href*="/episode-"], a[href*="/episode/"], a[href*="/episodes/"], a[href*="/episodio/"], a[href*="/episodios/"], a[href*="/ep-"], a[href*="/ep/"], a[href*="/الحلقة-"], a[href*="/الحلقة/"], a[href*="/%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-"], a[href*="/%d8%ad%d9%84%d9%82%d8%a9-"], a[href*="/%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-"], a[href*="/%D8%AD%D9%84%D9%82%D9%81-"], a[href*="%d8%ad%d9%84%d9%82"]');
            } else {
              chapterItems = $('a[href*="chapter-"], a[href*="chapter/"], a[href*="-chapter"], a[href*="الفصل-"], a[href*="-الفصل"]');
            }
          }

          chapterItems.each((_idx, el) => {
            let linkEl = source.detailChapterLinkSelector ? ($(el).is(source.detailChapterLinkSelector) ? $(el) : $(el).find(source.detailChapterLinkSelector).first()) : null;
            if (!linkEl || linkEl.length === 0) {
              linkEl = $(el).is('a') ? $(el) : $(el).find('a').first();
            }
            const rawChapterUrl = linkEl.attr('href');
            if (!rawChapterUrl) return;
            
            const chapterUrl = normalizeUrl(rawChapterUrl, baseUrl);

            // Clone and clean
            const tempEl = linkEl.clone();
            tempEl.find('.chapterdate, .chapter-date, .date, .time, .views, .view, span[class*="date"], span[class*="time"], span[class*="view"]').remove();

            let titleEl = source.detailChapterTitleSelector ? ($(el).is(source.detailChapterTitleSelector) ? $(el) : $(el).find(source.detailChapterTitleSelector).first()) : null;
            if (!titleEl || titleEl.length === 0) {
              titleEl = $(el).find('.chaptext, span, p').first();
            }
            if (!titleEl || titleEl.length === 0) {
              titleEl = linkEl;
            }

            const tempTitleEl = titleEl.clone();
            tempTitleEl.find('.chapterdate, .chapter-date, .date, .time, .views, .view, span[class*="date"], span[class*="time"], span[class*="view"]').remove();

            let chapterTitle = tempTitleEl.text().trim() || tempEl.text().trim();
            chapterTitle = chapterTitle.split('\n')[0].replace(/\s+/g, ' ').trim();
            chapterTitle = chapterTitle.replace(/(منذ|قبل)?\s*\d+\s*(ساعات|ساعة|ايام|أيام|يوم|شهر|أشهر|دقائق|دقيقة|ثواني|ثانية|days|day|hours|hour|mins|min|months|month|years|year)(\s*(مضت|ago))?/gi, '');
            chapterTitle = chapterTitle.trim().replace(/^-|-$/g, '').trim();

            const prefix = isAnime ? 'الحلقة' : 'الفصل';
            if (/^[\d.]+$/.test(chapterTitle)) {
              chapterTitle = `${prefix} ${chapterTitle}`;
            }
            
            if (!chapterTitle || /^(\s|-)*$/.test(chapterTitle)) {
              return;
            }

            // Skip links that are actually just series links or table headers
            if (
              chapterTitle.includes('جميع حلقات') || 
              chapterTitle.includes('جميع الفصول') ||
              chapterTitle.includes('الحالة') ||
              chapterTitle.includes('النوع') ||
              chapterTitle.includes('الفصول') ||
              chapterTitle.includes('تحديث') ||
              chapterTitle.includes('آخر تحديث')
            ) {
              return;
            }

            const uniqueId = getUniqueId(chapterUrl);
            if (!chapters.some(ch => ch.id === uniqueId)) {
              chapters.push({
                id: uniqueId,
                name: chapterTitle,
                url: chapterUrl,
                isLocked: $(el).find('.fa-lock, i.lock, svg.lock, .premium, .locked').length > 0
              });
            }
          });
          
          if (chapters.length > 0) {
            break;
          }
        }
      } catch (e) {
        console.warn(`[Scraper] Failed parsing generic chapters on ${url}:`, e);
      }
    }
    
    return chapters;
  },
};
