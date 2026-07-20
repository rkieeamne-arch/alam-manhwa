function extractNumber(title, fallback = 0) {
  if (!title) return fallback;

  // Remove dates like YYYY/MM/DD or DD/MM/YYYY or YYYY-MM-DD
  let cleanTitle = title.replace(/\d{2,4}[-/]\d{1,2}[-/]\d{2,4}/g, '');

  // 1. Explicit patterns: الفصل 5, Chapter 10, Episode 12.5
  const explicitMatch = cleanTitle.match(/(?:الفصل|Chapter|الحلقة|Episode|OVA|Special|الاوفا|الخاصة|ch\.|ep\.|ch|ep|v\.)[^\d]*([\d.]+)/i);
  if (explicitMatch) {
    const num = parseFloat(explicitMatch[1]);
    if (!isNaN(num)) return num;
  }

  // 2. Patterns like " - 6 " or "#6" or ": 6"
  const separatorMatch = cleanTitle.match(/(?:-|\s|#|:)\s*([\d.]+)(?:\s|$)/);
  if (separatorMatch) {
    const num = parseFloat(separatorMatch[1]);
    if (!isNaN(num)) return num;
  }

  // 3. Extract all numbers and take the last one
  const numbers = cleanTitle.match(/[\d.]+/g);
  if (numbers && numbers.length > 0) {
    const lastNum = parseFloat(numbers[numbers.length - 1]);
    if (!isNaN(lastNum)) return lastNum;
  }

  return fallback;
}

let allChapters = [
  { name: 'الفصل 1' },
  { name: 'الفصل 2' },
  { name: 'الفصل 10' },
  { name: 'الفصل 3' },
  { name: 'الفصل 11' },
  { name: 'الفصل 20' }
];

allChapters.sort((a, b) => {
  const numA = extractNumber(a.name);
  const numB = extractNumber(b.name);
  return numA - numB;
});
console.log(allChapters);
