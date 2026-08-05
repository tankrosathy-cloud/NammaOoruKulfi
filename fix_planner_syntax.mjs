import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

content = content.replace(/onClick=\{\(\) => \/\/ setEvent\('weekend'\)\}/g, "disabled={true}");
content = content.replace(/Weekend \(\+15\%\)/g, "Weekend (+20%)");
content = content.replace(/Festival \(\+35\%\)/g, "Holiday (+30%)");
content = content.replace(/Hot \(\+15\%\)/g, "Hot (+15%)");
content = content.replace(/Rainy \(\-25\%\)/g, "Rainy (-30%)");

fs.writeFileSync('src/pages/Planner.tsx', content);
