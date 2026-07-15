import { sources } from './src/sources/index';
async function run() {
  const handler = sources['witanime'];
  const res = await handler.parseChapterPages("https://witanime.cam/episode/one-piece-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1169/");
  console.log(res);
}
run();
