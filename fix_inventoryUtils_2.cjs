const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

code = code.replace(
  "const soldPot = entry ? (entry.potSold || 0) : 0;",
  "const soldPot = entry ? (entry.potSold || 0) : 0;\n    const soldPlate = entry ? (entry.plateSold || 0) : 0;"
);

code = code.replace(
  "const loadedPot = entry ? (entry.potLoaded || 0) : 0;",
  "const loadedPot = entry ? (entry.potLoaded || 0) : 0;\n    const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;"
);

code = code.replace(
  "const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);",
  "const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n    const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);

code = code.replace(
  "const totalPotDeducted = soldPot + specialOrderPot;",
  "const totalPotDeducted = soldPot + specialOrderPot;\n    const totalPlateDeducted = soldPlate + specialOrderPlate;"
);

code = code.replace(
  "const cartBalancePot = entry\n      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n      : 0;",
  "const cartBalancePot = entry\n      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))\n      : 0;\n    const cartBalancePlate = entry\n      ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n      : 0;"
);

code = code.replace(
  "const closingPot = backPot;",
  "const closingPot = backPot;\n    const closingPlate = backPlate;"
);

code = code.replace(
  "const openingPot = closingPot + totalPotDeducted;",
  "const openingPot = closingPot + totalPotDeducted;\n    const openingPlate = closingPlate + totalPlateDeducted;"
);

code = code.replace(
  "const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';",
  "const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =\n      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';\n    const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =\n      closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';"
);

code = code.replace(
  "      stockStatusPot",
  "      stockStatusPot,\n      openingPlate,\n      loadedPlate,\n      soldPlate,\n      specialOrderPlate,\n      totalPlateDeducted,\n      cartBalancePlate,\n      closingPlate,\n      stockStatusPlate"
);

code = code.replace(
  "backPot = openingPot;",
  "backPot = openingPot;\n    backPlate = openingPlate;"
);

fs.writeFileSync('src/lib/inventoryUtils.ts', code);
