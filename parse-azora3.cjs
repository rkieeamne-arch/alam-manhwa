const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('azora-series.html', 'utf-8');
const $ = cheerio.load(html);
const links = [];
$('a').each((_, el) => {
    links.push($(el).attr('href'));
});
console.log([...new Set(links)]);
