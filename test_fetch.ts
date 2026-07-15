import { proxiedFetch } from './src/sources/fetch';
async function run() {
  try {
    const res = await proxiedFetch('https://witanime.cam/');
    console.log(res.status, res.statusText);
    const html = await res.text();
    console.log('Length:', html.length);
    console.log('Includes anime-card-container:', html.includes('anime-card-container'));
  } catch (err) {
    console.error(err);
  }
}
run();
