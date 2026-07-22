import { proxiedFetch } from './src/sources/fetch';

proxiedFetch('https://api.azorafly.com/api/chapters?postId=697&skip=0&take=100').then(async r => {
  console.log("ok:", r.ok);
  const data = await r.json();
  console.log("length:", data.post.chapters.length);
}).catch(console.error);
