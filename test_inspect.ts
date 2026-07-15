import { proxiedFetch } from './src/sources/fetch';
import * as cheerio from 'cheerio';

async function inspectWit() {
  try {
    const url = 'https://witanime.cam/%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D8%A7%D9%86%D9%85%D9%8A/';
    console.log('Fetching:', url);
    const res = await proxiedFetch(url);
    console.log('Status:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('Checking anchors in elements:');
    $('.anime-card-container, .cat-post-thumbnail, .post-category-thumbnail, .content.category-posts .row > div, .cat-post-details, .post-item, .post-card, .hentry, .post, article').each((i, el) => {
      const container = $(el);
      const anchor = container.find('a').first();
      const href = anchor.attr('href') || '';
      const text = container.text().trim().substring(0, 50).replace(/\s+/g, ' ');
      console.log(`Element ${i}: href="${href}", text="${text}"`);
    });
  } catch (e) {
    console.error(e);
  }
}

inspectWit();
