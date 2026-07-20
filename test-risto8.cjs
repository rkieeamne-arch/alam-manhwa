const cheerio = require('cheerio');
fetch('https://ristoanime.me/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const eps = [];
  $('.MovieItem a, .animiyat a, a.CARTA, .episodes-list a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9') || href.includes('episode'))) {
      eps.push({
        title1: $(el).find('h3').text().trim(),
        title2: $(el).find('h4').text().trim(),
        title3: $(el).find('.title').text().trim()
      });
    }
  });
  console.log("Titles:", eps.slice(0, 3));
});
