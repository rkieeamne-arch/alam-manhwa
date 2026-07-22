import re
with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'  // Preload images for smoother reading\n  useEffect\(\(\) => \{\n    if \(!isAnime.*?  \}, \[displayPages, isAnime\]\);\n\n\n', '', content, flags=re.DOTALL)

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
