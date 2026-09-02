const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

// Fix duplicates
code = code.replace(/const basePlateQty = Math\.max\(0, Number\(inventory\?\.plateQuantity\) \|\| 0\);\n  const basePlateQty = Math\.max\(0, Number\(inventory\?\.plateQuantity\) \|\| 0\);/, "const basePlateQty = Math.max(0, Number(inventory?.plateQuantity) || 0);");
code = code.replace(/const soldPlate = entry \? \(entry\.plateSold \|\| 0\) : 0;\n      const soldPlate = entry \? \(entry\.plateSold \|\| 0\) : 0;/, "const soldPlate = entry ? (entry.plateSold || 0) : 0;");
code = code.replace(/const loadedPlate = entry \? \(entry\.plateLoaded \|\| 0\) : 0;\n      const loadedPlate = entry \? \(entry\.plateLoaded \|\| 0\) : 0;/, "const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;");
code = code.replace(/const specialOrderPlate = daySpecials\.reduce\(\(sum, s\) => sum \+ \(s\.plateQuantity \|\| 0\), 0\);\n      const specialOrderPlate = daySpecials\.reduce\(\(sum, s\) => sum \+ \(s\.plateQuantity \|\| 0\), 0\);/, "const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);");
code = code.replace(/const totalPlateDeducted = soldPlate \+ specialOrderPlate;\n      const totalPlateDeducted = soldPlate \+ specialOrderPlate;/, "const totalPlateDeducted = soldPlate + specialOrderPlate;");
code = code.replace(/      openingPlate,\n      loadedPlate,\n      soldPlate,\n      specialOrderPlate,\n      totalPlateDeducted,\n      cartBalancePlate,\n      closingPlate,\n      stockStatusPlate,\n        openingPlate,\n        loadedPlate,\n        soldPlate,\n        specialOrderPlate,\n        totalPlateDeducted,\n        cartBalancePlate,\n        closingPlate,\n        stockStatusPlate/, 
  "        openingPlate,\n        loadedPlate,\n        soldPlate,\n        specialOrderPlate,\n        totalPlateDeducted,\n        cartBalancePlate,\n        closingPlate,\n        stockStatusPlate");

// Fix undeclared variable in backward calc
code = code.replace("const totalPotDeducted = soldPot + specialOrderPot;", "const totalPotDeducted = soldPot + specialOrderPot;\n    const soldPlate = entry ? (entry.plateSold || 0) : 0;\n    const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;\n    const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);\n    const totalPlateDeducted = soldPlate + specialOrderPlate;");

// Fix return obj in calculateAvailableStock
code = code.replace(/totalSpecialPlateSinceBase,\n  totalSpecialPlateSinceBase,/, "totalSpecialPlateSinceBase,");

// Check stockStatusPot object building
code = code.replace("stockStatusPot\n    });", "stockStatusPot,\n      openingPlate,\n      loadedPlate,\n      soldPlate,\n      specialOrderPlate,\n      totalPlateDeducted,\n      cartBalancePlate,\n      closingPlate,\n      stockStatusPlate\n    });");

fs.writeFileSync('src/lib/inventoryUtils.ts', code);
