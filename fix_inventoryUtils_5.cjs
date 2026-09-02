const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

// I will just remove all lines mentioning plate to revert to the base, then re-add properly
code = code.split('\n').filter(line => !line.includes('Plate') && !line.includes('plate')).join('\n');

// Now we have the clean base. Let's add Plate cleanly using proper regex
code = code.replace(
  "  closingPot: number;",
  "  closingPot: number;\n  openingPlate: number;\n  loadedPlate: number;\n  soldPlate: number;\n  specialOrderPlate: number;\n  totalPlateDeducted: number;\n  cartBalancePlate: number;\n  closingPlate: number;\n  stockStatusPlate: 'healthy' | 'low' | 'out_of_stock';"
);
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

// calculateAvailableStock
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
  "const totalPotSoldThisMonth =\n    thisMonthEntries.reduce((sum, e) => sum + (e.potSold || 0), 0) +\n    thisMonthSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "const totalPotSoldThisMonth =\n    thisMonthEntries.reduce((sum, e) => sum + (e.potSold || 0), 0) +\n    thisMonthSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n  const totalPlateSoldThisMonth =\n    thisMonthEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0) +\n    thisMonthSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);
code = code.replace(
  "const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;",
  "const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;\n  const avgPlateSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPlateSoldThisMonth / daysWithActivity) : 0;"
);

// calculateAvailableStock return
code = code.replace(
  "    availablePot,\n    totalStickSoldSinceBase,",
  "    availablePot,\n    availablePlate,\n    totalStickSoldSinceBase,"
);
code = code.replace(
  "    basePotQty,\n    availableStick,",
  "    basePotQty,\n    basePlateQty,\n    availableStick,"
);
code = code.replace(
  "    totalPotSoldSinceBase,\n    totalSpecialStickSinceBase,",
  "    totalPotSoldSinceBase,\n    totalPlateSoldSinceBase,\n    totalSpecialStickSinceBase,"
);
code = code.replace(
  "    totalSpecialPotSinceBase,\n    totalStickDeductedSinceBase,",
  "    totalSpecialPotSinceBase,\n    totalSpecialPlateSinceBase,\n    totalStickDeductedSinceBase,"
);
code = code.replace(
  "    totalPotDeductedSinceBase,\n    totalStickSoldThisMonth,",
  "    totalPotDeductedSinceBase,\n    totalPlateDeductedSinceBase,\n    totalStickSoldThisMonth,"
);
code = code.replace(
  "    totalPotSoldThisMonth,\n    avgStickSoldThisMonth,",
  "    totalPotSoldThisMonth,\n    totalPlateSoldThisMonth,\n    avgStickSoldThisMonth,"
);
code = code.replace(
  "    avgPotSoldThisMonth\n  };",
  "    avgPotSoldThisMonth,\n    avgPlateSoldThisMonth\n  };"
);

// calculateDailyStockLedger Forward calc
code = code.replace(
  "  let runningPot = basePotQty;",
  "  let runningPot = basePotQty;\n  let runningPlate = basePlateQty;"
);
code = code.replace(
  "      const soldPot = entry ? (entry.potSold || 0) : 0;",
  "      const soldPot = entry ? (entry.potSold || 0) : 0;\n      const soldPlate = entry ? (entry.plateSold || 0) : 0;"
);
code = code.replace(
  "      const loadedPot = entry ? (entry.potLoaded || 0) : 0;",
  "      const loadedPot = entry ? (entry.potLoaded || 0) : 0;\n      const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;"
);
code = code.replace(
  "      const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "      const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n      const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);
code = code.replace(
  "      const totalPotDeducted = soldPot + specialOrderPot;",
  "      const totalPotDeducted = soldPot + specialOrderPot;\n      const totalPlateDeducted = soldPlate + specialOrderPlate;"
);
code = code.replace(
  "      const cartBalancePot = entry\n        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n        : 0;",
  "      const cartBalancePot = entry\n        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n        : 0;\n      const cartBalancePlate = entry\n        ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n        : 0;"
);
code = code.replace(
  "      const openingPot = runningPot;",
  "      const openingPot = runningPot;\n      const openingPlate = runningPlate;"
);
code = code.replace(
  "      const closingPot = Math.max(0, openingPot - totalPotDeducted);",
  "      const closingPot = Math.max(0, openingPot - totalPotDeducted);\n      const closingPlate = Math.max(0, openingPlate - totalPlateDeducted);"
);
code = code.replace(
  "      const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';",
  "      const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';\n      const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =\n        closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';"
);
code = code.replace(
  "        stockStatusPot\n      });",
  "        stockStatusPot,\n        openingPlate,\n        loadedPlate,\n        soldPlate,\n        specialOrderPlate,\n        totalPlateDeducted,\n        cartBalancePlate,\n        closingPlate,\n        stockStatusPlate\n      });"
);
code = code.replace(
  "      runningPot = closingPot;",
  "      runningPot = closingPot;\n      runningPlate = closingPlate;"
);

// calculateDailyStockLedger Backward calc
code = code.replace(
  "  let backPot = basePotQty;",
  "  let backPot = basePotQty;\n  let backPlate = basePlateQty;"
);
code = code.replace(
  "    const soldPot = entry ? (entry.potSold || 0) : 0;",
  "    const soldPot = entry ? (entry.potSold || 0) : 0;\n    const soldPlate = entry ? (entry.plateSold || 0) : 0;"
);
code = code.replace(
  "    const loadedPot = entry ? (entry.potLoaded || 0) : 0;",
  "    const loadedPot = entry ? (entry.potLoaded || 0) : 0;\n    const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;"
);
code = code.replace(
  "    const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "    const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n    const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);
code = code.replace(
  "    const totalPotDeducted = soldPot + specialOrderPot;",
  "    const totalPotDeducted = soldPot + specialOrderPot;\n    const totalPlateDeducted = soldPlate + specialOrderPlate;"
);
code = code.replace(
  "    const cartBalancePot = entry\n      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n      : 0;",
  "    const cartBalancePot = entry\n      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n      : 0;\n    const cartBalancePlate = entry\n      ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n      : 0;"
);
code = code.replace(
  "    const closingPot = backPot;",
  "    const closingPot = backPot;\n    const closingPlate = backPlate;"
);
code = code.replace(
  "    const openingPot = closingPot + totalPotDeducted;",
  "    const openingPot = closingPot + totalPotDeducted;\n    const openingPlate = closingPlate + totalPlateDeducted;"
);
code = code.replace(
  "    const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';",
  "    const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';\n    const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =\n      closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';"
);
code = code.replace(
  "      stockStatusPot\n    });",
  "      stockStatusPot,\n      openingPlate,\n      loadedPlate,\n      soldPlate,\n      specialOrderPlate,\n      totalPlateDeducted,\n      cartBalancePlate,\n      closingPlate,\n      stockStatusPlate\n    });"
);
code = code.replace(
  "    backPot = openingPot;",
  "    backPot = openingPot;\n    backPlate = openingPlate;"
);

fs.writeFileSync('src/lib/inventoryUtils.ts', code);
