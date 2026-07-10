const https = require('https');
https.get('https://azorafly.com/series?page=2', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/series/')) links.push(href);
    });
    console.log("Found series links:", [...new Set(links)].length);
  });
});
