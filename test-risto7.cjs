const cheerio = require('cheerio');
fetch('https://ristoanime.me/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const eps = [];
  $('.MovieItem a, .animiyat a, a.CARTA, .episodes-list a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9') || href.includes('episode'))) {
      eps.push({
        href,
        title: $(el).attr('title') || $(el).text().trim()
      });
    }
  });
  console.log("Episodes on homepage:", eps.length, eps.slice(0, 3));
});
