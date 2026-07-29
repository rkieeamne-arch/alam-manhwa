import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testAnime(url: string) {
  const res = await retryFetch(url);
  const text = await res.text();
  const $ = cheerio.load(text);

  let titleText = '';
  $('h1').each((_, el) => {
    const txt = $(el).text().trim();
    if (txt && txt !== 'RISTO' && txt.length > titleText.length) {
      titleText = txt;
    }
  });

  console.log('\n====================================');
  console.log('URL:', url);
  console.log('Title:', titleText);

  // Extract core title
  let core = titleText
    .replace(/^مشاهدة\s+/i, '')
    .replace(/^انمي\s+/i, '')
    .replace(/^جميع\s+حلقات\s+/i, '')
    .replace(/مترجم\s+اونلاين.*/i, '')
    .replace(/مترجم\s+اون\s+لاين.*/i, '')
    .replace(/مترجم.*/i, '')
    .replace(/(الموسم|Season|Movie|فيلم|الحلقة|Part|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الأخير).*/gi, '')
    .trim();

  // If core title is very short or generic, grab first two words
  const words = core.split(' ').filter(w => w.length > 1);
  const searchKeyword = words.slice(0, 2).join(' ') || core;

  console.log('Core keyword for search:', searchKeyword);

  const searchUrl = `https://ristoanime.me/?s=${encodeURIComponent(searchKeyword)}`;
  const searchRes = await retryFetch(searchUrl);
  if (!searchRes.ok) return;

  const sText = await searchRes.text();
  const $s = cheerio.load(sText);

  const related: { title: string; url: string; img?: string }[] = [];
  const added = new Set<string>([url.replace(/\/$/, '').toLowerCase()]);

  $s('a[href*="/series/"]').each((_, a) => {
    const href = $s(a).attr('href') || '';
    const norm = href.replace(/\/$/, '').toLowerCase();
    if (!href || added.has(norm) || href === 'https://ristoanime.me/series/') return;
    if (href.includes('/episode/') || href.includes('/watch') || href.includes('/filtering/')) return;

    let itemTitle = $s(a).find('h3, h4, h5, .title, .name').text().trim() || $s(a).attr('title') || $s(a).text().trim().replace(/\s+/g, ' ');
    itemTitle = itemTitle.replace(/^مشاهدة\s+/i, '').replace(/مترجم\s+اونلاين.*/i, '').trim();

    const img = $s(a).find('img').attr('src') || $s(a).find('img').attr('data-src') || '';

    if (itemTitle && itemTitle.length > 2) {
      related.push({ title: itemTitle, url: href, img });
      added.add(norm);
    }
  });

  console.log(`Found ${related.length} related seasons/series:`);
  for (const r of related) {
    console.log('  ->', r.title, '|', r.url);
  }
}

async function main() {
  await testAnime('https://ristoanime.me/series/kimetsu-no-yaiba-movie-1-mugenjou-hen-akaza-sairai/');
  await testAnime('https://ristoanime.me/series/one-piece/');
  await testAnime('https://ristoanime.me/series/mushoku-tensei-isekai-ittara-honki-dasu-season-2/');
}

main();
