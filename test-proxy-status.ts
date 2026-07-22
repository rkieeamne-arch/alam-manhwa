import { proxiedFetch } from './src/sources/fetch';

async function test() {
  console.log("Testing proxiedFetch https://ristoanime.com/");
  const r1 = await proxiedFetch('https://ristoanime.com/');
  console.log("ristoanime.com status:", r1.status);

  console.log("Testing proxiedFetch https://ristoanime.me/");
  const r2 = await proxiedFetch('https://ristoanime.me/');
  console.log("ristoanime.me status:", r2.status);
}
test();
