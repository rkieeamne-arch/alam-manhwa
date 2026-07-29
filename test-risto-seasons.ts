import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testRistoSeries(url: string) {
  console.log('=== Checking RistoAnime Series:', url, '===');
  const res = await retryFetch(url);
  if (!res.ok) {
    console.log('HTTP', res.status);
    return;
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // Print all section titles or h2/h3/h4/h5/widget titles
  console.log('--- Headings / Titles ---');
  $('h1, h2, h3, h4, h5, .title, .widget-title, .section-title, .block-title, .heading').each((_, el) => {
    const txt = $(el).text().trim().replace(/\s+/g, ' ');
    if (txt && txt.length < 60) {
      console.log('Title:', $(el).prop('tagName'), '| class:', $(el).attr('class'), '| text:', txt);
    }
  });

  // Find all links containing /series/ or /anime/ in the document
  console.log('\n--- All /series/ or /anime/ links ---');
  $('a[href*="/series/"], a[href*="/anime/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim().replace(/\s+/g, ' ');
    const parentClass = $(a).parent().attr('class') || $(a).closest('div, section, ul, li').attr('class') || '';
    const img = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';
    if (href !== 'https://ristoanime.me/series/' && href !== url && href !== `${url}/`) {
      console.log('Link:', href, '| Text:', text, '| Parent:', parentClass, '| Img:', img);
    }
  });
}

async function main() {
  await testRistoSeries('https://ristoanime.me/series/kimetsu-no-yaiba-movie-1-mugenjou-hen-akaza-sairai/');
  await testRistoSeries('https://ristoanime.me/series/mushoku-tensei-isekai-ittara-honki-dasu-season-2/');
  await testRistoSeries('https://ristoanime.me/series/bleach-sennen-kessen-hen/');
}

main();
