import { proxiedFetch } from './src/sources/fetch.ts';

const list = [
  'https://anime3rb.com/',
  'https://anime3rb.net/',
  'https://gateanime.com/',
  'https://okanime.org/',
  'https://animelek.me/',
  'https://faselhd.app/',
  'https://witanime.pics/',
  'https://ristoanime.me/',
  'https://anime4up.org/',
  'https://anime4up.life/'
];

async function test() {
  for (const url of list) {
    try {
      const res = await proxiedFetch(url);
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title';
      console.log(`URL: ${url} -> Status: ${res.status} | Title: ${titleMatch.trim().substring(0, 50)}`);
    } catch (err: any) {
      console.log(`URL: ${url} -> Error: ${err.message}`);
    }
  }
}
test();
