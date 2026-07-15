import { proxiedFetch } from './src/sources/fetch';

async function testFetch() {
  try {
    const url1 = 'https://witanime.cam/anime/digimon-adventure/';
    console.log('Fetching cam:', url1);
    const res1 = await proxiedFetch(url1);
    console.log('cam status:', res1.status);

    const url2 = 'https://witanime.you/anime/digimon-adventure/';
    console.log('Fetching you:', url2);
    const res2 = await proxiedFetch(url2);
    console.log('you status:', res2.status);
  } catch (e) {
    console.error(e);
  }
}

testFetch();
