import { fetchLatestEpisodes, fetchLatestSeries } from './src/utils/animeScraper';

async function main() {
  const eps = await fetchLatestEpisodes();
  console.log("Episodes length:", eps.length);
  const series = await fetchLatestSeries();
  console.log("Series length:", series.length);
}
main();
