async function run() {
  const cdxUrl = "http://web.archive.org/cdx/search/cdx?url=eta.animerco.org/*&output=json&limit=5";
  const res = await fetch(cdxUrl);
  const data = await res.json();
  console.log(data);
}
run();
