const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

code = code.replace(
  /const soldPot = entry \? \(entry\.potSold \|\| 0\) : 0;/g,
  "const soldPot = entry ? (entry.potSold || 0) : 0;\n    const soldPlate = entry ? (entry.plateSold || 0) : 0;"
);
code = code.replace(
  /const loadedPot = entry \? \(entry\.potLoaded \|\| 0\) : 0;/g,
  "const loadedPot = entry ? (entry.potLoaded || 0) : 0;\n    const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;"
);
code = code.replace(
  /const specialOrderPot = daySpecials\.reduce\(\(sum, s\) => sum \+ \(s\.potQuantity \|\| 0\), 0\);/g,
  "const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);\n    const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);"
);
code = code.replace(
  /const totalPotDeducted = soldPot \+ specialOrderPot;/g,
  "const totalPotDeducted = soldPot + specialOrderPot;\n    const totalPlateDeducted = soldPlate + specialOrderPlate;"
);

// We had double declarations because `g` replaces all instances, but we already added them in forward calc manually.
// So let's just make sure we don't have duplicated 'const soldPlate'. Let's clean it up by re-writing those specific lines correctly.
