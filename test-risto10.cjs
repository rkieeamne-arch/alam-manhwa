const cheerio = require('cheerio');
fetch('https://ristoanime.me/?s=one').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const results = [];
  $('.MovieItem').each((i, el) => {
    results.push($(el).find('h4').text() || $(el).find('.title').text().trim());
  });
  console.log("Search results:", results.length, results.slice(0, 3));
});
