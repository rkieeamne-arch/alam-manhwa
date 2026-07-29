import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function testRoute(url: string) {
  try {
    const res = await proxiedFetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    console.log(`URL: ${url} | Title: ${title}`);
    const items: string[] = [];
    $('a[href*="/anime/"], a[href*="/animes/"], .anime-card, .item, article').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) items.push(text);
    });
    console.log(`Items count: ${items.length}, Sample:`, items.slice(0, 4));
  } catch (err: any) {
    console.log(`URL: ${url} | Error: ${err.message}`);
  }
}

async function run() {
  await testRoute('https://animerco.net/');
  await testRoute('https://animerco.net/?s=bleach');
  await testRoute('https://animerco.net/anime-list/');
}
run();
