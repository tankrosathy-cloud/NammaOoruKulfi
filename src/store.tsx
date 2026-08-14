import { useState, useEffect } from 'react';
import { DailyEntry, Settings, InventoryStock, ExpenseEntry, AppLog, ProfitWithdrawal, SpecialOrder } from './types';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';

const DEFAULT_SETTINGS: Settings = {
  stickPrice: 40,
  potPrice: 50,
  monthlyGoal: 150000,
};

function triggerWriteStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-write-start'));
  }
}

export async function getEntries(): Promise<DailyEntry[]> {
  const user = auth.currentUser;
  if (!user) return [];
  
  const q = query(
    collection(db, 'entries')
  );
  
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => doc.data() as DailyEntry);
    return docs.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const entryWithUser = {
    ...entry,
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'entries', entry.id), entryWithUser);
    await addLog('SAVE_ENTRY', `Saved daily entry for ${entry.date}`);
  } catch (error) {
    console.error("Error saving entry:", error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  const username = (user.email || '').split('@')[0].toLowerCase();
  const isOwner = ['nadeem', 'yuvaraj', 'tankrosathy'].includes(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete entries.");
  }
  
  triggerWriteStart();
  try {
    const docRef = doc(db, 'entries', id);
    const snap = await getDoc(docRef);
    let payload: any = null;
    let entryDate = id;
    if (snap.exists()) {
      payload = snap.data();
      entryDate = payload.date || id;
    }

    await deleteDoc(docRef);
    await addLog('DELETE_ENTRY', `Deleted entry for ${entryDate}`, payload);
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  const user = auth.currentUser;
  if (!user) return DEFAULT_SETTINGS;
  
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Settings;
      return {
        ...data,
        stickPrice: 40,
        potPrice: 50,
      };
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
  }
  
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  try {
    await setDoc(doc(db, 'settings', 'global'), settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

const DEFAULT_INVENTORY: InventoryStock = {
  id: 'global',
  stickQuantity: 784,
  potQuantity: 48,
  lastUpdatedDate: new Date().toISOString().split('T')[0],
  stickFlavours: [
    { name: 'Mango malai', quantity: 115 },
    { name: 'Kesar Badam', quantity: 83 },
    { name: 'Kesar pista', quantity: 48 },
    { name: 'Black current', quantity: 25 },
    { name: 'Guava', quantity: 33 },
    { name: 'Strawberry', quantity: 56 },
    { name: 'Shahi gulab', quantity: 99 },
    { name: 'Coconut', quantity: 36 },
    { name: 'Gulkand', quantity: 20 },
    { name: 'Chocolate', quantity: 108 },
    { name: 'Dry fruit', quantity: 21 },
    { name: 'Malai', quantity: 45 },
    { name: 'Blue berry', quantity: 48 },
    { name: 'Kesar kajoor', quantity: 24 },
    { name: 'Pista badam', quantity: 22 }
  ],
  potFlavours: [
    { name: 'Badam', quantity: 0 },
    { name: 'Pistha', quantity: 12 },
    { name: 'Pistha badam', quantity: 12 },
    { name: 'Shahi gulab', quantity: 24 }
  ]
};

export async function getInventoryStock(): Promise<InventoryStock> {
  const user = auth.currentUser;
  if (!user) return DEFAULT_INVENTORY;
  
  try {
    const docRef = doc(db, 'inventory', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as InventoryStock;
    } else {
      await setDoc(docRef, { ...DEFAULT_INVENTORY, userId: user.uid });
      return DEFAULT_INVENTORY;
    }
  } catch (error) {
    console.error("Error fetching inventory stock:", error);
  }
  
  return DEFAULT_INVENTORY;
}

export async function saveInventoryStock(item: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const itemWithUser = {
    ...item,
    id: 'global',
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'inventory', 'global'), itemWithUser);
  } catch (error) {
    console.error("Error saving inventory item:", error);
    throw error;
  }
}

export async function getExpenses(): Promise<ExpenseEntry[]> {
  const user = auth.currentUser;
  if (!user) return [];
  
  const q = query(
    collection(db, 'expenses')
  );
  
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
    return docs.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function saveExpense(expense: ExpenseEntry): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const expenseWithUser = {
    ...expense,
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'expenses', expense.id), expenseWithUser);
    await addLog('SAVE_EXPENSE', `Saved expense for ₹${expense.amount} by ${expense.paidBy} on ${expense.date}`);
  } catch (error) {
    console.error("Error saving expense:", error);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  const username = (user.email || '').split('@')[0].toLowerCase();
  const isOwner = ['nadeem', 'yuvaraj', 'tankrosathy'].includes(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete expenses.");
  }
  
  triggerWriteStart();
  try {
    const docRef = doc(db, 'expenses', id);
    const snap = await getDoc(docRef);
    let payload: any = null;
    let expenseDetails = id;
    if (snap.exists()) {
      payload = snap.data();
      expenseDetails = `₹${payload.amount} by ${payload.paidBy} on ${payload.date}`;
    }

    await deleteDoc(docRef);
    await addLog('DELETE_EXPENSE', `Deleted expense: ${expenseDetails}`, payload);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

export async function saveProfitWithdrawal(withdrawal: ProfitWithdrawal): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const withdrawalWithUser = {
    ...withdrawal,
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'profitWithdrawals', withdrawal.id), withdrawalWithUser);
    await addLog('SAVE_PROFIT_WITHDRAWAL', `Logged profit taken: ₹${withdrawal.amount} on ${withdrawal.date}`);
  } catch (error) {
    console.error("Error saving profit withdrawal:", error);
    throw error;
  }
}

export async function deleteProfitWithdrawal(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  const username = (user.email || '').split('@')[0].toLowerCase();
  const isOwner = ['nadeem', 'yuvaraj', 'tankrosathy'].includes(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete profit withdrawals.");
  }
  
  triggerWriteStart();
  try {
    const docRef = doc(db, 'profitWithdrawals', id);
    const snap = await getDoc(docRef);
    let payload: any = null;
    let details = id;
    if (snap.exists()) {
      payload = snap.data();
      details = `₹${payload.amount} on ${payload.date}`;
    }
    await deleteDoc(docRef);
    await addLog('DELETE_PROFIT_WITHDRAWAL', `Deleted profit withdrawal: ${details}`, payload);
  } catch (error) {
    console.error("Error deleting profit withdrawal:", error);
    throw error;
  }
}


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
    
    await addLog('SAVE_SPECIAL_ORDER', `Special Order (${order.eventType}) on ${order.date}: ₹${order.amountReceived}`);
  } catch (error) {
    console.error("Error saving special order:", error);
    throw error;
  }
}


export async function updateSpecialOrder(oldOrder: SpecialOrder, newOrder: SpecialOrder, currentInventory: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  const orderWithUser = {
    ...newOrder,
    userId: user.uid
  };
  
  try {
    await setDoc(doc(db, 'specialOrders', newOrder.id), orderWithUser);
    
    // Calculate difference (new - old means we took more, so we deduct more. If we took less, we add back)
    const stickDiff = newOrder.stickQuantity - oldOrder.stickQuantity;
    const potDiff = newOrder.potQuantity - oldOrder.potQuantity;
    
    const newInventory = {
      ...currentInventory,
      stickQuantity: Math.max(0, currentInventory.stickQuantity - stickDiff),
      potQuantity: Math.max(0, currentInventory.potQuantity - potDiff),
      lastUpdatedDate: new Date().toISOString()
    };
    await setDoc(doc(db, 'inventory', 'global'), { ...newInventory, id: 'global', userId: user.uid });
    
    await addLog('UPDATE_SPECIAL_ORDER', `Updated special order for ${newOrder.eventType}`);
  } catch (error) {
    console.error("Error updating special order:", error);
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
    
    await addLog('DELETE_SPECIAL_ORDER', `Deleted special order: ₹${order.amountReceived} on ${order.date}`);
  } catch (error) {
    console.error("Error deleting special order:", error);
    throw error;
  }
}

// React Hooks & Context

import { createContext, useContext, ReactNode } from 'react';

interface StoreState {
  loadMoreEntries: () => void;
  hasMoreEntries: boolean;
  loadMoreExpenses: () => void;
  hasMoreExpenses: boolean;
  entries: DailyEntry[];
  entriesLoading: boolean;
  settings: Settings;
  settingsLoading: boolean;
  inventory: InventoryStock;
  inventoryLoading: boolean;
  expenses: ExpenseEntry[];
  expensesLoading: boolean;
  profitWithdrawals: ProfitWithdrawal[];
  profitWithdrawalsLoading: boolean;
  specialOrders: SpecialOrder[];
  specialOrdersLoading: boolean;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesLimit, setEntriesLimit] = useState(1000);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [inventory, setInventory] = useState<InventoryStock>(DEFAULT_INVENTORY);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesLimit, setExpensesLimit] = useState(1000);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);

  const [profitWithdrawals, setProfitWithdrawals] = useState<ProfitWithdrawal[]>([]);
  const [profitWithdrawalsLoading, setProfitWithdrawalsLoading] = useState(true);
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>([]);
  const [specialOrdersLoading, setSpecialOrdersLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setEntries([]);
      setSettings(DEFAULT_SETTINGS);
      setInventory(DEFAULT_INVENTORY);
      setExpenses([]);
      setProfitWithdrawals([]);
      setSpecialOrders([]);
      setEntriesLoading(false);
      setSettingsLoading(false);
      setInventoryLoading(false);
      setExpensesLoading(false);
      setProfitWithdrawalsLoading(false);
      setSpecialOrdersLoading(false);
      return;
    }

    const unsubEntries = onSnapshot(query(collection(db, 'entries'), orderBy('date', 'desc'), limit(entriesLimit)), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailyEntry));
      setEntries(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setHasMoreEntries(docs.length >= entriesLimit);
      setEntriesLoading(false);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        setSettings({ ...data, stickPrice: 40, potPrice: 50 });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setSettingsLoading(false);
    });

    const unsubInventory = onSnapshot(doc(db, 'inventory', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setInventory(docSnap.data() as InventoryStock);
      } else {
        setInventory(DEFAULT_INVENTORY);
      }
      setInventoryLoading(false);
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(expensesLimit)), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
      setExpenses(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setHasMoreExpenses(docs.length >= expensesLimit);
      setExpensesLoading(false);
    });

    const unsubProfits = onSnapshot(query(collection(db, 'profitWithdrawals'), orderBy('date', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProfitWithdrawal));
      setProfitWithdrawals(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setProfitWithdrawalsLoading(false);
    });

    
    const unsubSpecialOrders = onSnapshot(query(collection(db, 'specialOrders'), orderBy('date', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SpecialOrder));
      setSpecialOrders(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setSpecialOrdersLoading(false);
    });

    return () => {

      unsubEntries();
      unsubSettings();
      unsubInventory();
      unsubExpenses();
      unsubProfits();
      unsubSpecialOrders();
    };
  }, [entriesLimit, expensesLimit]);

  const loadMoreEntries = () => setEntriesLimit(prev => prev + 100);
  const loadMoreExpenses = () => setExpensesLimit(prev => prev + 100);

  return (
    <StoreContext.Provider value={{
      entries, entriesLoading, loadMoreEntries, hasMoreEntries,
      settings, settingsLoading,
      inventory, inventoryLoading,
      expenses, expensesLoading, loadMoreExpenses, hasMoreExpenses,
      profitWithdrawals, profitWithdrawalsLoading,
      specialOrders, specialOrdersLoading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useEntries must be used within StoreProvider");
  return { entries: ctx.entries, loading: ctx.entriesLoading, loadMore: ctx.loadMoreEntries, hasMore: ctx.hasMoreEntries, reload: () => {} };
}

export function useSettings() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSettings must be used within StoreProvider");
  return { settings: ctx.settings, loading: ctx.settingsLoading, reload: () => {} };
}

export function useInventory() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useInventory must be used within StoreProvider");
  return { inventory: ctx.inventory, loading: ctx.inventoryLoading, reload: () => {} };
}

export function useExpenses() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useExpenses must be used within StoreProvider");
  return { expenses: ctx.expenses, loading: ctx.expensesLoading, loadMore: ctx.loadMoreExpenses, hasMore: ctx.hasMoreExpenses, reload: () => {} };
}

export function useProfitWithdrawals() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProfitWithdrawals must be used within StoreProvider");
  return { profitWithdrawals: ctx.profitWithdrawals, loading: ctx.profitWithdrawalsLoading };
}


export function useSpecialOrders() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSpecialOrders must be used within StoreProvider");
  return { specialOrders: ctx.specialOrders, loading: ctx.specialOrdersLoading };
}

export function useLogs() {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    // ADDED limit(100) TO OPTIMIZE LOGS READS
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppLog));
      setLogs(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs in realtime:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { logs, loading };
}

export async function addLog(action: string, details: string, deletedPayload?: any) {
  const user = auth.currentUser;
  if (!user) return;
  const log: AppLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    userEmail: user.email || 'Unknown',
    action,
    details,
  };
  if (deletedPayload !== undefined && deletedPayload !== null) {
    log.deletedPayload = JSON.stringify(deletedPayload);
  }
  try {
    await setDoc(doc(db, 'logs', log.id), log);
  } catch (error) {
    console.error("Error adding log:", error);
  }
}

export async function revokeDeletedRecord(log: AppLog): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  if (!log.deletedPayload) {
    throw new Error("No backup payload found for this record.");
  }

  triggerWriteStart();
  try {
    const payload = JSON.parse(log.deletedPayload);
    
    if (log.action === 'DELETE_ENTRY') {
      await setDoc(doc(db, 'entries', payload.id), payload);
      await addLog('REVOKE_DELETE_ENTRY', `Revoked (restored) daily entry for ${payload.date}`);
    } else if (log.action === 'DELETE_EXPENSE') {
      await setDoc(doc(db, 'expenses', payload.id), payload);
      await addLog('REVOKE_DELETE_EXPENSE', `Revoked (restored) expense of ₹${payload.amount} on ${payload.date}`);
    } else {
      throw new Error("Unsupported revoke action: " + log.action);
    }

    // Update log to mark as revoked and remove payload
    const updatedLog: AppLog = {
      id: log.id,
      timestamp: log.timestamp,
      userEmail: log.userEmail,
      action: `${log.action}_REVOKED`,
      details: `${log.details} (REVOKED/RESTORED)`,
    };
    
    await setDoc(doc(db, 'logs', log.id), updatedLog);
  } catch (error) {
    console.error("Error revoking deleted record:", error);
    throw error;
  }
}

export async function clearLogs(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  triggerWriteStart();
  try {
    const q = query(collection(db, 'logs'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'logs', document.id)));
    await Promise.all(deletePromises);
    await addLog('CLEAR_LOGS', 'Cleared all application history logs');
  } catch (error) {
    console.error("Error clearing logs:", error);
    throw error;
  }
}
