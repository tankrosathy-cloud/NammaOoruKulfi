import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Update state definition
const stateRegex = /const \[inventoryData, setInventoryData\] = useState<\{[\s\S]*?\}>\(.*?\}\);/;
const newState = `const [inventoryData, setInventoryData] = useState<{
    stickQuantity: string | number;
    potQuantity: string | number;
    lastUpdatedDate: string;
    stickFlavours: { name: string; quantity: number }[];
    potFlavours: { name: string; quantity: number }[];
  }>({
    stickQuantity: '',
    potQuantity: '',
    lastUpdatedDate: '',
    stickFlavours: [],
    potFlavours: []
  });`;
content = content.replace(stateRegex, newState);

// Update useEffect for inventory
const useEffectRegex = /setInventoryData\(\{\s*stickQuantity: inventory.stickQuantity,\s*potQuantity: inventory.potQuantity,\s*lastUpdatedDate: inventory.lastUpdatedDate \|\| new Date\(\).toISOString\(\).split\('T'\)\[0\]\s*\}\);/;
const newUseEffect = `setInventoryData({
        stickQuantity: inventory.stickQuantity,
        potQuantity: inventory.potQuantity,
        lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0],
        stickFlavours: inventory.stickFlavours || [],
        potFlavours: inventory.potFlavours || []
      });`;
content = content.replace(useEffectRegex, newUseEffect);

// Update handleInventorySave
const handleSaveRegex = /const item: InventoryStock = \{\s*id: 'global',\s*stickQuantity: Number\(inventoryData.stickQuantity\) \|\| 0,\s*potQuantity: Number\(inventoryData.potQuantity\) \|\| 0,\s*lastUpdatedDate: inventoryData.lastUpdatedDate \|\| new Date\(\).toISOString\(\).split\('T'\)\[0\]\s*\};/;
const newHandleSave = `const item: InventoryStock = {
      id: 'global',
      stickQuantity: Number(inventoryData.stickQuantity) || 0,
      potQuantity: Number(inventoryData.potQuantity) || 0,
      lastUpdatedDate: inventoryData.lastUpdatedDate || new Date().toISOString().split('T')[0],
      stickFlavours: inventoryData.stickFlavours,
      potFlavours: inventoryData.potFlavours
    };`;
content = content.replace(handleSaveRegex, newHandleSave);

// Update startInventoryEdit
const startEditRegex = /setInventoryData\(\{\s*stickQuantity: inventory.stickQuantity,\s*potQuantity: inventory.potQuantity,\s*lastUpdatedDate: new Date\(\).toISOString\(\).split\('T'\)\[0\] \/\/ Always default to today when editing\s*\}\);/;
const newStartEdit = `setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: new Date().toISOString().split('T')[0], // Always default to today when editing
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });`;
content = content.replace(startEditRegex, newStartEdit);

fs.writeFileSync('src/pages/Settings.tsx', content);
