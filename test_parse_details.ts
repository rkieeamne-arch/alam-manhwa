import { sources } from './src/sources/index';
async function run() {
  const handler = sources['witanime'];
  const res = await handler.parseMangaDetails('https://witanime.you/anime/one-piece/');
  console.log('Chapters:', res.chapters?.length);
  if (res.chapters && res.chapters.length > 0) {
    console.log(res.chapters.slice(0, 5));
  }
}
run();
