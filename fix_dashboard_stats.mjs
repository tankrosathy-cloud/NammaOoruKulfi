import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /const inventoryStats = useMemo\(\(\) => \{[\s\S]*?return \{[\s\S]*?\};\s*\}, \[entries, inventory\]\);/;

const newCode = `const inventoryStats = useMemo(() => {
    const relevantEntries = inventory?.lastUpdatedDate
      ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
      : entries;
    const totalStickSoldSinceUpdate = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSoldSinceUpdate = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const availableStick = Math.max(0, (inventory?.stickQuantity || 0) - totalStickSoldSinceUpdate);
    const availablePot = Math.max(0, (inventory?.potQuantity || 0) - totalPotSoldSinceUpdate);
    
    const now = new Date();
    const currentMonthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
    const currentMonthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');
    const thisMonthEntries = entries.filter(e => e.date >= currentMonthStartStr && e.date <= currentMonthEndStr);
    
    const totalStickSoldThisMonth = thisMonthEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSoldThisMonth = thisMonthEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);

    return {
      totalStickSoldThisMonth,
      totalPotSoldThisMonth,
      availableStick,
      availablePot
    };
  }, [entries, inventory]);`;

content = content.replace(regex, newCode);

content = content.replace(/inventoryStats\.totalStickSold(?!T)/g, 'inventoryStats.totalStickSoldThisMonth');
content = content.replace(/inventoryStats\.totalPotSold(?!T)/g, 'inventoryStats.totalPotSoldThisMonth');
content = content.replace(/Stick Sold<\/p>/g, "Stick Sold (Month)</p>");
content = content.replace(/Pot Sold<\/p>/g, "Pot Sold (Month)</p>");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
