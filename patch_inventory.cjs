const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf8');

content = content.replace(
  /if \(supSettings\) {\n\s*setSettings\(supSettings\);\n\s*}/g,
  `if (supSettings) {
          setSettings(supSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }`
);

content = content.replace(
  /if \(supInventory\) {\n\s*setInventory\(supInventory\);\n\s*}/g,
  `if (supInventory) {
          setInventory(supInventory);
        } else {
          setInventory(DEFAULT_INVENTORY);
        }`
);

content = content.replace(
  /if \(settingsSnap && settingsSnap\.exists\(\)\) {\n\s*const data = settingsSnap\.data\(\) as Settings;\n\s*setSettings\(data\);\n\s*}/g,
  `if (settingsSnap && settingsSnap.exists()) {
        const data = settingsSnap.data() as Settings;
        setSettings(data);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }`
);

content = content.replace(
  /if \(inventorySnap && inventorySnap\.exists\(\)\) {\n\s*setInventory\(inventorySnap\.data\(\) as InventoryStock\);\n\s*}/g,
  `if (inventorySnap && inventorySnap.exists()) {
        setInventory(inventorySnap.data() as InventoryStock);
      } else {
        setInventory(DEFAULT_INVENTORY);
      }`
);

fs.writeFileSync('src/store.tsx', content);
console.log('Inventory/Settings patched');
