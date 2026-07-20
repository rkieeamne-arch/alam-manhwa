const cheerio = require('cheerio');
fetch('https://ristoanime.me/series/kimetsu-no-yaiba-%d9%82%d8%a7%d8%aa%d9%84-%d8%a7%d9%84%d8%b4%d9%8a%d8%a7%d8%b7%d9%8a%d9%86/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const eps = [];
  $('.eplister a, .episodes a, .episode-list a, .list-episodes a, .episodes-container a, .EpisodesList a, .episodes-card-container a, .episodes-list-content a, .episodes-card-title a, .MovieItem a, .MvCv a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) eps.push(href);
  });
  console.log("Episodes:", eps.length);
});
