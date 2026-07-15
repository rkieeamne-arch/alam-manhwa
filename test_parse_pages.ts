import { sources } from './src/sources/index';
async function run() {
  const handler = sources['witanime'];
  const res = await handler.parseChapterPages('https://witanime.you/episode/one-piece-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1/');
  console.log('Pages:', res.length);
  if (res.length > 0) {
    console.log(res);
  }
}
run();
