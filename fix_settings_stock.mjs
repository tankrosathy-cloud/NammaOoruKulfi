import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /const totalStickSold = entries\.reduce\(\(sum, e\) => sum \+ \(e\.stickSold \|\| 0\), 0\);\s*const totalPotSold = entries\.reduce\(\(sum, e\) => sum \+ \(e\.potSold \|\| 0\), 0\);/g;
const replacement = `const relevantEntries = inventory.lastUpdatedDate
    ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
    : entries;
  const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Settings.tsx', content);
