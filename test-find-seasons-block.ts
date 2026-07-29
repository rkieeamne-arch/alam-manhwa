import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

async function checkUrl(url: string) {
  console.log('\n====================================');
  console.log('Fetching:', url);
  try {
    const res = await retryFetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);

    // Look for headings or elements containing "مواسم" or "موسم" or "أجزاء" or "اجزاء" or "مرتبط" or "related"
    console.log('Page Title:', $('title').text());

    $('*:contains("مواسم"), *:contains("المواسم"), *:contains("أجزاء"), *:contains("أخرى")').each((_, el) => {
      const ownText = $(el).clone().children().remove().end().text().trim();
      if (ownText && (ownText.includes('مواسم') || ownText.includes('المواسم') || ownText.includes('أجزاء') || ownText.includes('موسم'))) {
        console.log('Heading/Label:', el.tagName, '| Class:', $(el).attr('class'), '| Text:', ownText);
        // Look at parent / sibling elements for links
        const parent = $(el).parent();
        const links = parent.find('a');
        links.each((_, a) => {
          console.log('   -> Related Link:', $(a).attr('href'), '| Title:', $(a).text().trim().replace(/\s+/g, ' '));
        });
      }
    });

    // Check witanime / anime4up / ristoanime related containers
    $('.related-anime, .anime-seasons, .seasons-list, .related-posts, .related-series, .series-seasons, .anime-related, .related_posts, .mowasem, .seasons').each((_, el) => {
      console.log('Container found:', $(el).attr('class'));
      $(el).find('a').each((_, a) => {
        console.log('   [Container Link]:', $(a).attr('href'), '| Text:', $(a).text().trim().replace(/\s+/g, ' '));
      });
    });

  } catch (err) {
    console.error('Error fetching', url, err);
  }
}

async function main() {
  await checkUrl('https://witanime.cy/anime/boku-no-hero-academia-7th-season/');
  await checkUrl('https://witanime.cy/anime/kimetsu-no-yaiba-hashira-geiko-hen/');
  await checkUrl('https://ristoanime.me/series/kimetsu-no-yaiba/');
  await checkUrl('https://anime4up.tv/anime/boku-no-hero-academia-7th-season/');
}

main();
