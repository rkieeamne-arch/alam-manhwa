import * as cheerio from 'cheerio';
// write a quick script to try fetching from google cache or archive.org
async function fetchArchive() {
  const url = "http://web.archive.org/cdx/search/cdx?url=eta.animerco.org/animes/bleach/&output=json";
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}
fetchArchive();
