import sys

with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
inserted = False
for line in lines:
    out.append(line)
    if "const displayPages = " in line and not inserted:
        inserted = True
        out.append("\n")
        out.append("  // Preload images for smoother reading\n")
        out.append("  useEffect(() => {\n")
        out.append("    if (!isAnime && displayPages.length > 0) {\n")
        out.append("      displayPages.forEach(url => {\n")
        out.append("        if (typeof url === 'string' && url.startsWith('http')) {\n")
        out.append("          const img = new Image();\n")
        out.append("          img.src = url;\n")
        out.append("        }\n")
        out.append("      });\n")
        out.append("    }\n")
        out.append("  }, [displayPages, isAnime]);\n")
        out.append("\n")

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.writelines(out)

