const cheerio = require('cheerio');
fetch('https://ristoanime.me/series/tenkou-saki-no-seiso-karen-na-bishoujo-ga/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const eps = [];
  $('.eplister a, .episodes a, .episode-list a, .list-episodes a, .episodes-container a, .EpisodesList a, .episodes-card-container a, .episodes-list-content a, .episodes-card-title a, .MovieItem a, .MvCv a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) eps.push(href);
  });
  console.log("Episodes found by container classes:", eps.length);
  
  if (eps.length === 0) {
      let otherEps = [];
      $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9') || href.includes('/episode/'))) otherEps.push(href);
      });
      console.log("Episodes found by URL pattern:", otherEps.length, otherEps.slice(0,3));
  }
});
