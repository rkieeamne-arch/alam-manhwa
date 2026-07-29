import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testSearch(title: string) {
  // Clean title to get core name (remove episode, season 2, movie, etc.)
  const coreName = title
    .replace(/(الموسم|الموسم الثاني|الموسم الثالث|الموسم الرابع|الموسم الخامس|الموسم السادس|Season \d+|Part \d+|Movie \d+|فيلم|الحلقة \d+).*/gi, '')
    .replace(/ - .*/, '')
    .trim();

  console.log('Searching for core name:', coreName, 'from title:', title);
  const searchUrl = `https://ristoanime.me/?s=${encodeURIComponent(coreName)}`;
  const res = await retryFetch(searchUrl);
  if (!res.ok) {
    console.log('Search HTTP', res.status);
    return [];
  }
  const text = await res.text();
  const $ = cheerio.load(text);

  const results: { title: string; url: string; coverUrl?: string }[] = [];
  $('a[href*="/series/"], a[href*="/anime/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!href || href === 'https://ristoanime.me/series/') return;
    const itemTitle = $(a).find('h3, h4, h5, .title, .name').text().trim() || $(a).attr('title') || $(a).text().trim().replace(/\s+/g, ' ');
    const coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';

    if (itemTitle && itemTitle.length > 2 && !results.some(r => r.url === href)) {
      results.push({
        title: itemTitle,
        url: href,
        coverUrl: coverUrl || undefined
      });
    }
  });

  console.log(`Found ${results.length} related anime/seasons for "${coreName}":`);
  for (const r of results) {
    console.log(' -', r.title, '|', r.url);
  }
  return results;
}

async function main() {
  await testSearch('Kimetsu no Yaiba Movie 1');
  await testSearch('Mushoku Tensei Season 2');
  await testSearch('Bleach Sennen Kessen-hen');
}

main();
