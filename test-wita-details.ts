import { fetchAnimeDetails } from './src/utils/animeScraper';

fetchAnimeDetails('https://ristoanime.me/series/karasu-wa-aruji/').then(details => {
  console.log("Title:", details?.title);
  console.log("Cover:", details?.coverUrl);
});
