function cleanTitle(text, idx) {
  let t = text.split('\n')[0].replace(/\s+/g, ' ').trim();
  
  // Date removal regex
  t = t.replace(/(منذ|قبل)?\s*\d+\s*(ساعات|ساعة|ايام|أيام|يوم|شهر|أشهر|دقائق|دقيقة|ثواني|ثانية|days|day|hours|hour|mins|min|months|month|years|year)(\s*(مضت|ago))?/gi, '');
  
  t = t.trim();
  
  // Clean dangling dashes
  t = t.replace(/^-|-$/g, '').trim();

  if (/^[\d.]+$/.test(t)) {
    t = `الفصل ${t}`;
  }
  
  if (!t || /^(\s|-)*$/.test(t)) {
    t = `الفصل ${idx + 1}`;
  }
  return t;
}
console.log(cleanTitle("Chapter 15 - 2 days ago", 0));
