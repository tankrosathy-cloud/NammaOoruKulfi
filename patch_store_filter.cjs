const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf8');

// Replace filteredEntries
content = content.replace(
  /const filteredEntries = activeFid\s*\?\s*supEntries.filter\(e => e.franchiseId === activeFid\)\s*:\s*supEntries.filter\(e => !e.franchiseId\);/g,
  "const filteredEntries = (activeFid && activeFid !== 'all') ? supEntries.filter(e => e.franchiseId === activeFid) : supEntries;"
);

// Replace filteredExpenses
content = content.replace(
  /const filteredExpenses = activeFid\s*\?\s*supExpenses.filter\(e => e.franchiseId === activeFid\)\s*:\s*supExpenses.filter\(e => !e.franchiseId\);/g,
  "const filteredExpenses = (activeFid && activeFid !== 'all') ? supExpenses.filter(e => e.franchiseId === activeFid) : supExpenses;"
);

// Replace filteredProfits
content = content.replace(
  /const filteredProfits = activeFid\s*\?\s*supProfits.filter\(e => e.franchiseId === activeFid\)\s*:\s*supProfits.filter\(e => !e.franchiseId\);/g,
  "const filteredProfits = (activeFid && activeFid !== 'all') ? supProfits.filter(e => e.franchiseId === activeFid) : supProfits;"
);

// Replace filteredSpecials
content = content.replace(
  /const filteredSpecials = activeFid\s*\?\s*supSpecials.filter\(e => e.franchiseId === activeFid\)\s*:\s*supSpecials.filter\(e => !e.franchiseId\);/g,
  "const filteredSpecials = (activeFid && activeFid !== 'all') ? supSpecials.filter(e => e.franchiseId === activeFid) : supSpecials;"
);

fs.writeFileSync('src/store.tsx', content);
console.log('Store filters patched');
