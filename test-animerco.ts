import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testAnimerco() {
  const url = 'https://eta.animerco.org/animes/bleach/';
  console.log('Fetching', url);
  const res = await retryFetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('Title:', $('title').text());
  
  // Try to find episodes
  console.log('--- Links ---');
  $('a').each((_, a) => {
    const href = $(a).attr('href');
    if (href && (href.includes('episode') || href.includes('watch') || href.includes('الحلقة'))) {
      console.log('Link:', href, $(a).text().trim().replace(/\s+/g, ' '));
    }
  });

  console.log('--- Servers ---');
  // Usually inside episode pages
}

testAnimerco();
