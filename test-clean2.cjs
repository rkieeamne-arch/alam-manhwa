function cleanTitle(title) {
  if (!title) return '';
  let cleaned = title
    // Remove duplicate title texts separated by ....
    .split('....')[0]
    .replace(/مشاهدة\s+انمي|جميع\s+حلقات\s+انمي|جميع\s+حلقات|انمي/gi, '')
    .replace(/مترجمة|مترجمه|مترجم|جودة عالية|شاهد|تحميل|اون لاين|اونلاين|اون\sلاين|اون|بجودة|عالية|hd|كامل|بجودة/gi, '')
    .replace(/(تحديث|مستمر|مكتمل|جديد|حصرية|مميزة|حصريه|مميزه)/gi, '')
    .replace(/الموسم\s*\d+|الحلقة\s*\d+/gi, '')
    .replace(/الموسم\s*الثاني|الموسم\s*الأول|الموسم\s*الثالث|الموسم\s*الرابع|الموسم\s*الخامس/gi, '')
    .replace(/&[a-z0-9]+;/gi, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')
    .trim();
  
  // Clean up leading/trailing hyphens or commas
  cleaned = cleaned.replace(/^[-,\s]+|[-,\s]+$/g, '');
  return cleaned;
}

console.log(cleanTitle("مشاهدة انمي Grand Blue الحلقة 3 الموسم 3 مترجمة اون ....انمي Grand Blue الحلقة 3 الموسم 3 مترجمة اون لاين"));
console.log(cleanTitle("انمي Tenkou-saki no Seiso Karen na Bishoujo ga الحلقة 3 مترجمة اون لاين"));
console.log(cleanTitle("جميع حلقات انمي Dr. Stone مترجمة اون لاين"));
console.log(cleanTitle("انمي Kimetsu no Yaiba قاتل الشياطين مترجم اون لاين"));
