import { proxiedFetch } from './src/sources/fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://w1.anime4up.rest/home8/';
  console.log('Fetching:', url);
  try {
    const res = await proxiedFetch(url);
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    const $ = cheerio.load(html);
    
    console.log('Title:', $('title').text());
    
    // Look for links to episodes/anime
    console.log('Inspecting potential anime cards/links:');
    let count = 0;
    $('a').each((_, el) => {
      if (count++ > 10) return;
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      console.log('Link:', href, 'Text:', text.slice(0, 50));
    });

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();
