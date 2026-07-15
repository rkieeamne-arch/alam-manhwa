import { proxiedFetch } from './src/sources/fetch';
import * as cheerio from 'cheerio';
async function run() {
  try {
    const res = await proxiedFetch('https://w1.anime4up.rest/episode/%d8%a7%d9%86%d9%85%d9%8a-rezero-kara-hajimeru-isekai-seikatsu-4th-season-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-6-%d9%85%d8%aa%d8%b1%d8%ac%d9%85%d8%a9/');
    const html = await res.text();
    console.log(html.substring(0, 500));
  } catch (e) {
    console.log(e);
  }
}
run();
