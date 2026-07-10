import { olympusStaffSource } from './src/sources/olympustaff';
import { azoraflySourceHandler } from './src/sources/azorafly';

async function main() {
  const query = process.argv[2] || '';
  console.log("Olympus popular list:");
  const m1 = await olympusStaffSource.parsePopularList(1, query);
  console.log(m1.length, m1[0]);

  console.log("Azora popular list:");
  const m2 = await azoraflySourceHandler.parsePopularList(1, query);
  console.log(m2.length, m2[0]);
}

main().catch(console.error);
