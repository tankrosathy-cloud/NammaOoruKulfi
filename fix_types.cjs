const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

// Add to DailyEntry
code = code.replace(
  "  potSold: number;",
  "  potSold: number;\n  // Plate Kulfi\n  plateLoaded?: number;\n  plateBalance?: number;\n  plateSold?: number;"
);

// Add to InventoryStock
code = code.replace(
  "  potQuantity: number;",
  "  potQuantity: number;\n  plateQuantity?: number;"
);
code = code.replace(
  "  potFlavours?: { name: string; quantity: number }[];",
  "  potFlavours?: { name: string; quantity: number }[];\n  plateFlavours?: { name: string; quantity: number }[];"
);

// Add to SpecialOrder
code = code.replace(
  "  potQuantity: number;",
  "  potQuantity: number;\n  plateQuantity?: number;"
);

fs.writeFileSync('src/types.ts', code);
console.log('Types fixed');
