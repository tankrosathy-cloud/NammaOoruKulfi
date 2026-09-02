const fs = require('fs');

// AddEntry.tsx
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');
ae = ae.replace("    plateLoaded: '', plateBalance: '',\n    plateLoaded: '', plateBalance: '',", "    plateLoaded: '', plateBalance: '',");
ae = ae.replace("      plateLoaded: parseInt(formData.plateLoaded) || 0,\n      ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n      plateSold,\n        plateLoaded: parseInt(formData.plateLoaded) || 0,\n        ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n        plateSold,", "        plateLoaded: parseInt(formData.plateLoaded) || 0,\n        ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n        plateSold,");

// AddEntry.tsx error TS2304: Cannot find name 'availablePlate'.
// AddEntry uses `availableStick` and `availablePot`. We must define `availablePlate`.
ae = ae.replace(
  "const availablePot = inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePot;",
  "const availablePot = inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePot;\n  const availablePlate = inventoryUtils.calculateAvailableStock(inventory, entries, specialOrders).availablePlate;"
);
fs.writeFileSync('src/pages/AddEntry.tsx', ae);

// Reports.tsx
let rep = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
// src/pages/Reports.tsx(68,127): error TS1117: An object literal cannot have multiple properties with the same name.
// src/pages/Reports.tsx(173,11): error TS1117: An object literal cannot have multiple properties with the same name.
rep = rep.replace(/plateQuantity: '', plateQuantity: ''/g, "plateQuantity: ''");
rep = rep.replace(/plateQuantity: Number\(specialForm\.plateQuantity\) \|\| 0,\n          plateQuantity: Number\(specialForm\.plateQuantity\) \|\| 0,/g, "plateQuantity: Number(specialForm.plateQuantity) || 0,");
fs.writeFileSync('src/pages/Reports.tsx', rep);

// Settings.tsx
let set = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
set = set.replace(
  "const availablePot = stats.availablePot;",
  "const availablePot = stats.availablePot;\n  const availablePlate = stats.availablePlate;"
);
set = set.replace(
  "const currentWarehousePotBalance = Math.max(0, currentDayRow.closingPot - currentInJobPot);",
  "const currentWarehousePotBalance = Math.max(0, currentDayRow.closingPot - currentInJobPot);\n  const currentInJobPlate = isPlateJobOpen ? (latestEntry?.plateLoaded || 0) : 0;\n  const currentWarehousePlateBalance = Math.max(0, currentDayRow.closingPlate - currentInJobPlate);"
);
set = set.replace(
  "const isPotJobOpen = isSelectedDateToday && latestEntry && latestEntry.potBalance === undefined && latestEntry.date === selectedInventoryDate;",
  "const isPotJobOpen = isSelectedDateToday && latestEntry && latestEntry.potBalance === undefined && latestEntry.date === selectedInventoryDate;\n  const isPlateJobOpen = isSelectedDateToday && latestEntry && latestEntry.plateBalance === undefined && latestEntry.date === selectedInventoryDate;"
);

fs.writeFileSync('src/pages/Settings.tsx', set);
