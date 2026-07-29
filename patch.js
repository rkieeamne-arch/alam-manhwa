import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "chapters: []",
  "chapters: [], releaseYear: new Date().getFullYear()"
);
code = code.replace(
  "setAnime={(anime: Anime) => setScrapedManhuaCache(anime as any)}",
  "setAnime={(anime: any) => setScrapedManhuaCache(anime)}"
);
fs.writeFileSync('src/App.tsx', code);
