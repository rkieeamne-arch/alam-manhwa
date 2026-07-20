const cheerio = require('cheerio');
fetch('https://ristoanime.com/series/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const links = [];
  $('a').each((i, el) => links.push($(el).attr('href')));
  const seriesLinks = links.filter(l => l && l.includes('/series/') && l !== 'https://ristoanime.com/series/');
  if (seriesLinks.length > 0) {
    console.log("Found series link:", seriesLinks[1]); // take second link as first might be generic
    fetch(seriesLinks[1]).then(r => r.text()).then(aHtml => {
      const $$ = cheerio.load(aHtml);
      console.log("Title:", $$('h1').text().trim(), " | Or:", $$('.title').text().trim(), " | Or:", $$('.SeriesTitle').text().trim());
      const epLinks = [];
      $$('a').each((i, el) => {
        const href = $$(el).attr('href');
        if (href && href.includes('/episode/')) epLinks.push(href);
      });
      console.log("Episodes found with /episode/:", epLinks.length);
      
      const watchLinks = [];
      $$('a').each((i, el) => {
        const href = $$(el).attr('href');
        if (href && href.includes('/watch/')) watchLinks.push(href);
      });
      console.log("Episodes found with /watch/:", watchLinks.length);
      
      const allLinks = [];
      $$('a').each((i, el) => {
          allLinks.push($$(el).attr('href'));
      });
      console.log("Sample links:", allLinks.slice(10, 20));
      
      const eplists = [];
      $$('.eplister a, .episodes a, .episode-list a, .list-episodes a').each((i, el) => {
         eplists.push($$(el).attr('href'));
      });
      console.log("Class-based episode links:", eplists.length);
      
    });
  } else {
    console.log("No series links found", links.slice(0, 15));
  }
});
