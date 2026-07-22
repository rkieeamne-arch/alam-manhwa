import { retryFetch } from './src/utils/scraperUtils';
import * as cheerio from 'cheerio';

retryFetch('https://ristoanime.me/').then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  const items = $('a.CARTA, a.bita9a-link, .MovieItem a, .animiyat a');
  if (items.length > 0) {
    const el = items.first();
    const posterEl = el.find('.poster');
    const bgUrl = posterEl.attr('data-style') || posterEl.attr('style') || '';
    const match = bgUrl.match(/url\(['"]?(.*?)['"]?\)/);
    const coverUrl = match ? match[1] : '';
    console.log("Cover URL:", coverUrl);
  }
});
