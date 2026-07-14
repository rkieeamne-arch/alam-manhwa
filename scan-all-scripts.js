import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function scan() {
  try {
    const res = await fetch('https://mangatuk.com/series/3-gatsu-no-lion');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const text = $('script').eq(72).text();
    fs.writeFileSync('script_72.txt', text);
    console.log("Wrote Script 72 to script_72.txt. Length:", text.length);
    
    // Search for queryKey
    const regex = /queryKey\\":\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      console.log("Found queryKey in Script 72:", match[1]);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

scan();
