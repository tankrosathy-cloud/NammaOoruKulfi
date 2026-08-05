import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Update state definition
const stateRegex = /const \[inventoryData, setInventoryData\] = useState<\{[\s\S]*?\}\>\(\{[\s\S]*?\}\);/;
const newState = `const [inventoryData, setInventoryData] = useState<{
    stickQuantity: number | '';
    potQuantity: number | '';
    lastUpdatedDate: string;
  }>({
    stickQuantity: '',
    potQuantity: '',
    lastUpdatedDate: new Date().toISOString().split('T')[0]
  });`;
content = content.replace(stateRegex, newState);

// Update useEffect
const useEffectRegex = /useEffect\(\(\) => \{\s*if \(inventory\) \{\s*setInventoryData\(\{\s*stickQuantity: inventory\.stickQuantity,\s*potQuantity: inventory\.potQuantity\s*\}\);\s*\}\s*\}, \[inventory\]\);/;
const newUseEffect = `useEffect(() => {
    if (inventory) {
      setInventoryData({
        stickQuantity: inventory.stickQuantity,
        potQuantity: inventory.potQuantity,
        lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [inventory]);`;
content = content.replace(useEffectRegex, newUseEffect);

// Update startInventoryEdit
const startEditRegex = /const startInventoryEdit = \(\) => \{\s*setInventoryData\(\{\s*stickQuantity: inventory\.stickQuantity,\s*potQuantity: inventory\.potQuantity,\s*\}\);\s*setIsEditingInventory\(true\);\s*\};/;
const newStartEdit = `const startInventoryEdit = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0]
    });
    setIsEditingInventory(true);
  };`;
content = content.replace(startEditRegex, newStartEdit);

// Update handleInventorySave
const saveRegex = /const item: InventoryStock = \{\s*id: 'global',\s*stickQuantity: Number\(inventoryData\.stickQuantity\) \|\| 0,\s*potQuantity: Number\(inventoryData\.potQuantity\) \|\| 0,\s*\};/;
const newSave = `const item: InventoryStock = {
      id: 'global',
      stickQuantity: Number(inventoryData.stickQuantity) || 0,
      potQuantity: Number(inventoryData.potQuantity) || 0,
      lastUpdatedDate: inventoryData.lastUpdatedDate || new Date().toISOString().split('T')[0]
    };`;
content = content.replace(saveRegex, newSave);

fs.writeFileSync('src/pages/Settings.tsx', content);
