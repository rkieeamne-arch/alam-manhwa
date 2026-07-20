function cleanTitle(title) {
  if (!title) return '';
  
  // Remove "RISTO" prefix from the start of some titles
  let cleaned = title.replace(/^RISTO\s*/i, '');
  
  // Remove garbage from multiple titles concatenated
  cleaned = cleaned.split('....')[0];
  
  // Clean prefix
  cleaned = cleaned.replace(/^(مشاهدة\s+انمي|جميع\s+حلقات\s+انمي|جميع\s+حلقات|انمي\s+|تحميل\s+انمي|مسلسل\s+انمي)/gi, '');
  
  // Split by common suffixes to isolate the actual title
  const parts = cleaned.split(/(?:الموسم|الحلقة|مترجم|مترجمة|مترجمه|كامل|اون\s?لاين|بجودة|جودة|شاهد)/i);
  
  cleaned = parts[0];
  
  // Remove trailing non-alphanumeric/Arabic characters if they are stray
  cleaned = cleaned.replace(/[-,\s.:|]+$/g, '').trim();
  
  return cleaned || title;
}
console.log(cleanTitle("RISTOانمي Grand Blue الحلقة 3 الموسم 3 مترجمة اون لاين"));
