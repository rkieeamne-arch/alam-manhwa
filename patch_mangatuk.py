import re

with open("src/sources/mangatuk.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_desc = "description = $('meta[property=\"og:description\"]').attr('content') || 'لا يوجد وصف متاح.';"
new_desc = "description = $('meta[property=\"og:description\"]').attr('content') || 'لا يوجد وصف متاح.';\n      if (description.length > 500) description = description.substring(0, 500) + '...';"

content = content.replace(old_desc, new_desc)

with open("src/sources/mangatuk.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched mangatuk description")
