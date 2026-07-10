const fs = require('fs');
const html = fs.readFileSync('azora-series.html', 'utf-8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);

// Look for json inside astro islands
let series = [];
$('astro-island').each((_, el) => {
    const props = $(el).attr('props');
    if (props) {
       if (props.includes('series')) {
          console.log("Found props:", props.slice(0, 100));
       }
    }
});
