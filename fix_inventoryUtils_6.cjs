const fs = require('fs');
let code = fs.readFileSync('src/lib/inventoryUtils.ts', 'utf8');

code = code.replace(
  "    const cartBalancePlate = entry\n      ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n      : 0;\n      : 0;",
  "    const cartBalancePlate = entry\n      ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n      : 0;"
);

code = code.replace(
  "      const cartBalancePlate = entry\n        ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n        : 0;\n        : 0;",
  "      const cartBalancePlate = entry\n        ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))\n        : 0;"
);

fs.writeFileSync('src/lib/inventoryUtils.ts', code);
