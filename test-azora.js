import * as cheerio from 'cheerio';
const html = `<div class="bg-card text-card-foreground">
  <a href="/series/test" title="Test Manga">
    <img src="test.jpg" />
  </a>
</div>`;
const $ = cheerio.load(html);
const list = [];
$('a[href*="/series/"]').each((_, anchor) => {
  console.log("Found", $(anchor).attr('href'));
});
