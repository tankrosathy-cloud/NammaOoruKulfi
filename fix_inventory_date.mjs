import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /const startInventoryEdit = \(\) => \{\s*setInventoryData\(\{[\s\S]*?lastUpdatedDate: inventory\.lastUpdatedDate \|\| new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*\}\);\s*setIsEditingInventory\(true\);\s*\};/;

const replacement = `const startInventoryEdit = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: new Date().toISOString().split('T')[0] // Always default to today when editing
    });
    setIsEditingInventory(true);
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Settings.tsx', content);
