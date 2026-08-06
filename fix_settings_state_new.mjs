import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Update state
content = content.replace(/const \[inventoryData, setInventoryData\] = useState<\s*\{[\s\S]*?\}\s*>\(\{[\s\S]*?\}\);/, 
`const [inventoryData, setInventoryData] = useState<{
    stickQuantity: number | '';
    potQuantity: number | '';
    lastUpdatedDate: string;
    stickFlavours: { name: string; quantity: number }[];
    potFlavours: { name: string; quantity: number }[];
  }>({
    stickQuantity: '',
    potQuantity: '',
    lastUpdatedDate: new Date().toISOString().split('T')[0],
    stickFlavours: [],
    potFlavours: []
  });`);

// Update useEffect for inventory
content = content.replace(/setInventoryData\(\{\s*stickQuantity: inventory\.stickQuantity,\s*potQuantity: inventory\.potQuantity,\s*lastUpdatedDate: inventory\.lastUpdatedDate \|\| new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*\}\);/,
`setInventoryData({
        stickQuantity: inventory.stickQuantity,
        potQuantity: inventory.potQuantity,
        lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0],
        stickFlavours: inventory.stickFlavours || [],
        potFlavours: inventory.potFlavours || []
      });`);

// Update handleInventorySave
content = content.replace(/const item: InventoryStock = \{\s*id: 'global',\s*stickQuantity: Number\(inventoryData.stickQuantity\) \|\| 0,\s*potQuantity: Number\(inventoryData.potQuantity\) \|\| 0,\s*lastUpdatedDate: inventoryData.lastUpdatedDate \|\| new Date\(\).toISOString\(\).split\('T'\)\[0\]\s*\};/,
`const item: InventoryStock = {
      id: 'global',
      stickQuantity: Number(inventoryData.stickQuantity) || 0,
      potQuantity: Number(inventoryData.potQuantity) || 0,
      lastUpdatedDate: inventoryData.lastUpdatedDate || new Date().toISOString().split('T')[0],
      stickFlavours: inventoryData.stickFlavours || [],
      potFlavours: inventoryData.potFlavours || []
    };`);

// Update startInventoryEdit
content = content.replace(/setInventoryData\(\{\s*stickQuantity: inventory.stickQuantity,\s*potQuantity: inventory.potQuantity,\s*lastUpdatedDate: new Date\(\).toISOString\(\).split\('T'\)\[0\] \/\/ Always default to today when editing\s*\}\);/,
`setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });`);

fs.writeFileSync('src/pages/Settings.tsx', content);
