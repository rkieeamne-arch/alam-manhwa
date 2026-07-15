import { sources } from './src/sources/index';
async function run() {
  const handler = sources['witanime'];
  const res = await handler.parsePopularList(1);
  console.log('Results:', res.length);
  if (res.length > 0) {
    console.log(res[0]);
  }
}
run();
