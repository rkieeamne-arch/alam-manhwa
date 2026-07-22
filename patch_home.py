import sys

with open("src/views/HomeView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace motion.div with div in the classic grid
content = content.replace('<motion.div \n                      key={`classic-grid-${item.id}`}\n                      variants={getScatteringVariants(1 + classicIdx)}\n                    >', '<div key={`classic-grid-${item.id}`} className="animate-fade-in-up" style={{ animationDelay: `${(classicIdx % 12) * 50}ms` }}>')
content = content.replace('<motion.div \n                        key={`grid-${item.id}-${gridIdx}`}\n                        variants={getScatteringVariants(19 + gridIdx)}\n                      >', '<div key={`grid-${item.id}-${gridIdx}`} className="animate-fade-in-up" style={{ animationDelay: `${(gridIdx % 12) * 50}ms` }}>')

# Also closing tags for these specific ones might be hard to replace with regex because there are many </motion.div>.
# Let's use regex.
import re
content = re.sub(
    r'<motion\.div\s+key={`classic-grid-\${item\.id}`}\s+variants={getScatteringVariants\(1 \+ classicIdx\)}\s*>',
    r'<div key={`classic-grid-${item.id}`} className="animate-fade-in-up" style={{ animationDelay: `${(classicIdx % 12) * 50}ms`, animationFillMode: "both" }}>',
    content
)

content = re.sub(
    r'<motion\.div\s+key={`grid-\${item\.id}-\${gridIdx}`}\s+variants={getScatteringVariants\(19 \+ gridIdx\)}\s*>',
    r'<div key={`grid-${item.id}-${gridIdx}`} className="animate-fade-in-up" style={{ animationDelay: `${(gridIdx % 12) * 50}ms`, animationFillMode: "both" }}>',
    content
)

with open("src/views/HomeView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Replaced grid motion.divs")
