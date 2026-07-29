import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await proxiedFetch('https://animerco.net/animes/');
    console.log('Animerco.net Status:', res.status);
    const html = await res.text();
    console.log('Animerco.net HTML length:', html.length);
    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());
    
    const items: string[] = [];
    $('.anime-card, .post-item, .item, .box-item, article, .anime-post, .col-md-2').each((_, el) => {
      const title = $(el).find('h3, h4, .title, .anime-title, a').first().text().trim();
      if (title) items.push(title);
    });
    console.log('Found items count:', items.length);
    console.log('Sample items:', items.slice(0, 8));
  } catch (err) {
    console.error('Animerco error:', err);
  }
}
test();
