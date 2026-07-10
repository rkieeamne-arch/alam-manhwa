const https = require('https');
https.get('https://azorafly.com/series?page=1', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/series/') && !href.includes('/chapter-')) {
         const parentClasses = $(el).parent().attr('class');
         links.push(parentClasses);
      }
    });
    console.log("Parent classes:", [...new Set(links)]);
  });
});
