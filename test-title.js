const names = [
  "الفصل 10",
  "Chapter 10.5 - The End",
  "الفصل 10 منذ 5 ايام",
  "10",
  "2 days ago\nChapter 11",
  "12.4"
];

names.forEach(n => {
  let nameText = n.replace(/\s+/g, ' ').trim();
  const match = nameText.match(/(الفصل|Chapter)\s*[\d.]+/i);
  if (match) {
    console.log(`Matched: ${match[0]}`);
  } else {
    const numMatch = nameText.match(/^[\d.]+$/);
    if (numMatch) {
       console.log(`Matched Number only: الفصل ${numMatch[0]}`);
    } else {
       console.log(`No match, using fallback: ${nameText}`);
    }
  }
});
