// Allow self-signed or unauthorized certificates for scrapers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mockManhuas } from './src/data';
import { scrapePopularList, scrapeMangaDetails, scrapeMangaChapters, scrapeChapterPages } from './src/utils/scraper';
import { sources } from './src/sources';
// Caching for dynamic sitemap generator
let sitemapSlugsCache: string[] = [];
let lastSitemapFetchTime = 0;
const SITEMAP_CACHE_TTL = 1800000; // 30 minutes

const FALLBACK_SLUGS = [
  'tears-on-a-withered-flower',
  'love-junkie',
  'my-disciples-are-all-villains',
  'childhood-friend-complex',
  'vengeance-named-love',
  'beyond-the-walls-of-the-dukes-mansion',
  'full-time-sword-cultivator',
  'ex-husband-demands-reunion',
  'almighty-daughter-runs-the-world-2',
  'i-am-the-fated-villain',
  'my-secret-cupid',
  'perfect-seniors-hide',
  'imperfect-cinderella-story',
  'to-the-one-without-virtue',
  'zomgan',
  'unbeknownst-to-me-i-am-secretly-dating-the-emperor',
  'the-apocalypse-needs-a-pro',
  'marriage-situation'
];

async function fetchSitemapSlugs(): Promise<string[]> {
  const targetUrl = 'https://mangatuk.com/sitemaps/series/0';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
    'Referer': 'https://www.google.com/'
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const res = await fetch(targetUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const xml = await res.text();
      const slugs = new Set<string>();
      const matches = xml.matchAll(/https:\/\/mangatuk\.com\/series\/([^\s<"'/]+)/g);
      for (const match of matches) {
        const slug = match[1].trim();
        if (slug && !slug.includes('/') && slug !== 'series') {
          slugs.add(slug);
        }
      }
      const list = Array.from(slugs);
      if (list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn('[Sitemap Dynamic Fetch] Failed:', e);
  }
  return [];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware for Auth
  async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Return mock user immediately
    (req as any).user = { id: 'local-user' };
    next();
  }

  // XP route
  app.post('/api/xp/add', authenticate, async (req, res) => {
    res.json({ success: true });
  });

  // Comments route
  app.post('/api/comments', authenticate, async (req, res) => {
    res.json({ success: true });
  });

  // Support Ticket route
  app.post('/api/support/ticket', async (req, res) => {
    const { name, email, type, subject, message, imageBase64, imageName } = req.body;

    if (!name || !email || !subject) {
      return res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، والموضوع).' });
    }

    try {
      const typeLabel = type === 'complaint' ? 'شكوى ⚠️' : type === 'suggestion' ? 'اقتراح 💡' : 'سؤال ❓';
      
      // Construct email body content
      let emailMessage = `الاسم الكامل: ${name}\n` +
                         `البريد الإلكتروني للارسال: ${email}\n` +
                         `نوع التذكرة: ${typeLabel}\n\n` +
                         `الموضوع والتفاصيل:\n-------------------------\n${subject}\n-------------------------\n`;
                         
      if (imageBase64) {
        emailMessage += `\n[ملاحظة: تم إرفاق صورة مع التذكرة باسم "${imageName || 'صورة_توضيحية.png'}"]\n`;
      }

      const formSubmitData: any = {
        _subject: `[تذكرة دعم - عالم المانهو] ${typeLabel}: ${subject.slice(0, 40)}`,
        name: name,
        email: email,
        message: emailMessage,
        _honey: "" // Spam protection honeypot field
      };

      // Add attached base64 image if exists and valid size
      if (imageBase64) {
        formSubmitData.attachment = imageBase64;
      }

      // Call FormSubmit API securely from the server
      const response = await fetch('https://formsubmit.co/ajax/rkieeamne@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formSubmitData)
      });

      if (response.ok) {
        return res.json({ success: true, message: 'تم إرسال التذكرة بنجاح!' });
      } else {
        const errorText = await response.text();
        console.error('[Support API] FormSubmit error:', errorText);
        // Fallback or retry or report error
        return res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب على السيرفر الخارجي.' });
      }
    } catch (err: any) {
      console.error('[Support API] Exception:', err);
      return res.status(500).json({ error: `فشل الاتصال بسيرفر الإرسال: ${err.message}` });
    }
  });

  // API routes
  app.get('/api/home', async (req, res) => {
    try {
      const source = { id: 'azorafly', baseUrl: 'https://azorafly.com', type: 'manga' } as any;
      let data = await scrapePopularList(source, undefined, 1);
      if (!data || data.length === 0) {
        const fallbackSource = { id: 'mangatuk', baseUrl: 'https://mangatuk.com', type: 'manga' } as any;
        data = await scrapePopularList(fallbackSource, undefined, 1);
      }
      res.json(data || []);
    } catch (err) {
      console.warn('[Server] /api/home failed:', err);
      res.json([]);
    }
  });

  app.get('/api/search', async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    try {
      const source = { id: 'azorafly', baseUrl: 'https://azorafly.com', type: 'manga' } as any;
      let data = await scrapePopularList(source, query, 1);
      if (!data || data.length === 0) {
        const fallbackSource = { id: 'mangatuk', baseUrl: 'https://mangatuk.com', type: 'manga' } as any;
        data = await scrapePopularList(fallbackSource, query, 1);
      }
      res.json(data || []);
    } catch (err) {
      console.warn('[Server] /api/search failed:', err);
      res.json([]);
    }
  });

  app.get('/api/manhwa/:id', async (req, res) => {
    const sourceUrl = req.query.sourceUrl as string;
    if (!sourceUrl) return res.status(400).json({ error: 'sourceUrl required' });
    try {
      const source = { id: 'azorafly', baseUrl: 'https://azorafly.com', type: 'manga' } as any;
      const data = await scrapeMangaDetails(source, sourceUrl);
      res.json(data);
    } catch (err) {
      console.warn('[Server] /api/manhwa/:id failed:', err);
      res.status(500).json({ error: 'Failed to fetch details' });
    }
  });

  app.get('/api/chapter/:id', async (req, res) => {
    const chapterUrl = req.query.chapterUrl as string;
    if (!chapterUrl) return res.status(400).json({ error: 'chapterUrl required' });
    try {
      const source = { id: 'azorafly', baseUrl: 'https://azorafly.com', type: 'manga' } as any;
      const data = await scrapeChapterPages(source, chapterUrl);
      res.json(data);
    } catch (err) {
      console.warn('[Server] /api/chapter/:id failed:', err);
      res.status(500).json({ error: 'Failed to fetch chapter pages' });
    }
  });

  app.get('/api/extract-video', async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'url required' });
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': url
        }
      });
      const text = await response.text();
      
      // Try to find m3u8 or mp4 in the source
      const m3u8Match = text.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      if (m3u8Match && m3u8Match[1]) {
        return res.json({ url: m3u8Match[1], type: 'm3u8' });
      }

      const mp4Match = text.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
      if (mp4Match && mp4Match[1]) {
        return res.json({ url: mp4Match[1], type: 'mp4' });
      }

      // Sometimes base64 encoded urls are inside scripts
      // Check for common jwplayer file: "..." structures
      const jwMatch = text.match(/file\s*:\s*["'](https?:\/\/[^"']+)["']/i);
      if (jwMatch && jwMatch[1]) {
        return res.json({ url: jwMatch[1], type: jwMatch[1].includes('.m3u8') ? 'm3u8' : 'video/mp4' });
      }
      
      res.json({ url: null });
    } catch (err) {
      console.warn('[Server] /api/extract-video failed:', err);
      res.json({ url: null });
    }
  });

  // CORS-bypassing proxy for dynamic scraper sources (supports GET, POST, etc.)
  app.all('/api/forward', async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Unwrap nested proxy URLs if passed accidentally
    while (targetUrl && (targetUrl.includes('/api/forward?url=') || targetUrl.includes('/api/forward%3Furl%3D'))) {
      try {
        const decoded = decodeURIComponent(targetUrl);
        const match = decoded.match(/\/api\/forward\?url=(.+)$/);
        if (match && match[1]) {
          targetUrl = match[1];
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    if (targetUrl.startsWith('//')) {
      targetUrl = 'https:' + targetUrl;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'الرابط المطلوب يجب أن يبدأ بـ http:// أو https://' });
    }

    // Reconstruct targetUrl if other query parameters were passed to the proxy directly (excluding proxy controls)
    try {
      const urlObj = new URL(targetUrl);
      Object.keys(req.query).forEach((key) => {
        if (key !== 'url' && key !== 'enhance') {
          urlObj.searchParams.set(key, req.query[key] as string);
        }
      });
      targetUrl = urlObj.toString();
    } catch {
      const extraParams = Object.keys(req.query)
        .filter((key) => key !== 'url' && key !== 'enhance')
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key] as string)}`)
        .join('&');
      if (extraParams) {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + extraParams;
      }
    }

    console.log(`[Proxy] [${req.method}] Fetching: ${targetUrl}`);

    try {
      const parsedUrl = new URL(targetUrl);
      
      // Dynamically select a Referer that bypasses anti-hotlinking
      let referer = parsedUrl.origin + '/';
      if (targetUrl.includes('azorafly.com')) {
        referer = 'https://azorafly.com/';
      } else if (targetUrl.includes('olympustaff.com')) {
        referer = 'https://olympustaff.com/';
      }

      const isImage = targetUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)($|\?)/i) != null;

      // Real-world modern desktop User-Agents to bypass simple agent blocking
      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
      ];
      const defaultUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      let userAgent = defaultUserAgent;
      if (req.headers['x-proxy-user-agent']) {
        userAgent = req.headers['x-proxy-user-agent'] as string;
      } else if (req.headers['user-agent']) {
        userAgent = req.headers['user-agent'] as string;
      }

      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': isImage 
          ? 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
          : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Referer': referer, 
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': isImage ? 'image' : 'document',
        'Sec-Fetch-Mode': isImage ? 'no-cors' : 'navigate',
        'Sec-Fetch-Site': isImage ? 'cross-site' : 'same-origin',
      };

      if (!isImage && req.method === 'GET') {
        headers['Sec-Fetch-User'] = '?1';
        headers['Upgrade-Insecure-Requests'] = '1';
      }

      if (req.headers['x-proxy-cookie']) {
        headers['Cookie'] = req.headers['x-proxy-cookie'] as string;
      }

      // Reconstruct and forward request body for POST/PUT requests
      const isPostOrPut = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
      let fetchBody: any = undefined;

      if (isPostOrPut && req.body) {
        const reqContentType = req.headers['content-type'] || '';
        headers['Content-Type'] = reqContentType;
        
        if (reqContentType.includes('application/json')) {
          fetchBody = JSON.stringify(req.body);
        } else if (reqContentType.includes('application/x-www-form-urlencoded')) {
          fetchBody = new URLSearchParams(req.body).toString();
        } else if (typeof req.body === 'string') {
          fetchBody = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          fetchBody = req.body;
        } else if (Object.keys(req.body).length > 0) {
          fetchBody = new URLSearchParams(req.body).toString();
        }
      }

      // Smart Retry Mechanism - specifically for Timeouts (تايم أوت) / Slow connections
      let response: Response | null = null;
      let lastError: any = null;
      const maxAttempts = 3;
      let attempt = 0;

      while (attempt < maxAttempts) {
        attempt++;
        const controller = new AbortController();
        // Set a 20-second timeout per attempt
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
          response = await fetch(targetUrl, { 
            method: req.method,
            headers,
            body: fetchBody,
            signal: controller.signal,
            redirect: 'follow'
          });
          clearTimeout(timeout);
          
          // If response is successful, break retry loop immediately
          if (response.ok) {
            break;
          }

          // If we got a timeout status from the upstream server, retry
          if (response.status === 504 || response.status === 408 || response.status === 502) {
            console.warn(`[Proxy] Attempt ${attempt} returned status ${response.status} for ${targetUrl}. Retrying...`);
            if (attempt < maxAttempts) {
              const delay = 1000 + Math.floor(Math.random() * 2000); // Random delay 1s-3s
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }

          // Other non-timeout errors: do not retry to avoid overloading
          break;
        } catch (err: any) {
          clearTimeout(timeout);
          lastError = err;
          
          const isTimeout = err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout');
          
          if (isTimeout) {
            console.warn(`[Proxy] Attempt ${attempt} timed out for ${targetUrl}.`);
            if (attempt < maxAttempts) {
              const delay = 1500 + Math.floor(Math.random() * 2000); // Random delay 1.5s-3.5s
              console.log(`[Proxy] Waiting ${delay}ms before retrying due to timeout...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          break; // Break on other severe network exceptions
        }
      }

      if (!response) {
        throw lastError || new Error('تعذر إكمال الطلب بسبب مشكلة في الاتصال');
      }

      if (!response.ok) {
        const errorText = await response.text();
        
        // Don't log 403 as an error if we are likely to proxy it
        if (response.status !== 403) {
            console.error(`[Proxy] Response not OK from ${targetUrl}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0, 500)}`);
        }
        
        // If the upstream site returns an error status (like 500) but still sends HTML content,
        // we can still proxy it so the scraper has a chance to parse chapters/pages from it!
        const contentType = response.headers.get('content-type') || '';
        const isHtml = contentType.includes('text/html') || errorText.trim().startsWith('<');
        if (response.status !== 404 && isHtml && errorText.length > 300) {
          // If 403, just log as info to avoid triggering error alerts
          if (response.status === 403) {
            console.log(`[Proxy] Upstream returned 403, but body is valid HTML. Proxying...`);
          } else {
            console.warn(`[Proxy] Upstream returned error status ${response.status} but sent valid HTML body. Proxying anyway...`);
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(errorText);
        }

        return res.status(response.status).json({ 
          error: `الموقع المصدر (${parsedUrl.hostname}) أعاد خطأ (${response.status} ${response.statusText || 'طلب مرفوض'}). قد يكون الموقع محجوباً في هذه المنطقة أو يتطلب حماية Cloudflare.` 
        });
      }

      // Check if the response is an image, video, or generic binary data
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image') || contentType.includes('video') || contentType.includes('application/octet-stream')) {
        // Pipe binary content directly
        const arrayBuffer = await response.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        
        let finalContentType = contentType;
        
        // Image Super Resolution / Enhancement
        const enhanceMode = req.query.enhance === '1' || req.query.enhance === 'true';
        if (enhanceMode && (contentType.includes('image') || isImage) && !contentType.includes('gif')) {
          try {
            const sharp = (await import('sharp')).default;
            const image = sharp(buffer);
            const metadata = await image.metadata();
            
            if (metadata.width && metadata.width < 1200) {
              // Apply Super Resolution Pipeline (Lanczos Upscale + Unsharp Mask)
              buffer = await image
                .resize({ width: metadata.width * 2, kernel: 'lanczos3' })
                .sharpen({ sigma: 0.8 }) // Clean sharpening
                .webp({ quality: 85 }) // Output as WebP for smaller size and speed
                .toBuffer();
              finalContentType = 'image/webp';
            } else {
              // Just apply sharpen if already large
              buffer = await image
                .sharpen({ sigma: 0.8 })
                .webp({ quality: 85 })
                .toBuffer();
              finalContentType = 'image/webp';
            }
          } catch (sharpErr) {
            console.warn('[Proxy] Sharp processing fallback to original buffer:', sharpErr?.message || sharpErr);
            // Fallback to original buffer
          }
        }
        
        res.setHeader('Content-Type', finalContentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(buffer);
      } else {
        // Return text (HTML or JSON)
        const text = await response.text();
        res.setHeader('Content-Type', contentType || 'text/html; charset=utf-8');
        return res.send(text);
      }
    } catch (err: any) {
      console.error(`[Proxy] Critical Error for ${targetUrl}:`, err);
      const isTimeout = err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout');
      if (isTimeout) {
        return res.status(504).json({ error: 'انتهت مهلة الاتصال بالموقع المصدر (20 ثانية). يبدو أن السيرفر بطيء جداً حالياً أو قام بحظر الاتصال من منطقتك.' });
      }
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        return res.status(404).json({ error: `تعذر العثور على عنوان الموقع (${targetUrl}). تأكد من صحة الرابط أو أن الموقع لا يزال قيد العمل.` });
      }
      return res.status(500).json({ error: `خطأ أثناء جلب المحتوى الخارجي: ${err.message || 'خطأ غير معروف'}` });
    }
  });

  // Dynamic Sitemap Generator for Google Search Console
  app.get('/sitemap.xml', async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'manhwa-world.onrender.com';
    const baseUrl = `${protocol}://${host}`;

    const now = Date.now();
    // If cache is empty or expired, trigger update
    if (sitemapSlugsCache.length === 0) {
      console.log('[Sitemap] Cache is empty, fetching synchronously...');
      const fetched = await fetchSitemapSlugs();
      if (fetched.length > 0) {
        sitemapSlugsCache = fetched;
        lastSitemapFetchTime = now;
      }
    } else if (now - lastSitemapFetchTime > SITEMAP_CACHE_TTL) {
      console.log('[Sitemap] Cache expired, fetching in background...');
      fetchSitemapSlugs().then(fetched => {
        if (fetched.length > 0) {
          sitemapSlugsCache = fetched;
          lastSitemapFetchTime = Date.now();
          console.log(`[Sitemap] Background cache updated with ${fetched.length} slugs.`);
        }
      }).catch(err => {
        console.warn('[Sitemap] Background fetch error:', err);
      });
    }

    // Prepare active slug list: use cache if available, otherwise fall back
    const activeSlugs = sitemapSlugsCache.length > 0 ? sitemapSlugsCache : FALLBACK_SLUGS;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // 2. Add static views
    const staticViews = ['mylists', 'history', 'search'];
    for (const view of staticViews) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/?view=${view}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    }

    // 3. Dynamic Manhua series pages
    for (const slug of activeSlugs) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/?manga=${slug}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // 4. Include Mock Manhuas if they aren't already included
    for (const manhua of mockManhuas) {
      if (!activeSlugs.includes(manhua.id)) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/?manga=${manhua.id}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  // Dynamic robots.txt serving
  app.get('/robots.txt', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'manhwa-world.onrender.com';
    const baseUrl = `${protocol}://${host}`;
    
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
