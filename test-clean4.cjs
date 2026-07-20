function extractAnimeTitle(title) {
  if (!title) return '';
  
  // Clean prefix
  let cleaned = title.replace(/^(مشاهدة\s+انمي|جميع\s+حلقات\s+انمي|جميع\s+حلقات|انمي\s+|تحميل\s+انمي|مسلسل\s+انمي)/gi, '');
  
  // Split by common suffixes
  const parts = cleaned.split(/(?:الموسم|الحلقة|مترجم|مترجمة|مترجمه|كامل|اون\s?لاين|بجودة|جودة|شاهد)/i);
  
  cleaned = parts[0];
  
  // Remove trailing non-alphanumeric/Arabic characters if they are stray
  cleaned = cleaned.replace(/[-,\s.:]+$/g, '').trim();
  
  return cleaned || title;
}

console.log(extractAnimeTitle("مشاهدة انمي Tensei shitara Dainana Ouji Datta node, Kimama ni Majutsu wo Kiwamemasu الموسم 2 الحلقة 11 مترجمة و محملة من الأنمي. مباشر و مشاهدة باعلي جودة يوتيوب 2025 اخر اصدار حصري علي اكثر من سيرفر"));
console.log(extractAnimeTitle("انمي Grand Blue الحلقة 3 الموسم 3 مترجمة اون لاين"));
console.log(extractAnimeTitle("جميع حلقات انمي Dr. Stone مترجمة اون لاين"));
console.log(extractAnimeTitle("انمي Kimetsu no Yaiba قاتل الشياطين مترجم اون لاين"));
console.log(extractAnimeTitle("مشاهدة انمي Tenkou-saki no Seiso Karen na Bishoujo ga الحلقة 3 مترجمة اون لاين"));
