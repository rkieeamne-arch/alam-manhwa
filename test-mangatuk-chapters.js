import * as cheerio from 'cheerio';

async function test(mangaUrl) {
  try {
    const res = await fetch(mangaUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("=== ALL LINKS ===");
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (href.includes('page') || href.includes('chapters') || text.includes('المزيد') || text.includes('التالي') || text.includes('الصفحة') || href.includes('?')) {
        console.log(`Link: href="${href}" text="${text}"`);
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

test('https://mangatuk.com/series/3-gatsu-no-lion');
