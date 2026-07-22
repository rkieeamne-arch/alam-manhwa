import sys

with open("src/utils/animeScraper.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """    // If this is an episode page instead of the anime details page,
    // let's locate the link to the full anime page so we can scrape the entire series details correctly.
    if (targetUrl.includes('/episode/')) {
      let foundAnimeUrl = '';
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('/anime/') && !href.includes('/episode/')) {
          foundAnimeUrl = href;
          return false; // break
        }
      });

      if (foundAnimeUrl) {
        targetUrl = foundAnimeUrl;
        const resReal = await retryFetch(targetUrl);
        if (resReal.ok) {
          const textReal = await resReal.text();
          text = textReal;
          $ = cheerio.load(text);
        }
      }
    }"""

new_code = """    // If this is an episode page instead of the anime details page,
    // let's locate the link to the full anime page so we can scrape the entire series details correctly.
    const isEpisodePage = $('ul.episodes-list, .List-Episodes, .episodes-card').length === 0 || targetUrl.includes('/episode/') || targetUrl.includes('%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9');
    
    if (isEpisodePage) {
      let foundAnimeUrl = '';
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if ((href.includes('/series/') || href.includes('/anime/')) && href.split('/').filter(Boolean).length > 3) {
          foundAnimeUrl = href;
          return false; // break
        }
      });

      if (foundAnimeUrl) {
        targetUrl = foundAnimeUrl;
        const resReal = await retryFetch(targetUrl);
        if (resReal.ok) {
          const textReal = await resReal.text();
          text = textReal;
          $ = cheerio.load(text);
        }
      }
    }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("src/utils/animeScraper.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched!")
else:
    print("Old code not found")
