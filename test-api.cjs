const https = require('https');
https.get('https://api.azorafly.com/api/series?page=1', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    if(data.startsWith('{')) console.log(JSON.parse(data).data.slice(0,2));
  });
});
