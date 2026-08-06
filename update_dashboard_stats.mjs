import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /const nextDaySuggestion = useMemo\(\(\) => \{/;

const inventoryStatsCode = `
  const inventoryStats = useMemo(() => {
    const relevantEntries = inventory?.lastUpdatedDate
      ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
      : entries;
    const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const availableStick = Math.max(0, (inventory?.stickQuantity || 0) - totalStickSold);
    const availablePot = Math.max(0, (inventory?.potQuantity || 0) - totalPotSold);
    
    return {
      totalStickSold,
      totalPotSold,
      availableStick,
      availablePot
    };
  }, [entries, inventory]);

  const nextDaySuggestion = useMemo(() => {`;

content = content.replace(regex, inventoryStatsCode);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
