import { sources } from './src/sources/index';
async function run() {
  const handler = sources['generic'];
  // We need to provide the source structure
  const source = {
    id: 'anime4up',
    name: 'Anime4up',
    baseUrl: 'https://w1.anime4up.rest',
    type: 'anime',
    detailChapterItemSelector: 'a[href*="/episode/"]',
    detailChapterTitleSelector: 'span',
    detailChapterLinkSelector: '',
    pageImgSelector: 'iframe'
  };
  const res = await handler.parseChapterPages('https://w1.anime4up.rest/episode/%d8%a7%d9%86%d9%85%d9%8a-rezero-kara-hajimeru-isekai-seikatsu-4th-season-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-6-%d9%85%d8%aa%d8%b1%d8%ac%d9%85%d8%a9/', source as any);
  console.log('Pages:', res.length);
  if (res.length > 0) {
    console.log(res);
  }
}
run();
