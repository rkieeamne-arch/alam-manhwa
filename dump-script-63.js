import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function dump(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.includes('chapters') && text.length > 5000) {
        console.log(`Script ${i} length: ${text.length}`);
        // Let's write the first 3000 chars of it
        console.log("=== START OF SCRIPT ===");
        console.log(text.substring(0, 3000));
        console.log("=== END OF SAMPLE ===");
        
        // Write the whole script to a temporary file so we can analyze it if needed
        fs.writeFileSync('script_63.txt', text);
        console.log("Wrote full script to script_63.txt");
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

dump('https://mangatuk.com/series/i-am-the-fated-villain');
