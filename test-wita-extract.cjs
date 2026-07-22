const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('test.html', 'utf8');
const $ = cheerio.load(html);

let foundAnimeUrl = '';
$('a').each((_, el) => {
  const href = $(el).attr('href') || '';
  if (href.includes('/series/') && href.split('/').filter(Boolean).length > 3) {
    foundAnimeUrl = href;
    return false;
  }
});
console.log(foundAnimeUrl);
