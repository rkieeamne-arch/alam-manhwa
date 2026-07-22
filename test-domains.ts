import { retryFetch } from './src/utils/scraperUtils';

async function test() {
  console.log("Testing ristoanime.me...");
  try {
    const res1 = await retryFetch('https://ristoanime.me/');
    console.log("ristoanime.me status:", res1.status, "Length:", (await res1.text()).length);
  } catch (e: any) {
    console.error("ristoanime.me error:", e.message);
  }

  console.log("Testing ristoanime.com...");
  try {
    const res2 = await retryFetch('https://ristoanime.com/');
    console.log("ristoanime.com status:", res2.status, "Length:", (await res2.text()).length);
  } catch (e: any) {
    console.error("ristoanime.com error:", e.message);
  }
}
test();
