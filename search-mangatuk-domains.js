import * as fs from 'fs';

function findDomains() {
  const text = fs.readFileSync('script_72.txt', 'utf8');
  
  // Find anything containing "mangatuk.com"
  const regex = /"([^"]*mangatuk\.com[^"]*)"/g;
  let match;
  const domains = new Set();
  while ((match = regex.exec(text)) !== null) {
    domains.add(match[1]);
  }
  
  console.log("Found domains/URLs:", Array.from(domains));
}

findDomains();
