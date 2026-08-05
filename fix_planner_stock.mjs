import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const regex = /\/\/ Calculate shortage based on current stock\s*const availableStick = inventory\?\.stickQuantity \|\| 0;\s*const availablePot = inventory\?\.potQuantity \|\| 0;/g;
const replacement = `// Calculate shortage based on current stock
    const relevantEntries = inventory?.lastUpdatedDate 
      ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
      : entries;
    const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const availableStick = Math.max(0, (inventory?.stickQuantity || 0) - totalStickSold);
    const availablePot = Math.max(0, (inventory?.potQuantity || 0) - totalPotSold);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Planner.tsx', content);
