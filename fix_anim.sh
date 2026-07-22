sed -i 's/const angle = (index \* 73) % 360;//' src/views/HomeView.tsx
sed -i 's/const distance = 300 + (index \* 47) % 250;//' src/views/HomeView.tsx
sed -i 's/const x = Math.cos(angle \* Math.PI \/ 180) \* distance;//' src/views/HomeView.tsx
sed -i 's/const y = Math.sin(angle \* Math.PI \/ 180) \* distance;//' src/views/HomeView.tsx
sed -i 's/const rotate = -180 + (index \* 83) % 360;//' src/views/HomeView.tsx
