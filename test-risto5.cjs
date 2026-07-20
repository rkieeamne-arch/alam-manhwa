const cheerio = require('cheerio');
const seriesUrl = 'https://ristoanime.me/series/grand-blue-%d8%a7%d9%84%d9%85%d9%88%d8%b3%d9%85-3/';
fetch(seriesUrl).then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  
  const h1 = $('h1').text();
  console.log("H1 text:", h1);
  console.log("H1 html:", $('h1').html());
  console.log("Title text from span:", $('h1 span').text());
});
