import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await proxiedFetch('https://ristoanime.me/');
    console.log('WitAnime Status:', res.status);
    const html = await res.text();
    console.log('WitAnime HTML length:', html.length);
    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());
    const items: string[] = [];
    $('.CARTA, .MovieItem, .animiyat, a.CARTA, .anime-card').each((_, el) => {
      const title = $(el).find('h3, h4, .title').first().text().trim();
      if (title) items.push(title);
    });
    console.log('Found items:', items.slice(0, 5));
  } catch (err) {
    console.error('WitAnime error:', err);
  }
}
test();
