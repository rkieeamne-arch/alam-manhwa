import { sources } from './src/sources';
import { sortNumerically } from './src/utils/scraperUtils';

const azora = sources['azorafly'];
if (azora) {
  azora.parseMangaDetails('https://azorafly.com/series/return-of-the-mount-hua-sect-76', azora).then(m => {
    const uniqueChapters = m.chapters;
    const sorted = sortNumerically(uniqueChapters.map((ch, idx) => ({ ...ch })));
    console.log("Sorted count:", sorted.length);
    console.log("First 3:", sorted.slice(0, 3).map(c => c.name));
    console.log("Last 3:", sorted.slice(-3).map(c => c.name));
  });
}
