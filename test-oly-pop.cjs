const cheerio = require('cheerio');
async function test() {
  const res = await fetch('https://olympustaff.com/series?page=1', {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  let count = 0;
  $('.col-6, .card, .series-card, div.mb-3, .bs, .bsx').each((_, el) => {
      const linkEl = $(el).find('a[href*="/series/"]').first();
      if (linkEl.length === 0) return;
      count++;
  });
  console.log("Found", count, "links in Olympus popular");
}
test();
