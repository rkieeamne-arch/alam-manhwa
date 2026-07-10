import { proxiedFetch } from './src/sources/fetch';
(async () => {
   try {
      const res = await proxiedFetch('https://api.azorafly.com/api/series?page=1');
      console.log(res.status);
      const text = await res.text();
      console.log(text.slice(0, 100));
   } catch (e) { console.error(e); }
})();
