import { fetchLatestSeries, fetchAnimeDetails } from './src/utils/animeScraper';

fetchLatestSeries().then(list => {
  console.log("Series:", list.length);
  if (list.length > 0) {
    console.log("Passing sourceUrl:", list[0].sourceUrl);
    fetchAnimeDetails(list[0].sourceUrl).then(details => {
      console.log("Details Title:", details?.title);
      console.log("Details Episodes:", details?.episodes?.length);
    });
  }
}).catch(console.error);
