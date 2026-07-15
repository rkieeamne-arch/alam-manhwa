import * as cheerio from 'cheerio';
import { SourceHandler, Manga, Chapter, ChapterPage, CATEGORY_ENGLISH_MAP } from './types';
import { proxiedFetch } from './fetch';
import { getUniqueId } from './generic';

const BASE_URL = 'https://mangatuk.com';

// Local cache for sitemap URLs to search easily
let sitemapCache: string[] = [];
let homepageCache: Manga[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

function transliterateArabicToEnglish(text: string): string {
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ى': 'a',
    'ب': 'b',
    'ت': 't', 'ة': 't',
    'ث': 'th',
    'ج': 'j',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'dh',
    'ر': 'r',
    'ز': 'z',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'd',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'q',
    'ك': 'k',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'ه': 'h',
    'و': 'o',
    'ي': 'y', 'ئ': 'y', 'ء': 'a'
  };
  return text.split('').map(char => map[char] || char).join('');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getChapterNumber(name: string, id: string): number {
  // Try matching numerical values in Chapter title/name (e.g., "الفصل 65: بدون حجب" -> 65)
  const match = name.match(/الفصل\s*([\d.]+)/i) || name.match(/[\d.]+/);
  if (match) {
    const num = parseFloat(match[1] || match[0]);
    if (!isNaN(num)) return num;
  }
  
  // Try matching numerical values in Chapter ID/slug (e.g., "alfsl-65" or "chapter-65" -> 65)
  const idMatch = id.match(/[\d.]+/);
  if (idMatch) {
    const num = parseFloat(idMatch[0]);
    if (!isNaN(num)) return num;
  }
  
  return 0;
}

async function fetchSitemapIfNeeded(): Promise<string[]> {
  const now = Date.now();
  if (sitemapCache.length > 0 && (now - cacheTimestamp < CACHE_TTL)) {
    return sitemapCache;
  }

  try {
    const sitemapUrl = `${BASE_URL}/sitemaps/series/0`;
    const response = await proxiedFetch(sitemapUrl);
    if (response.ok) {
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const urls: string[] = [];
      $('loc').each((_, el) => {
        const u = $(el).text().trim();
        if (u) urls.push(u);
      });
      if (urls.length > 0) {
        sitemapCache = urls;
        cacheTimestamp = now;
      }
    }
  } catch (e) {
    console.warn('[Mangatuk Scraper] Failed to fetch series sitemap:', e);
  }
  return sitemapCache;
}

export const mangatukSourceHandler: SourceHandler = {
  id: 'mangatuk',
  name: 'مانجاتك',
  lang: 'ar',
  baseUrl: BASE_URL,

  async parsePopularList(page: number = 1, query?: string): Promise<Manga[]> {
    // 1. Always ensure homepage items are loaded/cached for popular list and better search results
    let homepageMangas: Manga[] = [];
    try {
      const homeRes = await proxiedFetch(BASE_URL);
      if (homeRes.ok) {
        const homeHtml = await homeRes.text();
        const $home = cheerio.load(homeHtml);
        
        // Use Next.js script payload parsing as primary (most accurate for covers and metadata)
        let extractedFromScript: Manga[] = [];
        $home('script').each((_, el) => {
          const text = $home(el).text();
          if (text.includes('slug') && text.includes('coverImage')) {
            const regex = /\\"slug\\":\\"([^\\"]+)\\"/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
              const slug = match[1];
              const pos = match.index;
              
              // Find the boundary: either the next "slug" or the end of the script
              const nextSlugRegex = /\\"slug\\":\\"/g;
              nextSlugRegex.lastIndex = pos + match[0].length;
              const nextSlugMatch = nextSlugRegex.exec(text);
              const endPos = nextSlugMatch ? nextSlugMatch.index : text.length;
              
              const sub = text.substring(pos, endPos);
              
              // Extract title
              const titleMatch = sub.match(/\\"title\\":\\"([^\\"]+)\\"/);
              let title = titleMatch ? titleMatch[1] : '';
              
              // Extract coverImage
              const coverMatch = sub.match(/\\"coverImage\\":\\"([^\\"]+)\\"/);
              const cover = coverMatch ? coverMatch[1] : '';
              
              // Skip chapters or numeric slugs
              if (slug.startsWith('chapter-') || /^\d+$/.test(slug)) {
                continue;
              }

              // Clean Unicode escapes in Title (if any)
              try {
                if (title.includes('\\u')) {
                  title = JSON.parse(`"${title}"`);
                }
              } catch (_) {}

              if (!extractedFromScript.some(s => s.id === slug)) {
                extractedFromScript.push({
                  id: slug,
                  title: title || slug,
                  cover: cover ? normalizeUrl(cover, BASE_URL) : '',
                  url: `${BASE_URL}/series/${slug}`
                });
              }
            }
          }
        });

        if (extractedFromScript.length > 0) {
          homepageMangas = extractedFromScript;
        } else {
          // Fallback to standard cheerio parsing of homepage links
          $home('a[href^="/series/"]').each((_, el) => {
            const href = $home(el).attr('href') || '';
            if (href.includes('/chapter-') || href.includes('/episode-') || href.includes('/comments') || /\/\d+$/.test(href)) {
              return;
            }
            
            const id = href.replace('/series/', '').replace('/', '');
            const ariaLabel = $home(el).attr('aria-label') || '';
            const title = ariaLabel.replace(/^افتح\s+/, '').trim() || $home(el).text().trim().replace(/\s+/g, ' ');
            
            let cover = '';
            const innerImg = $home(el).find('img').first();
            if (innerImg.length) {
              cover = innerImg.attr('src') || innerImg.attr('data-src') || '';
            }
            
            if (!cover) {
              const parentImg = $home(el).parent().find('img').first();
              if (parentImg.length) {
                cover = parentImg.attr('src') || parentImg.attr('data-src') || '';
              }
            }

            let cleanTitle = title;
            if (cleanTitle === 'افتح السلسلة' || !cleanTitle || cleanTitle.includes('صورة غلاف')) {
              const altText = $home(el).parent().find('img').first().attr('alt') || '';
              const parentText = $home(el).parent().text().trim().replace(/\s+/g, ' ');
              cleanTitle = altText || parentText.split('أصل السلسلة')[0].trim() || 'مانجا';
            }

            cleanTitle = cleanTitle.replace(/^(مستمرة|مكتملة|متوقفة)?أصل السلسلة:\s*(manhwa|manhua|manga|comic)?/i, '').trim();

            const sourceUrl = `${BASE_URL}${href}`;
            const existing = homepageMangas.find(m => m.id === id);
            if (existing) {
              if (!existing.cover && cover) existing.cover = normalizeUrl(cover, BASE_URL);
              if ((existing.title === 'افتح السلسلة' || existing.title === 'مانجا') && cleanTitle && cleanTitle !== 'افتح السلسلة') {
                existing.title = cleanTitle;
              }
            } else {
              homepageMangas.push({
                id,
                title: cleanTitle || id,
                cover: cover ? normalizeUrl(cover, BASE_URL) : '',
                url: sourceUrl
              });
            }
          });
        }
        
        homepageCache = homepageMangas;
      }
    } catch (e) {
      console.warn('[Mangatuk Scraper] Failed to parse homepage:', e);
    }

    // 2. Handling search queries
    if (query && query.trim() !== '') {
      const normalizedQuery = query.toLowerCase().trim();
      const transliteratedQuery = slugify(transliterateArabicToEnglish(query));
      const englishTerms = CATEGORY_ENGLISH_MAP[query] || [];
      
      // Filter cached items first
      let results = homepageCache.filter(m => {
        const titleLower = m.title.toLowerCase();
        const idLower = m.id.toLowerCase();
        
        const matchesArabic = titleLower.includes(normalizedQuery) || idLower.includes(normalizedQuery) || idLower.includes(transliteratedQuery);
        if (matchesArabic) return true;
        
        if (englishTerms.some(term => idLower.includes(term))) {
          return true;
        }
        return false;
      });

      // Fetch sitemap to look for all matching series slugs
      const sitemapUrls = await fetchSitemapIfNeeded();
      const sitemapMatches = sitemapUrls.filter(u => {
        const slug = u.split('/').pop() || '';
        const lowerSlug = slug.toLowerCase();
        
        const matchesArabic = lowerSlug.includes(normalizedQuery) || lowerSlug.includes(transliteratedQuery);
        if (matchesArabic) return true;
        
        if (englishTerms.some(term => lowerSlug.includes(term))) {
          return true;
        }
        return false;
      });

      // Add sitemap matches to search results
      for (const url of sitemapMatches) {
        const slug = url.split('/').pop() || '';
        if (!results.some(r => r.id === slug)) {
          const homeMatch = homepageCache.find(m => m.id === slug);
          if (homeMatch) {
            results.push(homeMatch);
          } else {
            const humanTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            results.push({
              id: slug,
              title: humanTitle,
              cover: '', // Loaded dynamically in details fallback
              url: url
            });
          }
        }
      }

      if (results.length === 0) {
        return homepageCache.slice(0, 20);
      }

      return results;
    }

    return homepageCache;
  },

  async parseMangaDetails(mangaUrl: string): Promise<Manga> {
    const response = await proxiedFetch(mangaUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || $('title').text().replace('| مانجاتك', '').trim();
    
    // Attempt to extract cover and description with high fidelity from script tag first
    let cover = '';
    let description = '';

    $('script').each((_, el) => {
      const text = $(el).text();
      
      if (!cover) {
        const covMatch = text.match(/\\"coverImage\\":\\"([^\\"]+)\\"/);
        if (covMatch) {
          cover = covMatch[1];
        }
      }
      
      if (!description) {
        const descMatch = text.match(/\\"description\\":\\"([^\\"]+)\\"/);
        if (descMatch) {
          let rawDesc = descMatch[1];
          try {
            if (rawDesc.includes('\\u')) {
              rawDesc = JSON.parse(`"${rawDesc}"`);
            }
          } catch (_) {}
          description = rawDesc;
        }
      }
    });

    if (!cover) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if (src && (src.includes('covers') || alt.toLowerCase().includes(title.toLowerCase()))) {
          cover = src;
        }
      });
    }

    if (!cover) {
      cover = $('meta[property="og:image"]').attr('content') || '';
    }

    if (!description) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && !text.includes('(') && !text.includes(')') && !text.includes('سجل') && !text.includes('دخول') && !text.includes('مكتبتك')) {
          description = text;
          return false; // break
        }
      });
    }

    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || 'لا يوجد وصف متاح.';
    }

    const htmlChapters: Chapter[] = [];
    const seenUrls = new Set<string>();
    
    const urlParts = mangaUrl.replace(/\/$/, '').split('/');
    const slug = urlParts[urlParts.length - 1];

    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes(`/series/${slug}/`)) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const normalizedChUrl = fullUrl.replace(/\/$/, '');
        
        if (seenUrls.has(normalizedChUrl)) return;
        seenUrls.add(normalizedChUrl);
        
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text === 'ابدأ القراءة' || text === 'قراءة' || text.includes('حفظ') || text.includes('الدخول') || text.includes('التسجيل')) {
          return;
        }
        
        const chip = $(el).find('.app-inline-chip').first().text().trim();
        const name = chip || text;
        const id = normalizedChUrl.split('/').pop() || '';
        
        const isLocked = $(el).find('.app-chapter-pill--coin').length > 0 || text.includes('مقفل') || text.includes('عملات');

        htmlChapters.push({
          id,
          name: name || `الفصل ${id}`,
          url: fullUrl,
          isLocked
        });
      }
    });

    // Always attempt to parse all chapters from hydrated JSON/RSC state scripts to merge with HTML
    const jsonChapters: Chapter[] = [];
    let combinedScriptText = '';
    $('script').each((_, el) => {
      const text = $(el).text();
      if (text.includes('__next_f') || text.includes('dehydratedAt') || text.includes('chapters')) {
        combinedScriptText += text;
      }
    });

    if (combinedScriptText.length > 0) {
      const cleanText = combinedScriptText
        .replace(/\\{1,5}"/g, '"')
        .replace(/\\{1,5}\//g, '/')
        .replace(/\\+/g, '');

      const seriesIdRegex = /"seriesId":"([^"]+)"/g;
      let match;
      
      while ((match = seriesIdRegex.exec(cleanText)) !== null) {
        const seriesId = match[1];
        const matchIndex = match.index;
        
        const startIdx = Math.max(0, matchIndex - 150);
        const chunk = cleanText.substring(startIdx, startIdx + 1000);
        
        const idMatch = chunk.match(/"id":"([^"]+)"/);
        const numMatch = chunk.match(/"number":"([^"]+)"/);
        const slugMatch = chunk.match(/"slug":"([^"]+)"/);
        const titleMatch = chunk.match(/"title":("([^"]*)"|null)/);
        const coinMatch = chunk.match(/"coinValue":(\d+)/);
        
        if (slugMatch && numMatch && idMatch) {
          const chapterSlug = slugMatch[1];
          const number = numMatch[1];
          const chId = idMatch[1];
          
          if (chId === seriesId || chId.includes('wpser_') || chapterSlug.includes('/') || !chapterSlug) {
            continue;
          }
          
          let title = null;
          if (titleMatch) {
            title = titleMatch[1] === 'null' ? null : titleMatch[2];
          }
          
          let cleanedTitle = title;
          try {
            if (cleanedTitle && cleanedTitle.includes('\\u')) {
              cleanedTitle = JSON.parse(`"${cleanedTitle}"`);
            }
          } catch (_) {}

          const coinValue = coinMatch ? parseInt(coinMatch[1], 10) : 0;
          const isLocked = coinValue > 0;
          
          const name = cleanedTitle ? `الفصل ${number}: ${cleanedTitle}` : `الفصل ${number}`;
          const fullUrl = `${BASE_URL}/series/${slug}/${chapterSlug}`;

          jsonChapters.push({
            id: chapterSlug,
            name,
            url: fullUrl,
            isLocked
          });
        }
      }
    }

    // Merge HTML chapters and JSON chapters, prioritizing JSON data for details and HTML for locking status
    const uniqueChapters = new Map<string, Chapter>();
    
    // Add HTML chapters first
    for (const ch of htmlChapters) {
      uniqueChapters.set(ch.id, ch);
    }
    
    // Merge JSON chapters
    for (const ch of jsonChapters) {
      const existing = uniqueChapters.get(ch.id);
      if (existing) {
        if (ch.isLocked) {
          existing.isLocked = true;
        }
        if (ch.name && ch.name.length > existing.name.length) {
          existing.name = ch.name;
        }
      } else {
        uniqueChapters.set(ch.id, ch);
      }
    }
    
    const chapters = Array.from(uniqueChapters.values());
    
    // Sort oldest-to-newest numerically
    chapters.sort((a, b) => getChapterNumber(a.name, a.id) - getChapterNumber(b.name, b.id));

    return {
      id: slug,
      title,
      cover: normalizeUrl(cover, BASE_URL),
      description,
      url: mangaUrl,
      chapters
    };
  },

  async parseChapterPages(chapterUrl: string): Promise<ChapterPage[]> {
    const response = await proxiedFetch(chapterUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (!src) return;

      // Filter out logos, header/footer branding, or avatar images
      if (src.includes('/avatars/') || src.includes('/logo/') || src.includes('/brands/') || src.includes('/users/') || src.includes('logo-')) {
        return;
      }

      // Identify candidates by common chapter reader paths or alt keywords
      const hasPageKeyword = src.includes('/pages/') || src.includes('/WP-manga/') || src.includes('/wp-manga/') || src.includes('/uploads/') || src.includes('mangatuk.com/axis');
      const hasPageAlt = alt.includes('الصفحة') || alt.includes('صفحة') || alt.toLowerCase().includes('page');

      if (hasPageKeyword || hasPageAlt) {
        const fullUrl = normalizeUrl(src, BASE_URL);
        if (!pages.some(p => p.url === fullUrl)) {
          pages.push({ url: fullUrl });
        }
      }
    });

    return pages;
  },
};
