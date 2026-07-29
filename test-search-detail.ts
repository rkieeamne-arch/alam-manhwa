import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function searchRisto(query: string) {
  console.log('\n====================================');
  console.log('Searching Risto for:', query);
  const searchUrl = `https://ristoanime.me/?s=${encodeURIComponent(query)}`;
  const res = await retryFetch(searchUrl);
  if (!res.ok) return;
  const text = await res.text();
  const $ = cheerio.load(text);

  console.log('Search page title:', $('title').text());

  // Print all cards / links found in search
  $('.post-item, .anime-card, .block-item, .card, article, .SlideItem, .MovieItem, .MvCv').each((_, el) => {
    const link = $(el).find('a').attr('href') || '';
    const title = $(el).find('h3, h4, h5, .title, .name').text().trim().replace(/\s+/g, ' ') || $(el).text().trim().replace(/\s+/g, ' ');
    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    if (link) {
      console.log('Card -> Title:', title.substring(0, 60), '| Link:', link, '| Img:', img);
    }
  });

  // Also print all a tags with /series/
  console.log('\n--- All /series/ links in search result ---');
  $('a[href*="/series/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const txt = $(a).text().trim().replace(/\s+/g, ' ');
    if (href !== 'https://ristoanime.me/series/') {
      console.log('Series Link:', href, '| Text:', txt);
    }
  });
}

async function main() {
  await searchRisto('Kimetsu');
  await searchRisto('Bleach');
  await searchRisto('One Piece');
}

main();
