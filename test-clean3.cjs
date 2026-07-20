function cleanTitle(title) {
  if (!title) return '';
  let cleaned = title
    .split('....')[0]
    .replace(/مشاهدة\s+انمي|جميع\s+حلقات\s+انمي|جميع\s+حلقات|انمي/gi, '')
    .replace(/مترجمة|مترجمه|مترجم|جودة عالية|شاهد|تحميل|اون لاين|اونلاين|اون\sلاين|اون|بجودة|عالية|hd|كامل|بجودة/gi, '')
    .replace(/(تحديث|مستمر|مكتمل|جديد|حصرية|مميزة|حصريه|مميزه)/gi, '')
    .replace(/الموسم\s*\d+|الحلقة\s*\d+/gi, '')
    .replace(/الموسم\s*الثاني|الموسم\s*الأول|الموسم\s*الثالث|الموسم\s*الرابع|الموسم\s*الخامس/gi, '')
    .replace(/&[a-z0-9]+;/gi, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')
    .trim();
  
  cleaned = cleaned.replace(/^[-,\s]+|[-,\s]+$/g, '');
  return cleaned;
}

function extractAnimeTitleFromEpisodeTitle(title) {
  let cleaned = title;
  const matchFrom = title.match(/(?:من|من\s+انمي|من\s+أنمي|من\s+مسلسل|من\s+الأنمي)\s+(.+)/i);
  if (matchFrom) {
    cleaned = matchFrom[1];
  } else {
    const parts = title.split(/(?:الحلقة|الحلقه|Episode|Ep|حلقة|ال حلقة)\s*\d+/i);
    cleaned = parts.length > 1 ? parts.join(' ') : parts[0];
  }
  return cleanTitle(cleaned);
}

console.log("Old way test:", cleanTitle("مشاهدة انمي Tensei shitara Dainana Ouji Datta node, Kimama ni Majutsu wo Kiwamemasu الموسم 2 الحلقة 11 مترجمة و محملة من الأنمي. مباشر و مشاهدة باعلي جودة يوتيوب 2025 اخر اصدار حصري علي اكثر من سيرفر"));
console.log("Extract test:", extractAnimeTitleFromEpisodeTitle("مشاهدة انمي Tensei shitara Dainana Ouji Datta node, Kimama ni Majutsu wo Kiwamemasu الموسم 2 الحلقة 11 مترجمة و محملة من الأنمي. مباشر و مشاهدة باعلي جودة يوتيوب 2025 اخر اصدار حصري علي اكثر من سيرفر"));

