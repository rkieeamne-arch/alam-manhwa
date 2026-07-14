import * as cheerio from 'cheerio';

async function testJsonChapters(mangaUrl) {
  try {
    const res = await fetch(mangaUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const chapters = [];
    const seenUrls = new Set();
    
    // Scan all scripts for chapters
    $('script').each((_, el) => {
      const text = $(el).text();
      if (text.includes('chapters') && text.includes('seriesId')) {
        // Find all JSON-like parts that match chapter properties
        // E.g., {"id":"...","seriesId":"...","number":"...","title":"...","slug":"..."}
        // Since it's escaped in NextJS Next_f push, it looks like:
        // {\"id\":\"...\",\"seriesId\":\"...\",\"number\":\"...\",\"title\":\"...\",\"slug\":\"...\"}
        const regex = /\{"id":"([^"]+)","seriesId":"([^"]+)","number":"([^"]+)","title":"([^"]*)","slug":"([^"]+)"/g;
        let match;
        // Strip out slashes first
        const cleanText = text.replace(/\\"/g, '"').replace(/\\/g, '');
        while ((match = regex.exec(cleanText)) !== null) {
          const [_, chId, seriesId, number, title, slug] = match;
          const chapterUrl = `${mangaUrl}/chapter-${number}`;
          if (!seenUrls.has(chapterUrl)) {
            seenUrls.add(chapterUrl);
            chapters.push({
              id: slug,
              name: title ? `الفصل ${number}: ${title}` : `الفصل ${number}`,
              url: chapterUrl,
              isLocked: false // we can check coinValue or isLocked as well
            });
          }
        }
      }
    });
    
    console.log("JSON Chapters parsed:", chapters.length);
    console.log("First 5 chapters:", chapters.slice(0, 5));
    console.log("Last 5 chapters:", chapters.slice(-5));
  } catch (err) {
    console.error("Error:", err);
  }
}

testJsonChapters('https://mangatuk.com/series/3-gatsu-no-lion');
