const cheerio = require('cheerio');
fetch('https://witaanime.com/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const links = [];
  $('a').each((i, el) => links.push($(el).attr('href')));
  const animeLinks = links.filter(l => l && l.includes('/anime/'));
  if (animeLinks.length > 0) {
    console.log("Found anime link:", animeLinks[0]);
    fetch(animeLinks[0]).then(r => r.text()).then(aHtml => {
      const $$ = cheerio.load(aHtml);
      console.log("Title:", $$('h1').text());
      const epLinks = [];
      $$('a').each((i, el) => {
        const href = $$(el).attr('href');
        if (href && href.includes('/episode/')) epLinks.push(href);
      });
      console.log("Episodes found:", epLinks.length);
    });
  } else {
    console.log("No anime links found", links.slice(0, 5));
  }
});
