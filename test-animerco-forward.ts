import { proxiedFetch } from './src/sources/fetch.ts';

async function test() {
  try {
    const res = await proxiedFetch('https://eta.animerco.org/');
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    console.log('Title match:', html.match(/<title>(.*?)<\/title>/)?.[1]);
    
    // Also try an anime page
    const animeRes = await proxiedFetch('https://eta.animerco.org/animes/bleach/');
    const animeHtml = await animeRes.text();
    console.log('Anime HTML length:', animeHtml.length);
    console.log('Anime Title match:', animeHtml.match(/<title>(.*?)<\/title>/)?.[1]);
  } catch (err) {
    console.error(err);
  }
}
test();
