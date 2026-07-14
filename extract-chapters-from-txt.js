import * as fs from 'fs';

function findQueryKeys() {
  const text = fs.readFileSync('script_63.txt', 'utf8');
  console.log("Searching for queryKey...");
  
  // Find "queryKey" and its surrounding text
  const regex = /queryKey\\":\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log("Found queryKey:", match[1]);
  }
}

findQueryKeys();
