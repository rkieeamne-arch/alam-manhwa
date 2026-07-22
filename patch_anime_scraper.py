import re

with open("src/utils/animeScraper.ts", "r", encoding="utf-8") as f:
    content = f.read()

def patch_block(old, new, content):
    if old in content:
        return content.replace(old, new)
    else:
        print("Could not find:", old[:50])
        return content

# 1. fetchLatestEpisodes
old1 = """      const imgEl = $(el).find('img').first();
      const rawCover = imgEl.attr('src') || imgEl.attr('data-src') || '';"""
new1 = """      const imgEl = $(el).find('img').first();
      let rawCover = imgEl.attr('src') || imgEl.attr('data-src') || '';
      if (!rawCover) {
        const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || '';
        rawCover = style.match(/url\\(['"]?(.*?)['"]?\\)/)?.[1] || '';
      }"""
content = patch_block(old1, new1, content)

# 2. fetchLatestSeries
old2 = """      const img = $(el).find('img');
      const altTitle = img.attr('alt') || '';
      const rawCover = img.attr('src') || img.attr('data-src') || '';"""
new2 = """      const img = $(el).find('img');
      const altTitle = img.attr('alt') || '';
      let rawCover = img.attr('src') || img.attr('data-src') || '';
      if (!rawCover) {
        const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || '';
        rawCover = style.match(/url\\(['"]?(.*?)['"]?\\)/)?.[1] || '';
      }"""
content = patch_block(old2, new2, content)

# 3. searchAnime
old3 = """      const style = $(el).find('.poster').attr('style') || '';
      const rawCover = style.match(/url\\(([^)]+)\\)/)?.[1] || '';"""
new3 = """      const style = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || '';
      const rawCover = style.match(/url\\(['"]?(.*?)['"]?\\)/)?.[1] || '';"""
content = patch_block(old3, new3, content)

# 4. fetchAnimeDetails
old4 = """    const rawCover = $('img').first().attr('src') || '';"""
new4 = """    let rawCover = $('img').first().attr('src') || '';
    if (!rawCover || rawCover.includes('logo')) {
      const style = $('.Thumbnail .bg-image, .anime-poster, .poster').attr('data-style') || $('.Thumbnail .bg-image, .anime-poster, .poster').attr('style') || '';
      const bgMatch = style.match(/url\\(['"]?(.*?)['"]?\\)/);
      if (bgMatch) rawCover = bgMatch[1];
      if (!rawCover) {
          rawCover = $('.Thumbnail img, .anime-poster img').attr('src') || rawCover;
      }
    }"""
content = patch_block(old4, new4, content)

with open("src/utils/animeScraper.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched animeScraper.ts")
