import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await fetch('https://mangatuk.com');
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log("HTML length:", html.length);
    console.log("Title of site:", $('title').text());
    
    console.log("\n--- SCRIPT TAGS ---");
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.includes('slug') || text.includes('coverImage')) {
        console.log(`Script ${i} includes slug/coverImage. Length: ${text.length}`);
      }
    });

    console.log("\n--- FIRST 20 LINKS ---");
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && links.length < 50) {
        links.push({ href, text });
      }
    });
    console.log(links.slice(0, 50));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
