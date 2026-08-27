import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { DailyEntry, Settings, InventoryStock, ExpenseEntry, AppLog, ProfitWithdrawal, SpecialOrder, Denominations, DailyDenominationsRecord } from './types';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, doc, getDocs, getDocsFromServer, getDocFromServer, setDoc, deleteDoc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { INITIAL_AUGUST_ENTRIES, INITIAL_AUGUST_EXPENSES, INITIAL_AUGUST_SPECIAL_ORDERS } from './lib/augustDataset';
import { isSupabaseConfigured, getSupabaseClient } from './lib/supabase';
import {
  fetchEntriesFromSupabase,
  upsertEntryToSupabase,
  deleteEntryFromSupabase,
  fetchExpensesFromSupabase,
  upsertExpenseToSupabase,
  deleteExpenseFromSupabase,
  fetchSpecialOrdersFromSupabase,
  upsertSpecialOrderToSupabase,
  deleteSpecialOrderFromSupabase,
  fetchInventoryFromSupabase,
  upsertInventoryToSupabase,
  fetchSettingsFromSupabase,
  upsertSettingsToSupabase,
  fetchProfitWithdrawalsFromSupabase,
  upsertProfitWithdrawalToSupabase,
  deleteProfitWithdrawalFromSupabase,
  fetchLogsFromSupabase,
  insertLogToSupabase,
  clearLogsFromSupabase
} from './lib/supabaseService';

export const ADMIN_USERNAMES = ['nadeem', 'admin', 'administrator', 'yuvaraj', 'tankrosathy'];

export function isUserAdminOrOwner(userOrEmail?: string | null): boolean {
  if (!userOrEmail) return true;
  const username = userOrEmail.includes('@') ? userOrEmail.split('@')[0].toLowerCase() : userOrEmail.toLowerCase();
  return ADMIN_USERNAMES.includes(username);
}

const DEFAULT_SETTINGS: Settings = {
  stickPrice: 40,
  potPrice: 50,
  platePrice: 75,
  monthlyGoal: 150000,
};

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('nammaoorukulfi-realtime') : null;

function triggerWriteStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-write-start'));
    window.dispatchEvent(new CustomEvent('supabase-write-start'));
  }
}

function triggerDataUpdated(type: string, id?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-data-updated', { detail: { type, id } }));
    try {
      syncChannel?.postMessage({ type, id, time: Date.now() });
    } catch {}
  }
}

export async function seedAugustDataset(force: boolean = false): Promise<{ entriesAdded: number; expensesAdded: number }> {
  let entriesAdded = 0;
  let expensesAdded = 0;

  // 1. If Supabase is configured, seed to Supabase
  if (isSupabaseConfigured()) {
    try {
      const existingEntries = await fetchEntriesFromSupabase();
      const existingDates = new Set((existingEntries || []).map(e => e.date));

      for (const entry of INITIAL_AUGUST_ENTRIES) {
        if (force || !existingDates.has(entry.date)) {
          await upsertEntryToSupabase(entry);
          entriesAdded++;
        }
      }

      const existingExpenses = await fetchExpensesFromSupabase();
      const existingExpIds = new Set((existingExpenses || []).map(e => e.id));
      for (const exp of INITIAL_AUGUST_EXPENSES) {
        if (force || !existingExpIds.has(exp.id)) {
          await upsertExpenseToSupabase(exp);
          expensesAdded++;
        }
      }

      for (const special of INITIAL_AUGUST_SPECIAL_ORDERS) {
        await upsertSpecialOrderToSupabase(special);
      }

      await upsertSettingsToSupabase(DEFAULT_SETTINGS);
      triggerDataUpdated('all');
      return { entriesAdded, expensesAdded };
    } catch (err) {
      console.warn("Supabase seed warning:", err);
    }
  }

  // 2. Fallback or parallel seed to Firestore
  const user = auth.currentUser;
  try {
    const entriesSnap = await getDocs(collection(db, 'entries'));
    const existingDates = new Set(entriesSnap.docs.map(d => (d.data() as DailyEntry).date));

    for (const entry of INITIAL_AUGUST_ENTRIES) {
      if (force || !existingDates.has(entry.date)) {
        await setDoc(doc(db, 'entries', entry.id), {
          ...entry,
          userId: user?.uid || 'anonymous',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        entriesAdded++;
      }
    }

    const expensesSnap = await getDocs(collection(db, 'expenses'));
    const existingExpIds = new Set(expensesSnap.docs.map(d => d.id));
    const existingExpSignatures = new Set(expensesSnap.docs.map(d => {
      const data = d.data() as ExpenseEntry;
      return `${data.date}-${data.amount}-${data.category}`;
    }));

    for (const exp of INITIAL_AUGUST_EXPENSES) {
      const sig = `${exp.date}-${exp.amount}-${exp.category}`;
      if (force || (!existingExpIds.has(exp.id) && !existingExpSignatures.has(sig))) {
        await setDoc(doc(db, 'expenses', exp.id), {
          ...exp,
          userId: user?.uid || 'anonymous',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        expensesAdded++;
      }
    }

    const specialsSnap = await getDocs(collection(db, 'specialOrders'));
    const existingSpecialIds = new Set(specialsSnap.docs.map(d => d.id));
    for (const order of INITIAL_AUGUST_SPECIAL_ORDERS) {
      if (force || !existingSpecialIds.has(order.id)) {
        await setDoc(doc(db, 'specialOrders', order.id), {
          ...order,
          userId: user?.uid || 'anonymous',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }

    if (entriesAdded > 0 || expensesAdded > 0) {
      await addLog('SEED_AUGUST_DATA', `Synced August dataset to Cloud: ${entriesAdded} entries, ${expensesAdded} expenses`);
      triggerDataUpdated('all');
    }
  } catch (err) {
    console.error("Error seeding August dataset in Firestore:", err);
  }

  return { entriesAdded, expensesAdded };
}

export async function getEntries(): Promise<DailyEntry[]> {
  if (isSupabaseConfigured()) {
    const supabaseEntries = await fetchEntriesFromSupabase();
    if (supabaseEntries && supabaseEntries.length > 0) {
      return supabaseEntries.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  const q = query(collection(db, 'entries'));
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => doc.data() as DailyEntry);
    const existingDates = new Set(docs.map(d => d.date));
    const missing = INITIAL_AUGUST_ENTRIES.filter(e => !existingDates.has(e.date));
    const all = [...docs, ...missing];
    return all.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [...INITIAL_AUGUST_ENTRIES].sort((a, b) => a.date.localeCompare(b.date));
  }
}

export async function saveDailyDenominations(date: string, denominations: Denominations, skipEntrySync: boolean = false): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();

  const total = (
    ((Number(denominations.n500) || 0) * 500) +
    ((Number(denominations.n200) || 0) * 200) +
    ((Number(denominations.n100) || 0) * 100) +
    ((Number(denominations.n50) || 0) * 50) +
    ((Number(denominations.n20) || 0) * 20) +
    ((Number(denominations.n10) || 0) * 10) +
    (Number(denominations.coins) || 0)
  );

  const record: DailyDenominationsRecord = {
    date,
    denominations,
    total,
    updatedBy: user?.email || 'Staff',
    updatedAt: new Date().toISOString()
  };

  try {
    // 1. Write to dedicated Firestore collection 'daily_denominations' with date as document ID
    await setDoc(doc(db, 'daily_denominations', date), record, { merge: true });

    // 2. Also update entry document if one exists for this date in Firestore
    if (!skipEntrySync) {
      try {
        const q = query(collection(db, 'entries'), where('date', '==', date));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matching = snap.docs[0];
          await setDoc(doc(db, 'entries', matching.id), {
            denominations,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch {}
    }

    // 3. Save locally as offline fallback
    try {
      localStorage.setItem(`kulfi_denoms_${date}`, JSON.stringify(denominations));
    } catch {}

    triggerDataUpdated('denominations', date);
  } catch (error) {
    console.error("Error saving daily denominations to Cloud:", error);
    throw error;
  }
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();

  const entryWithUser = {
    ...entry,
    userId: user?.uid || entry.userId || ''
  };

  try {
    const promises: Promise<any>[] = [];

    if (isSupabaseConfigured()) {
      promises.push(upsertEntryToSupabase(entryWithUser, user?.uid || ''));
    } else {
      promises.push(setDoc(doc(db, 'entries', entry.id), entryWithUser));
    }

    // Sync denominations to daily_denominations collection if present
    if (entry.denominations) {
      promises.push(
        saveDailyDenominations(entry.date, entry.denominations, true).catch(err => {
          console.warn("Could not dual-sync daily denominations:", err);
        })
      );
    }

    promises.push(addLog('SAVE_ENTRY', `Saved daily entry for ${entry.date}`));

    await Promise.all(promises);

    triggerDataUpdated('entry', entry.id);
  } catch (error) {
    console.error("Error saving entry:", error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const user = auth.currentUser;
  const username = (user?.email || '').split('@')[0].toLowerCase();
  const isOwner = !user || isUserAdminOrOwner(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete entries.");
  }

  triggerWriteStart();
  try {
    let payload: any = null;
    let entryDate = id;

    if (isSupabaseConfigured()) {
      await deleteEntryFromSupabase(id);
    } else {
      const docRef = doc(db, 'entries', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        payload = snap.data();
        entryDate = payload.date || id;
      }
      await deleteDoc(docRef);
    }

    await addLog('DELETE_ENTRY', `Deleted entry for ${entryDate}`, payload);
    triggerDataUpdated('entry', id);
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  if (isSupabaseConfigured()) {
    const supabaseSettings = await fetchSettingsFromSupabase();
    if (supabaseSettings) return supabaseSettings;
  }

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
  triggerWriteStart();
  try {
    if (isSupabaseConfigured()) {
      await upsertSettingsToSupabase(settings);
    } else {
      await setDoc(doc(db, 'settings', 'global'), settings);
    }

    triggerDataUpdated('settings', 'global');
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

const DEFAULT_INVENTORY: InventoryStock = {
  id: 'global',
  stickQuantity: 771,
  potQuantity: 28,
  lastUpdatedDate: new Date().toISOString().split('T')[0],
  stickFlavours: [
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
  if (isSupabaseConfigured()) {
    const supabaseInv = await fetchInventoryFromSupabase();
    if (supabaseInv) return supabaseInv;
  }

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
  triggerWriteStart();
  const itemWithUser = {
    ...item,
    id: 'global',
    userId: user?.uid || item.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertInventoryToSupabase(itemWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'inventory', 'global'), itemWithUser);
    }

    triggerDataUpdated('inventory', 'global');
  } catch (error) {
    console.error("Error saving inventory item:", error);
    throw error;
  }
}

export async function getExpenses(): Promise<ExpenseEntry[]> {
  if (isSupabaseConfigured()) {
    const supabaseExpenses = await fetchExpensesFromSupabase();
    if (supabaseExpenses && supabaseExpenses.length > 0) {
      return supabaseExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
  }

  const q = query(collection(db, 'expenses'));
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
    const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
    const existingIds = new Set(docs.map(d => d.id));
    const missing = INITIAL_AUGUST_EXPENSES.filter(e => !existingIds.has(e.id) && !existingSignatures.has(`${e.date}-${e.amount}-${e.category}`));
    const all = [...docs, ...missing];
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [...INITIAL_AUGUST_EXPENSES].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
}

export async function saveExpense(expense: ExpenseEntry): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const expenseWithUser = {
    ...expense,
    userId: user?.uid || expense.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertExpenseToSupabase(expenseWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'expenses', expense.id), expenseWithUser);
    }

    await addLog('SAVE_EXPENSE', `Saved expense for ₹${expense.amount} by ${expense.paidBy} on ${expense.date}`);
    triggerDataUpdated('expense', expense.id);
  } catch (error) {
    console.error("Error saving expense:", error);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const user = auth.currentUser;
  const username = (user?.email || '').split('@')[0].toLowerCase();
  const isOwner = !user || isUserAdminOrOwner(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete expenses.");
  }

  triggerWriteStart();
  try {
    let payload: any = null;
    let expenseDetails = id;

    if (isSupabaseConfigured()) {
      await deleteExpenseFromSupabase(id);
    } else {
      const docRef = doc(db, 'expenses', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        payload = snap.data();
        expenseDetails = `₹${payload.amount} by ${payload.paidBy} on ${payload.date}`;
      }
      await deleteDoc(docRef);
    }

    await addLog('DELETE_EXPENSE', `Deleted expense: ${expenseDetails}`, payload);
    triggerDataUpdated('expense', id);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

export async function saveProfitWithdrawal(withdrawal: ProfitWithdrawal): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const withdrawalWithUser = {
    ...withdrawal,
    userId: user?.uid || withdrawal.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertProfitWithdrawalToSupabase(withdrawalWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'profitWithdrawals', withdrawal.id), withdrawalWithUser);
    }

    await addLog('SAVE_PROFIT_WITHDRAWAL', `Logged profit taken: ₹${withdrawal.amount} on ${withdrawal.date}`);
    triggerDataUpdated('profit', withdrawal.id);
  } catch (error) {
    console.error("Error saving profit withdrawal:", error);
    throw error;
  }
}

export async function deleteProfitWithdrawal(id: string): Promise<void> {
  const user = auth.currentUser;
  const username = (user?.email || '').split('@')[0].toLowerCase();
  const isOwner = !user || isUserAdminOrOwner(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete profit withdrawals.");
  }

  triggerWriteStart();
  try {
    let payload: any = null;
    let details = id;

    if (isSupabaseConfigured()) {
      await deleteProfitWithdrawalFromSupabase(id);
    } else {
      const docRef = doc(db, 'profitWithdrawals', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        payload = snap.data();
        details = `₹${payload.amount} on ${payload.date}`;
      }
      await deleteDoc(docRef);
    }

    await addLog('DELETE_PROFIT_WITHDRAWAL', `Deleted profit withdrawal: ${details}`, payload);
    triggerDataUpdated('profit', id);
  } catch (error) {
    console.error("Error deleting profit withdrawal:", error);
    throw error;
  }
}

export async function saveSpecialOrder(order: SpecialOrder, _currentInventory?: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const orderWithUser = {
    ...order,
    userId: user?.uid || order.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertSpecialOrderToSupabase(orderWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'specialOrders', order.id), orderWithUser);
    }

    await addLog('SAVE_SPECIAL_ORDER', `Special Order (${order.eventType}) on ${order.date}: ₹${order.amountReceived}`);
    triggerDataUpdated('specialOrder', order.id);
  } catch (error) {
    console.error("Error saving special order:", error);
    throw error;
  }
}

export async function updateSpecialOrder(_oldOrder: SpecialOrder, newOrder: SpecialOrder, _currentInventory?: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const orderWithUser = {
    ...newOrder,
    userId: user?.uid || newOrder.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertSpecialOrderToSupabase(orderWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'specialOrders', newOrder.id), orderWithUser);
    }

    await addLog('UPDATE_SPECIAL_ORDER', `Updated special order for ${newOrder.eventType}`);
    triggerDataUpdated('specialOrder', newOrder.id);
  } catch (error) {
    console.error("Error updating special order:", error);
    throw error;
  }
}

export async function deleteSpecialOrder(order: SpecialOrder, _currentInventory?: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  const username = (user?.email || '').split('@')[0].toLowerCase();
  const isOwner = !user || isUserAdminOrOwner(username);
  if (!isOwner) {
    throw new Error("Staff members do not have permission to delete special orders.");
  }

  triggerWriteStart();
  try {
    if (isSupabaseConfigured()) {
      await deleteSpecialOrderFromSupabase(order.id);
    } else {
      await deleteDoc(doc(db, 'specialOrders', order.id));
    }

    await addLog('DELETE_SPECIAL_ORDER', `Deleted special order: ₹${order.amountReceived} on ${order.date}`);
    triggerDataUpdated('specialOrder', order.id);
  } catch (error) {
    console.error("Error deleting special order:", error);
    throw error;
  }
}

// React Hooks & Context

export interface StoreState {
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
  dailyDenominationsMap: Record<string, DailyDenominationsRecord>;
  refreshAllFromServer: () => Promise<void>;
  isSyncing: boolean;
  lastSynced: Date;
  databaseType: 'supabase' | 'firestore';
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [databaseType, setDatabaseType] = useState<'supabase' | 'firestore'>(() => {
    return isSupabaseConfigured() ? 'supabase' : 'firestore';
  });

  const [entries, setEntries] = useState<DailyEntry[]>(() => {
    return [...INITIAL_AUGUST_ENTRIES].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesLimit, setEntriesLimit] = useState(1000);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [inventory, setInventory] = useState<InventoryStock>(DEFAULT_INVENTORY);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    return [...INITIAL_AUGUST_EXPENSES].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesLimit, setExpensesLimit] = useState(1000);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);

  const [profitWithdrawals, setProfitWithdrawals] = useState<ProfitWithdrawal[]>([]);
  const [profitWithdrawalsLoading, setProfitWithdrawalsLoading] = useState(true);
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>(() => {
    return [...INITIAL_AUGUST_SPECIAL_ORDERS].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });
  const [specialOrdersLoading, setSpecialOrdersLoading] = useState(true);

  const [dailyDenominationsMap, setDailyDenominationsMap] = useState<Record<string, DailyDenominationsRecord>>({});

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const isRefreshingRef = useRef(false);

  const refreshAllFromServer = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsSyncing(true);

    try {
      const usingSupabase = isSupabaseConfigured();
      setDatabaseType(usingSupabase ? 'supabase' : 'firestore');

      if (usingSupabase) {
        const [
          supEntries,
          supSettings,
          supInventory,
          supExpenses,
          supProfits,
          supSpecials
        ] = await Promise.all([
          fetchEntriesFromSupabase(),
          fetchSettingsFromSupabase(),
          fetchInventoryFromSupabase(),
          fetchExpensesFromSupabase(),
          fetchProfitWithdrawalsFromSupabase(),
          fetchSpecialOrdersFromSupabase()
        ]);

        if (supEntries && supEntries.length > 0) {
          setEntries(supEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setEntriesLoading(false);
        } else {
          // If Supabase is empty, fall back to initial August dataset
          setEntries([...INITIAL_AUGUST_ENTRIES].sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setEntriesLoading(false);
        }

        if (supSettings) {
          setSettings(supSettings);
        }
        setSettingsLoading(false);

        if (supInventory) {
          setInventory(supInventory);
        }
        setInventoryLoading(false);

        if (supExpenses && supExpenses.length > 0) {
          setExpenses(supExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setExpensesLoading(false);
        } else {
          setExpenses([...INITIAL_AUGUST_EXPENSES].sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setExpensesLoading(false);
        }

        if (supProfits) {
          setProfitWithdrawals(supProfits.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setProfitWithdrawalsLoading(false);
        }

        if (supSpecials && supSpecials.length > 0) {
          setSpecialOrders(supSpecials.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setSpecialOrdersLoading(false);
        } else {
          setSpecialOrders([...INITIAL_AUGUST_SPECIAL_ORDERS].sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setSpecialOrdersLoading(false);
        }

        setLastSynced(new Date());
        return;
      }

      // Firestore Fetching
      const fetchCollection = async (collName: string) => {
        try {
          return await getDocsFromServer(collection(db, collName));
        } catch {
          return await getDocs(collection(db, collName));
        }
      };

      const fetchDocument = async (collName: string, docId: string) => {
        try {
          return await getDocFromServer(doc(db, collName, docId));
        } catch {
          return await getDoc(doc(db, collName, docId));
        }
      };

      const [
        entriesSnap,
        settingsSnap,
        inventorySnap,
        expensesSnap,
        profitsSnap,
        specialsSnap,
        denomsSnap
      ] = await Promise.all([
        fetchCollection('entries'),
        fetchDocument('settings', 'global'),
        fetchDocument('inventory', 'global'),
        fetchCollection('expenses'),
        fetchCollection('profitWithdrawals'),
        fetchCollection('specialOrders'),
        fetchCollection('daily_denominations')
      ]);

      if (denomsSnap) {
        const dMap: Record<string, DailyDenominationsRecord> = {};
        denomsSnap.docs.forEach(docSnap => {
          const d = docSnap.data() as DailyDenominationsRecord;
          dMap[d.date || docSnap.id] = d;
        });
        setDailyDenominationsMap(dMap);
      }

      if (entriesSnap) {
        const docs = entriesSnap.docs.map(d => ({ ...d.data(), id: d.id } as DailyEntry));
        const existingDates = new Set(docs.map(d => d.date));
        const missing = INITIAL_AUGUST_ENTRIES.filter(e => !existingDates.has(e.date));
        const combined = [...docs, ...missing];
        setEntries(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setEntriesLoading(false);
      }

      if (settingsSnap && settingsSnap.exists()) {
        const data = settingsSnap.data() as Settings;
        setSettings({ ...data, stickPrice: 40, potPrice: 50 });
      }
      setSettingsLoading(false);

      if (inventorySnap && inventorySnap.exists()) {
        setInventory(inventorySnap.data() as InventoryStock);
      }
      setInventoryLoading(false);

      if (expensesSnap) {
        const docs = expensesSnap.docs.map(d => ({ ...d.data(), id: d.id } as ExpenseEntry));
        const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
        const existingIds = new Set(docs.map(d => d.id));
        const missing = INITIAL_AUGUST_EXPENSES.filter(e => !existingIds.has(e.id) && !existingSignatures.has(`${e.date}-${e.amount}-${e.category}`));
        const combined = [...docs, ...missing];
        setExpenses(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setExpensesLoading(false);
      }

      if (profitsSnap) {
        const docs = profitsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ProfitWithdrawal));
        setProfitWithdrawals(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setProfitWithdrawalsLoading(false);
      }

      if (specialsSnap) {
        const docs = specialsSnap.docs.map(d => ({ ...d.data(), id: d.id } as SpecialOrder));
        const existingIds = new Set(docs.map(d => d.id));
        const missing = INITIAL_AUGUST_SPECIAL_ORDERS.filter(e => !existingIds.has(e.id));
        const combined = [...docs, ...missing];
        setSpecialOrders(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setSpecialOrdersLoading(false);
      }

      setLastSynced(new Date());
    } catch (err) {
      console.warn("Database sync refresh warning:", err);
    } finally {
      setIsSyncing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let unsubs: Array<() => void> = [];

    // 1. Supabase Realtime Listener if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const channel = supabase
            .channel('nammaoorukulfi-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
              refreshAllFromServer();
            })
            .subscribe();

          unsubs.push(() => {
            supabase.removeChannel(channel);
          });
        } catch (e) {
          console.warn("Supabase realtime subscription warning:", e);
        }
      }
    } else {
      // 2. Firestore Listeners
      const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          seedAugustDataset(false).catch(err => console.warn("Auto-seed on auth:", err));
        }
      });
      unsubs.push(unsubAuth);

      try {
        const unsubEntries = onSnapshot(
          query(collection(db, 'entries')),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailyEntry));
            const existingDates = new Set(docs.map(d => d.date));
            const missing = INITIAL_AUGUST_ENTRIES.filter(e => !existingDates.has(e.date));
            const combined = [...docs, ...missing];
            setEntries(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setHasMoreEntries(combined.length >= entriesLimit);
            setEntriesLoading(false);
            setLastSynced(new Date());
          },
          (err) => console.error("Realtime entries listener error:", err)
        );
        unsubs.push(unsubEntries);
      } catch (e) {
        console.warn("Could not bind entries snapshot:", e);
      }

      try {
        const unsubSettings = onSnapshot(
          doc(db, 'settings', 'global'),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Settings;
              setSettings({ ...data, stickPrice: 40, potPrice: 50 });
            } else {
              setSettings(DEFAULT_SETTINGS);
            }
            setSettingsLoading(false);
          },
          (err) => console.error("Realtime settings listener error:", err)
        );
        unsubs.push(unsubSettings);
      } catch (e) {
        console.warn("Could not bind settings snapshot:", e);
      }

      try {
        const unsubInventory = onSnapshot(
          doc(db, 'inventory', 'global'),
          (docSnap) => {
            if (docSnap.exists()) {
              setInventory(docSnap.data() as InventoryStock);
            } else {
              setInventory(DEFAULT_INVENTORY);
            }
            setInventoryLoading(false);
          },
          (err) => console.error("Realtime inventory listener error:", err)
        );
        unsubs.push(unsubInventory);
      } catch (e) {
        console.warn("Could not bind inventory snapshot:", e);
      }

      try {
        const unsubExpenses = onSnapshot(
          query(collection(db, 'expenses')),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
            const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
            const existingIds = new Set(docs.map(d => d.id));
            const missing = INITIAL_AUGUST_EXPENSES.filter(e => !existingIds.has(e.id) && !existingSignatures.has(`${e.date}-${e.amount}-${e.category}`));
            const combined = [...docs, ...missing];
            setExpenses(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setHasMoreExpenses(combined.length >= expensesLimit);
            setExpensesLoading(false);
            setLastSynced(new Date());
          },
          (err) => console.error("Realtime expenses listener error:", err)
        );
        unsubs.push(unsubExpenses);
      } catch (e) {
        console.warn("Could not bind expenses snapshot:", e);
      }

      try {
        const unsubProfits = onSnapshot(
          query(collection(db, 'profitWithdrawals')),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProfitWithdrawal));
            setProfitWithdrawals(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setProfitWithdrawalsLoading(false);
          },
          (err) => console.error("Realtime profits listener error:", err)
        );
        unsubs.push(unsubProfits);
      } catch (e) {
        console.warn("Could not bind profits snapshot:", e);
      }

      try {
        const unsubSpecialOrders = onSnapshot(
          query(collection(db, 'specialOrders')),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SpecialOrder));
            const existingIds = new Set(docs.map(d => d.id));
            const missing = INITIAL_AUGUST_SPECIAL_ORDERS.filter(e => !existingIds.has(e.id));
            const combined = [...docs, ...missing];
            setSpecialOrders(combined.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setSpecialOrdersLoading(false);
          },
          (err) => console.error("Realtime specials listener error:", err)
        );
        unsubs.push(unsubSpecialOrders);
      } catch (e) {
        console.warn("Could not bind specials snapshot:", e);
      }
    }

    // Always attach the daily_denominations listener regardless of Supabase config
    // This allows real-time keystroke draft syncing across all clients via Firebase.
    try {
      const unsubDenoms = onSnapshot(
        collection(db, 'daily_denominations'),
        (snapshot) => {
          const dMap: Record<string, DailyDenominationsRecord> = {};
          snapshot.docs.forEach(docSnap => {
            const d = docSnap.data() as DailyDenominationsRecord;
            dMap[d.date || docSnap.id] = d;
          });
          setDailyDenominationsMap(prev => ({ ...prev, ...dMap }));
        },
        (err) => console.error("Realtime denominations listener error:", err)
      );
      unsubs.push(unsubDenoms);
    } catch (e) {
      console.warn("Could not bind daily_denominations snapshot globally:", e);
    }

    refreshAllFromServer();

    const handleFocus = () => refreshAllFromServer();
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshAllFromServer();
    };
    const handleDataUpdated = () => refreshAllFromServer();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('app-data-updated', handleDataUpdated);

    if (syncChannel) {
      syncChannel.onmessage = () => refreshAllFromServer();
    }

    return () => {
      unsubs.forEach(u => {
        try { u(); } catch {}
      });
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('app-data-updated', handleDataUpdated);
    };
  }, [entriesLimit, expensesLimit, refreshAllFromServer]);

  const loadMoreEntries = () => setEntriesLimit(prev => prev + 100);
  const loadMoreExpenses = () => setExpensesLimit(prev => prev + 100);

  return (
    <StoreContext.Provider value={{
      entries, entriesLoading, loadMoreEntries, hasMoreEntries,
      settings, settingsLoading,
      inventory, inventoryLoading,
      expenses, expensesLoading, loadMoreExpenses, hasMoreExpenses,
      profitWithdrawals, profitWithdrawalsLoading,
      specialOrders, specialOrdersLoading,
      dailyDenominationsMap,
      refreshAllFromServer,
      isSyncing,
      lastSynced,
      databaseType
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useEntries must be used within StoreProvider");
  return { 
    entries: ctx.entries, 
    loading: ctx.entriesLoading, 
    loadMore: ctx.loadMoreEntries, 
    hasMore: ctx.hasMoreEntries, 
    reload: ctx.refreshAllFromServer 
  };
}

export function useDailyDenominations(targetDate?: string) {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useDailyDenominations must be used within StoreProvider");

  const record = targetDate ? ctx.dailyDenominationsMap[targetDate] : undefined;

  const saveDenominations = useCallback(async (date: string, denoms: Denominations) => {
    await saveDailyDenominations(date, denoms);
  }, []);

  return {
    dailyDenominationsMap: ctx.dailyDenominationsMap,
    record,
    denominations: record?.denominations,
    saveDenominations,
    reload: ctx.refreshAllFromServer
  };
}

export function useSettings() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSettings must be used within StoreProvider");
  return { 
    settings: ctx.settings, 
    loading: ctx.settingsLoading, 
    reload: ctx.refreshAllFromServer 
  };
}

export function useInventory() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useInventory must be used within StoreProvider");
  return { 
    inventory: ctx.inventory, 
    loading: ctx.inventoryLoading, 
    reload: ctx.refreshAllFromServer 
  };
}

export function useExpenses() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useExpenses must be used within StoreProvider");
  return { 
    expenses: ctx.expenses, 
    loading: ctx.expensesLoading, 
    loadMore: ctx.loadMoreExpenses, 
    hasMore: ctx.hasMoreExpenses, 
    reload: ctx.refreshAllFromServer 
  };
}

export function useProfitWithdrawals() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProfitWithdrawals must be used within StoreProvider");
  return { 
    profitWithdrawals: ctx.profitWithdrawals, 
    loading: ctx.profitWithdrawalsLoading,
    reload: ctx.refreshAllFromServer
  };
}

export function useSpecialOrders() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSpecialOrders must be used within StoreProvider");
  return { 
    specialOrders: ctx.specialOrders, 
    loading: ctx.specialOrdersLoading,
    reload: ctx.refreshAllFromServer
  };
}

export function useSync() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSync must be used within StoreProvider");
  return {
    isSyncing: ctx.isSyncing,
    lastSynced: ctx.lastSynced,
    syncNow: ctx.refreshAllFromServer,
    databaseType: ctx.databaseType
  };
}

export function useLogs(limitCount: number = 100) {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchLogsFromSupabase(limitCount).then(data => {
        if (data) setLogs(data);
        setLoading(false);
      });
      return;
    }

    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppLog));
      setLogs(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs in realtime:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { logs, loading };
}

export async function addLog(action: string, details: string, deletedPayload?: any) {
  const user = auth.currentUser;
  const log: AppLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    userEmail: user?.email || 'Admin',
    action,
    details,
  };
  if (deletedPayload !== undefined && deletedPayload !== null) {
    log.deletedPayload = JSON.stringify(deletedPayload);
  }

  if (isSupabaseConfigured()) {
    await insertLogToSupabase(log);
  } else {
    try {
      await setDoc(doc(db, 'logs', log.id), log);
    } catch (error) {
      // Non-fatal
    }
  }
}

export async function revokeDeletedRecord(log: AppLog): Promise<void> {
  if (!log.deletedPayload) {
    throw new Error("No backup payload found for this record.");
  }

  triggerWriteStart();
  try {
    const payload = JSON.parse(log.deletedPayload);
    
    if (log.action === 'DELETE_ENTRY') {
      await saveEntry(payload);
      await addLog('REVOKE_DELETE_ENTRY', `Revoked (restored) daily entry for ${payload.date}`);
    } else if (log.action === 'DELETE_EXPENSE') {
      await saveExpense(payload);
      await addLog('REVOKE_DELETE_EXPENSE', `Revoked (restored) expense of ₹${payload.amount} on ${payload.date}`);
    } else {
      throw new Error("Unsupported revoke action: " + log.action);
    }

    const updatedLog: AppLog = {
      id: log.id,
      timestamp: log.timestamp,
      userEmail: log.userEmail,
      action: `${log.action}_REVOKED`,
      details: `${log.details} (REVOKED/RESTORED)`,
    };
    
    if (isSupabaseConfigured()) {
      await insertLogToSupabase(updatedLog);
    } else {
      await setDoc(doc(db, 'logs', log.id), updatedLog);
    }
  } catch (error) {
    console.error("Error revoking deleted record:", error);
    throw error;
  }
}

export async function clearLogs(): Promise<void> {
  triggerWriteStart();
  try {
    if (isSupabaseConfigured()) {
      await clearLogsFromSupabase();
    } else {
      const q = query(collection(db, 'logs'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'logs', document.id)));
      await Promise.all(deletePromises);
    }
    await addLog('CLEAR_LOGS', 'Cleared all application history logs');
  } catch (error) {
    console.error("Error clearing logs:", error);
    throw error;
  }
}
