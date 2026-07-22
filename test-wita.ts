import { fetchLatestSeries, fetchAnimeDetails, fetchLatestEpisodes } from './src/utils/animeScraper';

fetchLatestEpisodes(1).then(list => {
  console.log("Episodes:", list.length);
  if (list.length > 0) {
    console.log("Passing sourceUrl:", list[0].sourceUrl);
    fetchAnimeDetails(list[0].sourceUrl).then(details => {
      console.log("Details Title:", details?.title);
      console.log("Details Episodes:", details?.episodes?.length);
    });
  }
}).catch(console.error);
