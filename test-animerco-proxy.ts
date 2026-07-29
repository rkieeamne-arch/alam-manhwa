import * as cheerio from 'cheerio';

async function testAnimerco() {
  const targetUrl = 'https://eta.animerco.org/animes/bleach/';
  const url = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  console.log('Fetching', url);
  const res = await fetch(url);
  const data = await res.json();
  const html = data.contents;
  const $ = cheerio.load(html);

  console.log('Title:', $('title').text());
}

testAnimerco();
