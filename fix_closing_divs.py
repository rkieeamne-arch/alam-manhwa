with open("src/views/HomeView.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "onNavigate={onNavigate}" in line:
        # The next line should be </motion.div> or something similar
        if i + 1 < len(lines) and "</motion.div>" in lines[i+1]:
            lines[i+1] = lines[i+1].replace("</motion.div>", "</div>")
        elif i + 2 < len(lines) and "</motion.div>" in lines[i+2]:
            lines[i+2] = lines[i+2].replace("</motion.div>", "</div>")

with open("src/views/HomeView.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
