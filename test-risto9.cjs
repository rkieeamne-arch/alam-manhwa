const cheerio = require('cheerio');
fetch('https://ristoanime.me/series/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const series = [];
  $('.MovieItem, .animiyat').each((i, el) => {
      const a = $(el).find('a');
      const href = a.attr('href');
      const title = $(el).find('h4').text() || $(el).find('.title').text().trim();
      if(href) series.push({href, title});
  });
  console.log("Series found:", series.length, series.slice(0, 3));
});
