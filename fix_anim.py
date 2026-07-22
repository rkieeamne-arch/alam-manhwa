import sys

with open("src/views/HomeView.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
skip = False
for i, line in enumerate(lines):
    if line.startswith("const getScatteringVariants = (index: number) => {"):
        skip = True
        out.append("const getScatteringVariants = (index: number) => {\n")
        out.append("  return {\n")
        out.append("    initial: { opacity: 0, y: 10 },\n")
        out.append("    animate: {\n")
        out.append("      opacity: 1,\n")
        out.append("      y: 0,\n")
        out.append("      transition: {\n")
        out.append("        duration: 0.3,\n")
        out.append("        delay: Math.min((index % 12) * 0.03, 0.3),\n")
        out.append("        ease: 'easeOut',\n")
        out.append("      }\n")
        out.append("    },\n")
        out.append("    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }\n")
        out.append("  };\n")
        out.append("};\n")
        continue
    if skip:
        if line.startswith("};") and i > 40 and i < 80:
            skip = False
        continue
    out.append(line)

with open("src/views/HomeView.tsx", "w", encoding="utf-8") as f:
    f.writelines(out)
