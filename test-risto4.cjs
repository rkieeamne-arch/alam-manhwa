const cheerio = require('cheerio');
const seriesUrl = 'https://ristoanime.me/series/grand-blue-%d8%a7%d9%84%d9%85%d9%88%d8%b3%d9%85-3/';
fetch(seriesUrl).then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  
  const h1 = $('h1').text();
  console.log("H1 on series page:", h1.trim());
  console.log(".title on series page:", $('.title').text().trim());
  console.log(".SeriesTitle on series page:", $('.SeriesTitle').text().trim());
  
  const eps = [];
  $('.eplister a, .episodes a, .episode-list a, .list-episodes a, .EpisodesList a, .episodes-card-container a, .MovieItem a, .MvCv a').each((i, el) => {
    eps.push($(el).attr('href'));
  });
  console.log("Episode links (by class):", eps.length, eps.slice(0,3));
  
  if (eps.length === 0) {
      const allEps = [];
      $('a').each((i, el) => {
         const href = $(el).attr('href');
         if (href && (href.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9') || href.includes('episode'))) {
             allEps.push(href);
         }
      });
      console.log("Episode links (by keyword):", allEps.length, allEps.slice(0,3));
  }
});
