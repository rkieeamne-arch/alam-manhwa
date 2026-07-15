import * as cheerio from 'cheerio';

async function run() {
  const slug = 'tears-on-a-withered-flower';
  const url = `https://mangatuk.com/series/${slug}`;
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log("Searching script tags for RSC payload...");
  let combinedText = '';
  $('script').each((_, el) => {
    const text = $(el).text();
    if (text.includes('__next_f') || text.includes('dehydratedAt') || text.includes('chapters')) {
      combinedText += text;
    }
  });

  console.log("Combined script text length:", combinedText.length);

  // Let's search for "chapters" occurrences in the script text to see the format of chapters
  const index = combinedText.indexOf('"chapters":[');
  if (index !== -1) {
    console.log("Found '\"chapters\":[' at index:", index);
    console.log("Surrounding text:", combinedText.substring(index - 100, index + 1000));
  } else {
    console.log("'\"chapters\":[' not found, searching for 'chapters'");
    const idx2 = combinedText.indexOf('chapters');
    if (idx2 !== -1) {
      console.log("Found 'chapters' at index:", idx2);
      console.log("Surrounding text:", combinedText.substring(idx2 - 100, idx2 + 1000));
    }
  }

  // Let's do a regex check for chapter objects
  // Let's test different chapter object shapes:
  // Shape A: {"id":"...", "number":"...", "title":"...", "slug":"..."}
  const regexA = /\{"id":"([^"]+)","seriesId":"([^"]+)","number":"([^"]+)","title":"([^"]*)","slug":"([^"]+)"/g;
  let countA = 0;
  let match;
  while ((match = regexA.exec(combinedText)) !== null) {
    countA++;
    if (countA <= 3) {
      console.log("Match A:", match.slice(1));
    }
  }
  console.log(`Regex A matches: ${countA}`);

  // Shape B: Check if they are just like {"id":"...", "slug":"...", "number": ...}
  const regexB = /\{"id":"([^"]+)"[^{}]+"slug":"([^"]+)"[^{}]+"number":"([^"]+)"/g;
  let countB = 0;
  while ((match = regexB.exec(combinedText)) !== null) {
    countB++;
    if (countB <= 3) {
      console.log("Match B:", match.slice(1));
    }
  }
  console.log(`Regex B matches: ${countB}`);

  // Shape C: Let's do a very loose search for any pattern like: "number":"[0-9.]+","title":"[^"]*","slug":"[^"]+"
  const regexC = /"number":"([^"]+)"[^}]+"slug":"([^"]+)"/g;
  let countC = 0;
  while ((match = regexC.exec(combinedText)) !== null) {
    countC++;
  }
  console.log(`Regex C matches: ${countC}`);
}

run();
