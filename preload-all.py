with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("displayPages.slice(0, 5).forEach(page => {", "displayPages.forEach(page => { // Preload ALL images as requested")

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
