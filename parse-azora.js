const fs = require('fs');
const html = fs.readFileSync('azora-series.html', 'utf-8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);
const items = [];
$('a').each((_, el) => {
  const href = $(el).attr('href');
  if (href && href.includes('/series/') && !href.includes('/chapter')) {
     const title = $(el).attr('title') || $(el).text().replace(/\s+/g, ' ').trim();
     items.push({href, title});
  }
});
console.log(items.slice(0, 10));
