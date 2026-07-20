const cheerio = require('cheerio');
fetch('https://ristoanime.me/series/grand-blue-%d8%a7%d9%84%d9%85%d9%88%d8%b3%d9%85-3/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  
  $('.eplister a, .episodes a, .episode-list a, .list-episodes a, .episodes-container a, .EpisodesList a, .episodes-card-container a, .episodes-list-content a, .episodes-card-title a, .MovieItem a, .MvCv a').each((i, el) => {
    let epTitleText = $(el).find('.title').text().trim() || $(el).find('h4').text().trim() || $(el).text().trim().replace(/\s+/g, ' ');
    console.log("Found title text:", epTitleText);
  });
});
