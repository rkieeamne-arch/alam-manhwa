const proxiedFetch = async (url) => {
  const res = await fetch(url);
  return res;
};

const fetchApiChapters = async (pId, pageNum = 0) => {
  const chaps = [];
  const pagesToFetch = pageNum > 0 ? [pageNum] : Array.from({ length: 30 }, (_, i) => i + 1);

  for (const p of pagesToFetch) {
    try {
      const skip = (p - 1) * 100;
      const url = `https://api.azorafly.com/api/chapters?postId=${pId}&skip=${skip}&take=100`;
      const apiRes = await proxiedFetch(url);
      if (!apiRes.ok) break;
      const apiData = await apiRes.json();
      const rawList = apiData?.post?.chapters || apiData?.data || apiData?.chapters || (Array.isArray(apiData) ? apiData : null);
      if (!rawList || !Array.isArray(rawList) || rawList.length === 0) break;

      let added = 0;
      for (const ch of rawList) {
        chaps.push(ch.number);
        added++;
      }
      if (added === 0) break;
      if (pageNum > 0) break;
      if (rawList.length < 100) break;
    } catch (e) {
      break;
    }
  }
  return chaps;
};

fetchApiChapters('697', 0).then(res => {
  console.log("total:", res.length);
  console.log("first 5:", res.slice(0, 5));
  console.log("last 5:", res.slice(-5));
});
