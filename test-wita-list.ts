import { fetchLatestSeries, fetchLatestEpisodes } from './src/utils/animeScraper';

fetchLatestEpisodes().then(list => {
  console.log("Episodes: ", list.length);
  if (list.length > 0) console.log(list[0]);
});

fetchLatestSeries().then(list => {
  console.log("Series: ", list.length);
  if (list.length > 0) console.log(list[0]);
});
