import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testAnimerco() {
  const url = 'https://eta.animerco.org/animes/bleach/';
  console.log('Fetching', url);
  
  // Try via codetabs proxy first
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
  const res = await retryFetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('Title (codetabs):', $('title').text());
}

testAnimerco();
