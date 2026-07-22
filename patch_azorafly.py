import re

with open("src/sources/azorafly.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_desc = "const description = $first('div[id*=\"description\"]').text().trim();"
new_desc = "let description = $first('div[id*=\"description\"], .summary, .description, .post-content, .entry-content').text().trim().replace(/\\s+/g, ' ');\n    if (!description) description = $first('meta[property=\"og:description\"]').attr('content') || '';\n    if (description.length > 500) description = description.substring(0, 500) + '...';"

content = content.replace(old_desc, new_desc)

with open("src/sources/azorafly.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched azorafly description")
