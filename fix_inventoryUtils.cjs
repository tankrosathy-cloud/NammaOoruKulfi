const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

// interface DayStockLedgerRow
code = code.replace(
  "  closingPot: number;",
  "  closingPot: number;\n\n  // Plate Metrics\n  openingPlate: number;\n  loadedPlate: number;\n  soldPlate: number;\n  specialOrderPlate: number;\n  totalPlateDeducted: number;\n  cartBalancePlate: number;\n  closingPlate: number;\n  stockStatusPlate: 'healthy' | 'low' | 'out_of_stock';"
);

// calculateAvailableStock return type
code = code.replace(
  "  availablePot: number;",
  "  availablePot: number;\n  availablePlate: number;"
);
code = code.replace(
  "  basePotQty: number;",
  "  basePotQty: number;\n  basePlateQty: number;"
);
code = code.replace(
  "  totalPotSoldSinceBase: number;",
  "  totalPotSoldSinceBase: number;\n  totalPlateSoldSinceBase: number;"
);
code = code.replace(
  "  totalSpecialPotSinceBase: number;",
  "  totalSpecialPotSinceBase: number;\n  totalSpecialPlateSinceBase: number;"
);
code = code.replace(
  "  totalPotDeductedSinceBase: number;",
  "  totalPotDeductedSinceBase: number;\n  totalPlateDeductedSinceBase: number;"
);
code = code.replace(
  "  totalPotSoldThisMonth: number;",
  "  totalPotSoldThisMonth: number;\n  totalPlateSoldThisMonth: number;"
);
code = code.replace(
  "  avgPotSoldThisMonth: number;",
  "  avgPotSoldThisMonth: number;\n  avgPlateSoldThisMonth: number;"
);

// calculateAvailableStock logic
code = code.replace(
  "const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);",
  "const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);\n  const basePlateQty = Math.max(0, Number(inventory?.plateQuantity) || 0);"
);

code = code.replace(
  "const totalPotSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);",
  "const totalPotSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);\n  const totalPlateSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0);"
);

code = code.replace(
  "const totalSpecialPotSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "const totalSpecialPotSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n  const totalSpecialPlateSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);

code = code.replace(
  "const totalPotDeductedSinceBase = totalPotSoldSinceBase + totalSpecialPotSinceBase;",
  "const totalPotDeductedSinceBase = totalPotSoldSinceBase + totalSpecialPotSinceBase;\n  const totalPlateDeductedSinceBase = totalPlateSoldSinceBase + totalSpecialPlateSinceBase;"
);

code = code.replace(
  "const availablePot = Math.max(0, basePotQty - totalPotDeductedSinceBase);",
  "const availablePot = Math.max(0, basePotQty - totalPotDeductedSinceBase);\n  const availablePlate = Math.max(0, basePlateQty - totalPlateDeductedSinceBase);"
);

code = code.replace(
  "const totalPotSoldThisMonth =",
  "const totalPlateSoldThisMonth = thisMonthEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0) + thisMonthSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);\n  const totalPotSoldThisMonth ="
);

code = code.replace(
  "const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;",
  "const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;\n  const avgPlateSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPlateSoldThisMonth / daysWithActivity) : 0;"
);

code = code.replace(
  "    availablePot,",
  "    availablePot,\n    availablePlate,"
);
code = code.replace(
  "    basePotQty,",
  "    basePotQty,\n    basePlateQty,"
);
code = code.replace(
  "    totalPotSoldSinceBase,",
  "    totalPotSoldSinceBase,\n    totalPlateSoldSinceBase,"
);
code = code.replace(
  "    totalSpecialPotSinceBase,",
  "    totalSpecialPotSinceBase,\n    totalSpecialPlateSinceBase,"
);
code = code.replace(
  "    totalPotDeductedSinceBase,",
  "    totalPotDeductedSinceBase,\n    totalPlateDeductedSinceBase,"
);
code = code.replace(
  "    totalPotSoldThisMonth,",
  "    totalPotSoldThisMonth,\n    totalPlateSoldThisMonth,"
);
code = code.replace(
  "    avgPotSoldThisMonth",
  "    avgPotSoldThisMonth,\n    avgPlateSoldThisMonth"
);

// calculateDailyStockLedger logic
code = code.replace(
  "const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);",
  "const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);\n  const basePlateQty = Math.max(0, Number(inventory?.plateQuantity) || 0);"
);
code = code.replace(
  "let runningPot = basePotQty;",
  "let runningPot = basePotQty;\n  let runningPlate = basePlateQty;"
);

// Replace in Forward calc
code = code.replace(
  "const soldPot = entry ? (entry.potSold || 0) : 0;",
  "const soldPot = entry ? (entry.potSold || 0) : 0;\n      const soldPlate = entry ? (entry.plateSold || 0) : 0;"
);
code = code.replace(
  "const loadedPot = entry ? (entry.potLoaded || 0) : 0;",
  "const loadedPot = entry ? (entry.potLoaded || 0) : 0;\n      const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;"
);
code = code.replace(
  "const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n      const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);
code = code.replace(
  "const totalPotDeducted = soldPot + specialOrderPot;",
  "const totalPotDeducted = soldPot + specialOrderPot;\n      const totalPlateDeducted = soldPlate + specialOrderPlate;"
);
code = code.replace(
  "const cartBalancePot = entry\n        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n        : 0;",
  "const cartBalancePot = entry\n        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n        : 0;\n      const cartBalancePlate = entry\n        ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n        : 0;"
);
code = code.replace(
  "const openingPot = runningPot;",
  "const openingPot = runningPot;\n      const openingPlate = runningPlate;"
);
code = code.replace(
  "const closingPot = Math.max(0, openingPot - totalPotDeducted);",
  "const closingPot = Math.max(0, openingPot - totalPotDeducted);\n      const closingPlate = Math.max(0, openingPlate - totalPlateDeducted);"
);
code = code.replace(
  "const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';",
  "const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';\n      const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =\n        closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';"
);
code = code.replace(
  "        stockStatusPot",
  "        stockStatusPot,\n        openingPlate,\n        loadedPlate,\n        soldPlate,\n        specialOrderPlate,\n        totalPlateDeducted,\n        cartBalancePlate,\n        closingPlate,\n        stockStatusPlate"
);
code = code.replace(
  "runningPot = closingPot;",
  "runningPot = closingPot;\n      runningPlate = closingPlate;"
);

// Backward calc
code = code.replace(
  "let backPot = basePotQty;",
  "let backPot = basePotQty;\n  let backPlate = basePlateQty;"
);

// We need to apply these replacements carefully, maybe with a better approach. Let me just output what it matched.
fs.writeFileSync('src/lib/inventoryUtils.ts', code);
console.log('inventoryUtils partially updated, let me check the file.');
