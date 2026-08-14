const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

// Import SpecialOrder
code = code.replace(/ProfitWithdrawal \} from '\.\/types';/, 'ProfitWithdrawal, SpecialOrder } from \'./types\';');

// Add functions
const functions = `
export async function saveSpecialOrder(order: SpecialOrder, currentInventory: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const orderWithUser = {
    ...order,
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'specialOrders', order.id), orderWithUser);
    
    // Update inventory
    const newInventory = {
      ...currentInventory,
      stickQuantity: Math.max(0, currentInventory.stickQuantity - order.stickQuantity),
      potQuantity: Math.max(0, currentInventory.potQuantity - order.potQuantity),
      lastUpdatedDate: new Date().toISOString()
    };
    await setDoc(doc(db, 'inventory', 'global'), { ...newInventory, id: 'global', userId: user.uid });
    
    await addLog('SAVE_SPECIAL_ORDER', \`Special Order (\${order.eventType}) on \${order.date}: ₹\${order.amountReceived}\`);
  } catch (error) {
    console.error("Error saving special order:", error);
    throw error;
  }
}

export async function deleteSpecialOrder(order: SpecialOrder, currentInventory: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  const username = (user.email || '').split('@')[0].toLowerCase();
  const isOwner = ['nadeem', 'yuvaraj', 'tankrosathy'].includes(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete special orders.");
  }
  
  triggerWriteStart();
  try {
    await deleteDoc(doc(db, 'specialOrders', order.id));
    
    // Revert inventory
    const newInventory = {
      ...currentInventory,
      stickQuantity: currentInventory.stickQuantity + order.stickQuantity,
      potQuantity: currentInventory.potQuantity + order.potQuantity,
      lastUpdatedDate: new Date().toISOString()
    };
    await setDoc(doc(db, 'inventory', 'global'), { ...newInventory, id: 'global', userId: user.uid });
    
    await addLog('DELETE_SPECIAL_ORDER', \`Deleted special order: ₹\${order.amountReceived} on \${order.date}\`);
  } catch (error) {
    console.error("Error deleting special order:", error);
    throw error;
  }
}

// React Hooks & Context
`;
code = code.replace(/\/\/ React Hooks & Context/, functions);

// Add to StoreState
code = code.replace(/profitWithdrawalsLoading: boolean;/, "profitWithdrawalsLoading: boolean;\n  specialOrders: SpecialOrder[];\n  specialOrdersLoading: boolean;");

// Add to StoreProvider
code = code.replace(/const \[profitWithdrawalsLoading, setProfitWithdrawalsLoading\] = useState\(true\);/, "const [profitWithdrawalsLoading, setProfitWithdrawalsLoading] = useState(true);\n  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>([]);\n  const [specialOrdersLoading, setSpecialOrdersLoading] = useState(true);");

code = code.replace(/setProfitWithdrawals\(\[\]\);/, "setProfitWithdrawals([]);\n      setSpecialOrders([]);");
code = code.replace(/setProfitWithdrawalsLoading\(false\);/, "setProfitWithdrawalsLoading(false);\n      setSpecialOrdersLoading(false);");

// Add onSnapshot
const unsubCode = `
    const unsubSpecialOrders = onSnapshot(query(collection(db, 'specialOrders'), orderBy('date', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SpecialOrder));
      setSpecialOrders(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setSpecialOrdersLoading(false);
    });

    return () => {
`;
code = code.replace(/return \(\) => \{/, unsubCode);

code = code.replace(/unsubProfits\(\);/, "unsubProfits();\n      unsubSpecialOrders();");

code = code.replace(/profitWithdrawals, profitWithdrawalsLoading/, "profitWithdrawals, profitWithdrawalsLoading,\n      specialOrders, specialOrdersLoading");

// Add useSpecialOrders
const useHook = `
export function useSpecialOrders() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSpecialOrders must be used within StoreProvider");
  return { specialOrders: ctx.specialOrders, loading: ctx.specialOrdersLoading };
}
`;
code = code.replace(/export function useLogs\(\) \{/, useHook + "\nexport function useLogs() {");

fs.writeFileSync('src/store.tsx', code);
