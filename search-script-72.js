import * as fs from 'fs';

function search() {
  const text = fs.readFileSync('script_72.txt', 'utf8');
  
  // Find any string that looks like a URL or an API endpoint
  // Look for patterns like /api/ or trpc or next/data
  const patterns = [
    /\/api\/[a-zA-Z0-9\/\-_]+/g,
    /https?:\/\/[a-zA-Z0-9\.\/\-_]+/g,
    /trpc/gi,
    /host/gi,
    /fetch/gi
  ];
  
  patterns.forEach(pat => {
    const matches = text.match(pat);
    if (matches) {
      console.log(`Pattern ${pat} matched ${matches.length} times. Unique:`, Array.from(new Set(matches)).slice(0, 15));
    } else {
      console.log(`Pattern ${pat} no match.`);
    }
  });
}

search();
