import { sources } from './src/sources';

const azora = sources['azorafly'];
if (azora) {
  azora.parseMangaDetails('https://azorafly.com/series/return-of-the-mount-hua-sect-76', azora).then(m => {
    console.log("Found chapters:", m.chapters.length);
  });
}
