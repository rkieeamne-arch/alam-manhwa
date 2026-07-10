// Allow self-signed or unauthorized certificates for scrapers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

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

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': referer,
        'Upgrade-Insecure-Requests': '1',
      };

      const controller = new AbortController();
      // Increase timeout to 20 seconds to prevent premature aborts on slow external sites like azorafly
      const timeout = setTimeout(() => controller.abort(), 20000); 

      const response = await fetch(targetUrl, { 
        headers,
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeout);

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
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'انتهت مهلة الاتصال بالموقع المصدر (20 ثانية). يبدو أن السيرفر بطيء جداً حالياً أو قام بحظر الاتصال من منطقتك.' });
      }
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        return res.status(404).json({ error: `تعذر العثور على عنوان الموقع (${targetUrl}). تأكد من صحة الرابط أو أن الموقع لا يزال قيد العمل.` });
      }
      return res.status(500).json({ error: `خطأ أثناء جلب المحتوى الخارجي: ${err.message || 'خطأ غير معروف'}` });
    }
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
