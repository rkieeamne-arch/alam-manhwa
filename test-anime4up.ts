import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await proxiedFetch('https://w1.anime4up.rest/');
    console.log('Anime4up Status:', res.status);
    const html = await res.text();
    console.log('Anime4up HTML length:', html.length);
    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());
    const items: string[] = [];
    $('.anime-card-container, .anime-post, article, .item').each((_, el) => {
      const title = $(el).find('h3, .title, a').first().text().trim();
      if (title) items.push(title);
    });
    console.log('Found items:', items.slice(0, 5));
  } catch (err) {
    console.error('Anime4up error:', err);
  }
}
test();
