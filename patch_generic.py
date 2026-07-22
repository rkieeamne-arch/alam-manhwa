import re

with open("src/sources/generic.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_desc = "description = $('.description-summary, .manga-about, .entry-content, [itemProp=\"description\"], div.summary-content, .description, .p-4.rounded-2xl.border.border-zinc-800').first().text().trim();"
new_desc = "description = $('.description-summary, .manga-about, .entry-content, [itemProp=\"description\"], div.summary-content, .description, .p-4.rounded-2xl.border.border-zinc-800, .post-content, .summary, .desc, .review-content, .story-info-right-extent').text().trim().replace(/\\s+/g, ' ');\n      if (description.length > 500) description = description.substring(0, 500) + '...';"

content = content.replace(old_desc, new_desc)

with open("src/sources/generic.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched generic description")
