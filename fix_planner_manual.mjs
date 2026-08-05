import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const regex = /<div className="space-y-3">\s*<div className="flex justify-between items-center">\s*<Label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">\s*Manual Booster Adjustment[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(regex, '');

fs.writeFileSync('src/pages/Planner.tsx', content);
