import { proxiedFetch } from './src/sources/fetch.ts';

const urlsToTest = [
  'https://eta.animerco.org/animes/',
  'https://animerco.org/',
  'https://animerco.net/',
  'https://w1.anime4up.rest/',
  'https://anime4up.tv/',
  'https://w.anime4up.rest/',
  'https://w1.anime4up.com/',
  'https://ristoanime.me/',
  'https://witanime.pics/',
  'https://witanime.art/'
];

async function run() {
  for (const url of urlsToTest) {
    try {
      const res = await proxiedFetch(url);
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title';
      console.log(`URL: ${url} | Status: ${res.status} | Title: ${titleMatch.trim()}`);
    } catch (err: any) {
      console.log(`URL: ${url} | Error: ${err.message}`);
    }
  }
}
run();
