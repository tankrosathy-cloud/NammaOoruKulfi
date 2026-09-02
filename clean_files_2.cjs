const fs = require('fs');

// AddEntry
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');
ae = ae.replace(/plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n      \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n      plateSold,\n      plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n      \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n      plateSold,/g, "plateLoaded: parseInt(formData.plateLoaded) || 0,\n      ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n      plateSold,");

// Also there was one nested deeper:
ae = ae.replace(/plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n        \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n        plateSold,\n        plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n        \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n        plateSold,/g, "plateLoaded: parseInt(formData.plateLoaded) || 0,\n        ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n        plateSold,");

// Add availablePlate extraction
ae = ae.replace(
  "const availablePot = React.useMemo(() => inventory ? inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePot : 0, [inventory, entries, specialOrders]);",
  "const availablePot = React.useMemo(() => inventory ? inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePot : 0, [inventory, entries, specialOrders]);\n  const availablePlate = React.useMemo(() => inventory ? inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePlate : 0, [inventory, entries, specialOrders]);"
);

// If it was written differently:
ae = ae.replace(/const availablePot = inventoryUtils\.calculateAvailableStock\([\s\S]*?\)\.availablePot;/g, "const availablePot = inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePot;\n  const availablePlate = inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePlate;");

fs.writeFileSync('src/pages/AddEntry.tsx', ae);


// Reports
let rep = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
rep = rep.replace(/potQuantity: '', plateQuantity: '', plateQuantity: ''/g, "potQuantity: '', plateQuantity: ''");
fs.writeFileSync('src/pages/Reports.tsx', rep);


// Settings
let set = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
// Fix availablePlate
set = set.replace(
  "const { availableStick, availablePot, totalStickSoldThisMonth, totalPotSoldThisMonth } = useMemo(() => {",
  "const { availableStick, availablePot, availablePlate, totalStickSoldThisMonth, totalPotSoldThisMonth, totalPlateSoldThisMonth } = useMemo(() => {"
);
set = set.replace(
  "return { availableStick: stats.availableStick, availablePot: stats.availablePot,",
  "return { availableStick: stats.availableStick, availablePot: stats.availablePot, availablePlate: stats.availablePlate,"
);
set = set.replace(
  "return { availableStick: 0, availablePot: 0,",
  "return { availableStick: 0, availablePot: 0, availablePlate: 0,"
);
set = set.replace(
  "const availablePot = React.useMemo(() =>",
  "const availablePlate = React.useMemo(() =>" // Wait, settings uses useMemo
);
// In Settings, `availableStick` and `availablePot` are returned from a useMemo hook.
const regexStatsReturn = /return \{ availableStick: stats\.availableStick, availablePot: stats\.availablePot(.*?)\};/;
set = set.replace(regexStatsReturn, "return { availableStick: stats.availableStick, availablePot: stats.availablePot, availablePlate: stats.availablePlate $1 };");
const regexStatsReturnZero = /return \{ availableStick: 0, availablePot: 0(.*?)\};/;
set = set.replace(regexStatsReturnZero, "return { availableStick: 0, availablePot: 0, availablePlate: 0 $1 };");
set = set.replace(/const \{ availableStick, availablePot(.*?)\} = useMemo/g, "const { availableStick, availablePot, availablePlate $1} = useMemo");

fs.writeFileSync('src/pages/Settings.tsx', set);
