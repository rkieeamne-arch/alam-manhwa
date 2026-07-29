import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function testPage(url: string) {
  const res = await retryFetch(url);
  const text = await res.text();
  const $ = cheerio.load(text);

  console.log('=== HTML HEADINGS & SECTIONS for', url, '===');
  $('h1, h2, h3, h4, h5, h6, .widget-title, .title, .block-title, .section-title').each((_, el) => {
    console.log($(el).prop('tagName'), '| class:', $(el).attr('class'), '| text:', $(el).text().trim().replace(/\s+/g, ' '));
  });

  console.log('\n=== ALL CONTAINERS WITH "مواسم" or "انمي" or "مرتبطة" or "related" or "seasons" ===');
  $('*').each((_, el) => {
    const className = $(el).attr('class') || '';
    const idName = $(el).attr('id') || '';
    if (className.toLowerCase().includes('season') || className.toLowerCase().includes('related') || idName.toLowerCase().includes('season') || idName.toLowerCase().includes('related')) {
      console.log('Found container class:', className, 'id:', idName);
    }
  });

  console.log('\n=== ALL LINKS IN THE MAIN CONTENT BODY ===');
  $('.post-content, .entry-content, .anime-info, .anime-details, .info-content, .single-content, article, main').find('a').each((_, a) => {
    console.log('Link:', $(a).attr('href'), '| Text:', $(a).text().trim().replace(/\s+/g, ' '));
  });
}

testPage('https://ristoanime.me/series/kimetsu-no-yaiba-movie-1-mugenjou-hen-akaza-sairai/');
