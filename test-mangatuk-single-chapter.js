import * as cheerio from 'cheerio';

async function testChapter(chapterUrl) {
  try {
    const res = await fetch(chapterUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log("URL:", chapterUrl);
    console.log("HTML length:", html.length);
    console.log("Title of page:", $('title').text());
    
    const pages = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (src && (src.includes('content.mangatuk.com') || src.includes('pages/') || src.includes('chapter'))) {
        pages.push(src);
      }
    });
    
    console.log("Total pages found:", pages.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

async function runAll() {
  await testChapter('https://mangatuk.com/series/3-gatsu-no-lion/chapter-145');
  await testChapter('https://mangatuk.com/series/3-gatsu-no-lion/chapter-140');
}

runAll();
