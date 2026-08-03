import { useState, useEffect } from 'react';
import { DailyEntry, Settings, InventoryStock, ExpenseEntry, AppLog } from './types';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';

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
  
  triggerWriteStart();
  try {
    await deleteDoc(doc(db, 'entries', id));
    await addLog('DELETE_ENTRY', `Deleted entry with ID ${id}`);
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
  stickQuantity: 0,
  potQuantity: 0
};

export async function getInventoryStock(): Promise<InventoryStock> {
  const user = auth.currentUser;
  if (!user) return DEFAULT_INVENTORY;
  
  try {
    const docRef = doc(db, 'inventory', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as InventoryStock;
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
  
  triggerWriteStart();
  try {
    await deleteDoc(doc(db, 'expenses', id));
    await addLog('DELETE_EXPENSE', `Deleted expense with ID ${id}`);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

// React Hooks
export function useEntries() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'entries'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailyEntry));
      setEntries(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching entries in realtime:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { entries, loading, reload: () => {} };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, reload: loadSettings };
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryStock>({ id: 'global', stickQuantity: 0, potQuantity: 0 });
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    setLoading(true);
    const data = await getInventoryStock();
    setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return { inventory, loading, reload: loadInventory };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
      setExpenses(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses in realtime:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { expenses, loading, reload: () => {} };
}

export async function addLog(action: string, details: string) {
  const user = auth.currentUser;
  if (!user) return;
  const log: AppLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    userEmail: user.email || 'Unknown',
    action,
    details
  };
  try {
    await setDoc(doc(db, 'logs', log.id), log);
  } catch (error) {
    console.error("Error adding log:", error);
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
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
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
