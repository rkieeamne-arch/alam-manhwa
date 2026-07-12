// Allow self-signed or unauthorized certificates for scrapers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mockManhuas } from './src/data';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
admin.initializeApp();
const db = getFirestore();

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

  // Middleware for Auth
  async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      (req as any).user = { id: decodedToken.uid };
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // XP route
  app.post('/api/xp/add', authenticate, async (req, res) => {
    const user = (req as any).user;
    const { amount } = req.body;
    
    // XP Logic
    const userRef = db.collection('users').doc(user.id);
    await userRef.set({ xp: FieldValue.increment(amount) }, { merge: true });
    
    res.json({ success: true });
  });

  // Comments route
  app.post('/api/comments', authenticate, async (req, res) => {
    const user = (req as any).user;
    const { manhuaId, content } = req.body;
    
    await db.collection('comments').add({
      manhuaId,
      userId: user.id,
      content,
      createdAt: FieldValue.serverTimestamp()
    });
    
    // Award XP for comment
    await db.collection('users').doc(user.id).set({ xp: FieldValue.increment(3) }, { merge: true });
    
    res.json({ success: true });
  });

  // CORS-bypassing proxy for dynamic scraper sources
  app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[Proxy] Fetching: ${targetUrl}`);

    try {
      const parsedUrl = new URL(targetUrl);
      
      // Dynamically select a Referer that bypasses anti-hotlinking
      let referer = parsedUrl.origin;
      if (targetUrl.includes('azorafly.com')) {
        referer = 'https://azorafly.com/';
      } else if (targetUrl.includes('olympustaff.com')) {
        referer = 'https://olympustaff.com/';
      }

      const isImage = targetUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) != null;

      // Real-world modern desktop User-Agents to bypass simple agent blocking
      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
      ];
      const defaultUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

      const headers: Record<string, string> = {
        'User-Agent': defaultUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Referer': isImage ? referer : 'https://www.google.com/', 
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': isImage ? 'image' : 'document',
        'Sec-Fetch-Mode': isImage ? 'no-cors' : 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      };

      if (req.headers['x-proxy-cookie']) {
        headers['Cookie'] = req.headers['x-proxy-cookie'] as string;
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
            headers,
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
        console.error(`[Proxy] Response not OK from ${targetUrl}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0, 500)}`);
        return res.status(response.status).json({ 
          error: `الموقع المصدر (${parsedUrl.hostname}) أعاد خطأ (${response.status} ${response.statusText || 'طلب مرفوض'}). قد يكون الموقع محجوباً في هذه المنطقة أو يتطلب حماية Cloudflare.` 
        });
      }

      // Check if the response is an image or document
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image')) {
        // If it is an image, we can pipe or proxy the buffer directly!
        // This is extremely critical because external manga sites often block images if requested from raw external HTML.
        // Proxying the image bytes via our backend with the correct Referer is a 100% bulletproof solution for hotlinked pages!
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', contentType);
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
