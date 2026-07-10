import { scrapeMangaList } from './src/utils/scraper';
import { defaultScraperSources } from './src/data';

async function run() {
  const q = "martial";
  try {
    const res = await scrapeMangaList(defaultScraperSources[1], 1, q); // olympus
    console.log("Olympus Search:", res.length);
  } catch(e) { console.error("Olympus Error", e); }

  try {
    const res2 = await scrapeMangaList(defaultScraperSources[0], 1, q); // azorafly
    console.log("Azora Search:", res2.length);
  } catch(e) { console.error("Azora Error", e); }
}
run();
