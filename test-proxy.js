async function run() {
  const q = "martial";
  try {
    const res = await fetch(`http://localhost:3000/api/proxy?url=https://olympustaff.com/series?search=${q}`);
    const text = await res.text();
    console.log("Olympus proxy:", text.length, text.includes(q) ? "Found" : "Not Found");
  } catch(e) { console.error(e); }

  try {
    const res2 = await fetch(`http://localhost:3000/api/proxy?url=https://azorafly.com/series?search=${q}`);
    const text2 = await res2.text();
    console.log("Azorafly proxy:", text2.length, text2.includes(q) ? "Found" : "Not Found");
  } catch(e) { console.error(e); }
}
run();
