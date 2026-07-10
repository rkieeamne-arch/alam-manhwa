const cheerio = require('cheerio');
async function test() {
  const res = await fetch('https://azorafly.com/series?page=1', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  let count = 0;
  $('a[href*="/series/"]').each((_, anchor) => {
      const href = $(anchor).attr('href') || '';
      if (href === '/series' || href.includes('?')) return;
      if (href.includes('/chapter')) return;
      count++;
  });
  console.log("Found", count, "links in Azorafly popular");
}
test();
