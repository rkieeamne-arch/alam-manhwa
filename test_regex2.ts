const regex = /(?:الفصل|Chapter|الحلقة|Episode|OVA|Special|الاوفا|الخاصة)[^\d]*([\d.]+)/i;
console.log(regex.exec("انمي-rezero-kara-hajimeru-isekai-seikatsu-4th-season-الحلقة-6-مترجمة"));
console.log(regex.exec("الفصل 13.5"));
