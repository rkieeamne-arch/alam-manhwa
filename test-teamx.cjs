const cheerio = require('cheerio');
async function test() {
  const res = await fetch('https://teamx.to/series/i-tamed-my-ex-husbands-mad-dog');
  const html = await res.text();
  const $ = cheerio.load(html);
  const chapters = [];
  $('a[href*="/chapter-"], a[href*="/chapter/"]').each((i, el) => {
    chapters.push($(el).attr('href'));
  });
  console.log("Found:", chapters.length);
  console.log(chapters.slice(0, 5));
}
test();
