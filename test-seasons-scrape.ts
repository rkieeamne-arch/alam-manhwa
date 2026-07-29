import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testSeasons(url: string) {
  console.log('Testing URL:', url);
  const res = await retryFetch(url);
  if (!res.ok) {
    console.log('Failed to fetch:', res.status);
    return;
  }
  const text = await res.text();
  const $ = cheerio.load(text);

  console.log('--- Page Title ---', $('title').text());

  // Search for anything related to seasons (مواسم / الموسم / season / series)
  console.log('\n--- Heading elements containing مواسم or الموسم ---');
  $('*:contains("مواسم"), *:contains("المواسم"), *:contains("موسم")').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text.length < 100) {
      console.log('Found tag:', el.tagName, 'Class:', $(el).attr('class'), 'Text:', text.substring(0, 80));
    }
  });

  console.log('\n--- Searching containers around seasons ---');
  $('.seasons-list, .seasons, .other-seasons, .anime-seasons, .SeasonsList, .related-seasons, .series-seasons, .post-seasons, .anime-parts, .parts').each((_, el) => {
    console.log('Season container class:', $(el).attr('class'));
    $(el).find('a').each((_, a) => {
      console.log('Season link:', $(a).attr('href'), '| Title:', $(a).text().trim());
    });
  });

  console.log('\n--- Links with /series/ or /anime/ in page ---');
  const seriesLinks: { href: string; text: string; parentClass: string }[] = [];
  $('a[href*="/series/"], a[href*="/anime/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    const parentClass = $(el).parent().attr('class') || $(el).closest('div, section, ul').attr('class') || '';
    seriesLinks.push({ href, text, parentClass });
  });
  console.log('Total series links found:', seriesLinks.length);
  console.log('Sample series links:', seriesLinks.slice(0, 15));
}

async function main() {
  await testSeasons('https://ristoanime.me/series/one-piece/');
  await testSeasons('https://ristoanime.me/series/kimetsu-no-yaiba/');
}

main();
