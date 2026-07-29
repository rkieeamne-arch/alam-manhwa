import { proxiedFetch } from './src/sources/fetch.ts';
import * as cheerio from 'cheerio';

async function run() {
  try {
    const res = await proxiedFetch('https://animerco.com/trending');
    console.log('Animerco.com Status:', res.status);
    const html = await res.text();
    console.log('Animerco.com HTML length:', html.length);
    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());
    $('a').slice(0, 20).each((_, el) => {
      console.log($(el).attr('href'), '|', $(el).text().trim().substring(0, 30));
    });
  } catch (err: any) {
    console.error('Animerco.com error:', err.message);
  }
}
run();
