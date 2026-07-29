import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function run() {
  const res = await proxiedFetch('https://animerco.net/');
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log('HTML snippet around links:');
  $('a').slice(0, 30).each((_, el) => {
    console.log($(el).attr('href'), '|', $(el).text().trim().substring(0, 30));
  });
}
run();
