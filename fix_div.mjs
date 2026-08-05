import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

content = content.replace(/\{\/\* Manual Booster \*\/\}\s*<div className="space-y-2 pt-2">/, '');

fs.writeFileSync('src/pages/Planner.tsx', content);
