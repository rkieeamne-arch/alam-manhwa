const cheerio = require('cheerio');
const epUrl = 'https://ristoanime.me/%d8%a7%d9%86%d9%85%d9%8a-grand-blue-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-3-%d8%a7%d9%84%d9%85%d9%88%d8%b3%d9%85-3-%d9%85%d8%aa%d8%b1%d8%ac%d9%85%d8%a9-%d8%a7%d9%88%d9%86-%d9%84%d8%a7%d9%8a%d9%86/';
fetch(epUrl).then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  
  const h1 = $('h1').text();
  console.log("H1:", h1);
  
  const seriesLinks = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('/series') || href.includes('/anime'))) seriesLinks.push(href);
  });
  console.log("Series links:", seriesLinks);
});
