const cheerio = require('cheerio');
const html = `<ul class="episodes-links">
<li><a data-src="https://dood.yt/e/xxxxx" href="#">Doodstream</a></li>
<li><a data-src="https://mp4upload.com/embed-yyyyy.html" href="#">Mp4Upload</a></li>
</ul>`;
const $ = cheerio.load(html);
$('ul.episodes-links li a').each((i, el) => {
  console.log($(el).attr('data-src'), $(el).text());
});
