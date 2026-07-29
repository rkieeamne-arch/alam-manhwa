import { retryFetch } from './src/utils/scraperUtils.ts';
import * as cheerio from 'cheerio';

export interface RelatedSeason {
  id: string;
  title: string;
  url: string;
  coverUrl?: string;
  type?: string;
}

function parseRelatedSeasons($: cheerio.CheerioAPI, currentTitle: string, currentUrl: string): RelatedSeason[] {
  const seasons: RelatedSeason[] = [];
  const addedUrls = new Set<string>([currentUrl, currentUrl.replace(/\/$/, ''), `${currentUrl}/`]);

  // 1. Look for dedicated containers
  const containerSelectors = [
    '.related-anime', '.anime-seasons', '.seasons-list', '.related-series',
    '.related_posts', '.series-seasons', '.seasons', '.other-seasons',
    '#seasons', '.anime-relations', '.related-list', '.mowasem',
    '.related-content', '.related_anime', '.anime-parts', '.parts-list',
    '.series-parts', '.mowasem-list', '.seasons-container', '.related-box'
  ].join(', ');

  $(containerSelectors).find('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!href || addedUrls.has(href) || addedUrls.has(href.replace(/\/$/, ''))) return;
    if (href.includes('/episode/') || href.includes('/watch') || href.startsWith('#')) return;

    let title = $(a).find('h3, h4, h5, .title, .season-title, .name').text().trim() ||
                $(a).attr('title') || $(a).text().trim().replace(/\s+/g, ' ');

    if (!title || title.length < 2) return;
    const coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';

    seasons.push({
      id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
      title,
      url: href,
      coverUrl: coverUrl || undefined,
      type: title.includes('فيلم') ? 'فيلم' : title.includes('أونا') ? 'أونا' : title.includes('موسم') ? 'موسم' : 'مواسم أخرى'
    });
    addedUrls.add(href);
    addedUrls.add(href.replace(/\/$/, ''));
  });

  // 2. Look for headers containing season keywords and extract nearby links
  if (seasons.length === 0) {
    $('h1, h2, h3, h4, h5, h6, div, span, .widget-title, .title').each((_, el) => {
      const ownText = $(el).clone().children().remove().end().text().trim();
      if (
        ownText.includes('مواسم') || ownText.includes('المواسم') ||
        ownText.includes('أجزاء') || ownText.includes('الأجزاء') ||
        ownText.includes('سلاسل') || ownText.includes('مرتبطة') ||
        ownText.toLowerCase().includes('seasons') || ownText.toLowerCase().includes('related')
      ) {
        // Search in parent or next sibling for links
        const parent = $(el).closest('div, section, ul, article, aside');
        parent.find('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          if (!href || addedUrls.has(href) || addedUrls.has(href.replace(/\/$/, ''))) return;
          if (href.includes('/episode/') || href.includes('/watch') || href.startsWith('#')) return;

          let title = $(a).find('h3, h4, h5, .title, .season-title, .name').text().trim() ||
                      $(a).attr('title') || $(a).text().trim().replace(/\s+/g, ' ');

          if (!title || title.length < 2 || title.includes('الرئيسية') || title.includes('قائمة')) return;
          const coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';

          seasons.push({
            id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
            title,
            url: href,
            coverUrl: coverUrl || undefined,
            type: title.includes('فيلم') ? 'فيلم' : title.includes('أونا') ? 'أونا' : 'مواسم أخرى'
          });
          addedUrls.add(href);
          addedUrls.add(href.replace(/\/$/, ''));
        });
      }
    });
  }

  // 3. Search all /series/ or /anime/ links on the page that mention "الموسم" or season numbers or related titles in their text or URL
  $('a[href*="/series/"], a[href*="/anime/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!href || addedUrls.has(href) || addedUrls.has(href.replace(/\/$/, ''))) return;
    if (href.includes('/category/') || href.includes('/tag/') || href === 'https://ristoanime.me/series/') return;

    const text = $(a).text().trim().replace(/\s+/g, ' ');
    if (text.includes('الموسم') || text.includes('موسم') || text.includes('فيلم') || text.includes('Movie') || text.includes('Season') || text.includes('Part')) {
      const coverUrl = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';
      seasons.push({
        id: `season-${href.split('/').filter(Boolean).pop() || Math.random()}`,
        title: text,
        url: href,
        coverUrl: coverUrl || undefined,
        type: text.includes('فيلم') ? 'فيلم' : 'مواسم أخرى'
      });
      addedUrls.add(href);
      addedUrls.add(href.replace(/\/$/, ''));
    }
  });

  return seasons;
}

async function test() {
  const urls = [
    'https://ristoanime.me/series/kimetsu-no-yaiba-movie-1-mugenjou-hen-akaza-sairai/',
    'https://ristoanime.me/series/mushoku-tensei-isekai-ittara-honki-dasu-season-2/',
    'https://ristoanime.me/series/one-piece/'
  ];

  for (const url of urls) {
    const res = await retryFetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);
    const title = $('h1').first().text().trim();
    const seasons = parseRelatedSeasons($, title, url);
    console.log(`\nURL: ${url}`);
    console.log(`Title: ${title}`);
    console.log(`Found ${seasons.length} related seasons:`, seasons);
  }
}

test();
