import { scrapeMangaList } from './src/utils/scraper';
import { defaultScraperSources } from './src/data';

async function testScraper() {
  try {
    const witanimeSource = defaultScraperSources.find(s => s.id === 'witanime');
    if (!witanimeSource) {
      console.log('witanime source not found!');
      return;
    }
    console.log('Testing scrapeMangaList for:', witanimeSource.name);
    const results = await scrapeMangaList(witanimeSource, 1);
    console.log('Parsed items count:', results.length);
    if (results.length > 0) {
      console.log('First 3 items:', JSON.stringify(results.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

testScraper();
