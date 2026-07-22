import re

with open("src/sources/rocksmanga.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_desc = "const description = $('div.entry-content p, .wd-full .entry-content, .summary').text().trim();"
new_desc = "let description = $('div.entry-content p, .wd-full .entry-content, .summary, .description, .post-content').text().trim().replace(/\\s+/g, ' ');\n    if (!description) description = $('meta[property=\"og:description\"]').attr('content') || '';\n    if (description.length > 500) description = description.substring(0, 500) + '...';"

content = content.replace(old_desc, new_desc)

with open("src/sources/rocksmanga.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched rocksmanga description")
