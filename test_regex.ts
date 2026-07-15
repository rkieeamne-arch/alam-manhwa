const regex = /(?:الفصل|Chapter|الحلقة|Episode)\s*([\d.]+)/i;
console.log(regex.exec("One Piece الحلقة 1169"));
console.log(regex.exec("الحلقة 1"));
