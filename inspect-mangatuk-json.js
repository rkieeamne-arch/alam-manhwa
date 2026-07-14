import * as cheerio from 'cheerio';

async function inspect(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("HTML length:", html.length);
    
    // Look at all script tags and see if any contain JSON-like chapter lists
    let scriptNum = 0;
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.length > 1000) {
        scriptNum++;
        console.log(`Script ${i} length: ${text.length}`);
        
        // Let's find if "chapters" or "initialChap" or "initialState" is in this script
        const keywords = ['chapters', 'initialChap', 'initialState', 'chaptersList', 'series', 'props', 'pageProps', 'chapter'];
        const matches = keywords.filter(k => text.includes(k));
        if (matches.length > 0) {
          console.log(`- Contains keywords: ${matches.join(', ')}`);
          if (text.includes('__NEXT_DATA__')) {
            console.log(`- This is a __NEXT_DATA__ script!`);
            try {
              const parsed = JSON.parse(text);
              console.log("Keys in __NEXT_DATA__:", Object.keys(parsed));
              if (parsed.props) {
                console.log("Keys in props:", Object.keys(parsed.props));
                if (parsed.props.pageProps) {
                  console.log("Keys in pageProps:", Object.keys(parsed.props.pageProps));
                  // Save pageProps structure
                  console.log("pageProps overview:", JSON.stringify(parsed.props.pageProps).substring(0, 500));
                }
              }
            } catch (err) {
              console.log("Failed to parse script as top-level JSON:", err.message);
              // Try finding JSON inside the script
              const startPos = text.indexOf('{');
              const endPos = text.lastIndexOf('}');
              if (startPos !== -1 && endPos !== -1) {
                try {
                  const nested = JSON.parse(text.substring(startPos, endPos + 1));
                  console.log("Nested JSON parsed successfully. Keys:", Object.keys(nested));
                } catch (e) {
                  // console.log("Nested parse failed too");
                }
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

inspect('https://mangatuk.com/series/i-am-the-fated-villain');
