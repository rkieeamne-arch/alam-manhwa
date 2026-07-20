const fs = require('fs');
fetch('https://ristoanime.me/series/tenkou-saki-no-seiso-karen-na-bishoujo-ga/').then(r => r.text()).then(html => {
  fs.writeFileSync('raw.html', html);
  console.log("Written raw.html. Length:", html.length);
  const h1 = html.includes('الحلقة 1');
  const h2 = html.includes('الحلقة 2');
  const h3 = html.includes('الحلقة 3');
  console.log("Contains 'الحلقة 1':", h1);
  console.log("Contains 'الحلقة 2':", h2);
  console.log("Contains 'الحلقة 3':", h3);
});
