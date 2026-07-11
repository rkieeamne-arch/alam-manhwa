const https = require('https');

https.get('https://azorafly.com/series?search=the', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.length);
  });
});
