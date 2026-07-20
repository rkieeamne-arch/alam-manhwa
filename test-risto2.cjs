const cheerio = require('cheerio');
fetch('https://ristoanime.me/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const animeLinks = [];
  $('.MovieItem a, .animiyat a, a.CARTA').each((i, el) => {
    animeLinks.push($(el).attr('href'));
  });
  console.log("Anime links found:", animeLinks.length, animeLinks.slice(0, 3));
  if (animeLinks.length > 0 && animeLinks[0]) {
    fetch(animeLinks[0]).then(r => r.text()).then(aHtml => {
      const $$ = cheerio.load(aHtml);
      console.log("Details Title:", $$('h1').text().trim(), "|", $$('h2').text().trim(), "|", $$('.title').text().trim());
      const epLinks = [];
      $$('a').each((i, el) => {
        epLinks.push($$(el).attr('href'));
      });
      const validEps = epLinks.filter(l => l && (l.includes('/watch') || l.includes('episode')));
      console.log("Episodes found:", validEps.length, validEps.slice(0, 3));
    });
  }
});
