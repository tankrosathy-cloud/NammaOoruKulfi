const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

code = code.replace(
  "setEntries(supEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '')));",
  "const filteredEntries = supEntries.filter(e => e.franchiseId === activeFid || !e.franchiseId);\n          setEntries(filteredEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '')));"
);

code = code.replace(
  "setExpenses(supExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')));",
  "const filteredExpenses = supExpenses.filter(e => e.franchiseId === activeFid || !e.franchiseId);\n          setExpenses(filteredExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')));"
);

code = code.replace(
  "setSpecialOrders(supSpecials.sort((a, b) => (b.date || '').localeCompare(a.date || '')));",
  "const filteredSpecials = supSpecials.filter(e => e.franchiseId === activeFid || !e.franchiseId);\n          setSpecialOrders(filteredSpecials.sort((a, b) => (b.date || '').localeCompare(a.date || '')));"
);

code = code.replace(
  "setProfitWithdrawals(supProfits.sort((a, b) => (b.date || '').localeCompare(a.date || '')));",
  "const filteredProfits = supProfits.filter(e => e.franchiseId === activeFid || !e.franchiseId);\n          setProfitWithdrawals(filteredProfits.sort((a, b) => (b.date || '').localeCompare(a.date || '')));"
);

fs.writeFileSync('src/store.tsx', code);
