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

export const ADMIN_USERNAMES = ['nadeem', 'admin', 'administrator', 'yuvaraj', 'tankrosathy', 'nammaoorukulfisathy'];

export let currentFranchiseId: string | null = null;
export function setCurrentFranchiseId(id: string | null) {
  currentFranchiseId = id;
}

export function buildFranchiseQuery(dbRef: any, collName: string, fid?: string | null, ...extraClauses: any[]) {
  if (fid && fid !== 'all' && fid !== 'NONE') {
    return query(collection(dbRef, collName), where('franchiseId', '==', fid), ...extraClauses);
  }
  return query(collection(dbRef, collName), ...extraClauses);
}


export function getDenomsStorageKey(date: string, franchiseId?: string | null): string {
  const fid = (franchiseId !== undefined && franchiseId !== null && franchiseId !== '') 
    ? franchiseId 
    : (currentFranchiseId || 'global');
  return `kulfi_denoms_${fid}_${date}`;
}

export let currentUserRole: 'owner' | 'staff' = 'owner'; // Default to owner for backwards compatibility in UI until auth loads

export function setCurrentUserRole(role: 'owner' | 'staff') {
  currentUserRole = role;
}

export function isUserAdminOrOwner(userOrEmail?: string | null): boolean {
  return currentUserRole === 'owner';
}

const DEFAULT_SETTINGS: Settings = {
  enableStick: true,
  enablePot: true,
  enablePlate: true,
  enablePlatformFee: false,
  stickPrice: 40,
  potPrice: 50,
  platePrice: 75,
  platformFee: 0,
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
    const entriesSnap = await getDocs(buildFranchiseQuery(db, 'entries', currentFranchiseId));
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

    const expensesSnap = await getDocs(buildFranchiseQuery(db, 'expenses', currentFranchiseId));
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

  const q = buildFranchiseQuery(db, 'entries', currentFranchiseId);
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => doc.data() as DailyEntry);
    return docs.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
}

export async function saveDailyDenominations(date: string, denominations: Denominations, skipEntrySync: boolean = false, fid?: string | null): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();

  const effectiveFid = (fid !== undefined && fid !== null && fid !== '') ? fid : (currentFranchiseId || 'NONE');

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
    franchiseId: effectiveFid,
    date,
    denominations,
    total,
    updatedBy: user?.email || 'Staff',
    updatedAt: new Date().toISOString()
  };

  try {
    // 1. Write to dedicated Firestore collection 'daily_denominations' with franchise-scoped document ID
    const docId = (effectiveFid && effectiveFid !== 'NONE') ? `${effectiveFid}_${date}` : date;
    await setDoc(doc(db, 'daily_denominations', docId), record, { merge: true });

    // 2. Also update entry document if one exists for this date in Firestore
    if (!skipEntrySync) {
      try {
        const q = query(collection(db, 'entries'), where('date', '==', date), where('franchiseId', '==', effectiveFid));
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

    // 3. Save locally as offline fallback scoped to franchise
    try {
      localStorage.setItem(getDenomsStorageKey(date, effectiveFid), JSON.stringify(denominations));
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
    userId: user?.uid || entry.userId || '',
    franchiseId: entry.franchiseId || currentFranchiseId || 'NONE'
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
        saveDailyDenominations(entry.date, entry.denominations, true, entryWithUser.franchiseId).catch(err => {
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
    const docRef = doc(db, 'settings', currentFranchiseId || 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Settings;
      return data;
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
      await setDoc(doc(db, 'settings', currentFranchiseId || 'global'), settings);
    }

    triggerDataUpdated('settings', 'global');
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

const DEFAULT_INVENTORY: InventoryStock = {
  id: 'global',
  stickQuantity: 0,
  potQuantity: 0,
  lastUpdatedDate: new Date().toISOString().split('T')[0],
  stickFlavours: [
    { name: 'Pista badam', quantity: 0 }
  ],
  potFlavours: [
    { name: 'Badam', quantity: 0 },
    { name: 'Pistha', quantity: 0 },
    { name: 'Pistha badam', quantity: 0 },
    { name: 'Shahi gulab', quantity: 0 }
  ]
};

export async function getInventoryStock(): Promise<InventoryStock> {
  if (isSupabaseConfigured()) {
    const supabaseInv = await fetchInventoryFromSupabase();
    if (supabaseInv) return supabaseInv;
  }

  try {
    const docRef = doc(db, 'inventory', currentFranchiseId || 'global');
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
    id: item.id || currentFranchiseId || 'global',
    franchiseId: item.franchiseId || currentFranchiseId || 'NONE',
    userId: user?.uid || item.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertInventoryToSupabase(itemWithUser, user?.uid || '');
    } else {
      await setDoc(doc(db, 'inventory', currentFranchiseId || 'global'), itemWithUser);
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

  const q = buildFranchiseQuery(db, 'expenses', currentFranchiseId);
  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
    const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
    const existingIds = new Set(docs.map(d => d.id));
    return docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function saveExpense(expense: ExpenseEntry): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const expenseWithUser = {
    ...expense,
    franchiseId: expense.franchiseId || currentFranchiseId || 'NONE',
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
    franchiseId: withdrawal.franchiseId || currentFranchiseId || 'NONE',
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
    franchiseId: order.franchiseId || currentFranchiseId || 'NONE',
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
    franchiseId: newOrder.franchiseId || currentFranchiseId || 'NONE',
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

export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {
  const activeFid = franchiseId || currentFranchiseId;
  const [databaseType, setDatabaseType] = useState<'supabase' | 'firestore'>(() => {
    return isSupabaseConfigured() ? 'supabase' : 'firestore';
  });

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

        const dMap: Record<string, DailyDenominationsRecord> = {};

        if (supEntries && supEntries.length > 0) {
          const filteredEntries = (activeFid && activeFid !== 'all') ? supEntries.filter(e => e.franchiseId === activeFid) : supEntries;
          setEntries(filteredEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setEntriesLoading(false);

          filteredEntries.forEach(e => {
            if (e.denominations) {
              const denoms = e.denominations;
              const total = (
                ((Number(denoms.n500) || 0) * 500) +
                ((Number(denoms.n200) || 0) * 200) +
                ((Number(denoms.n100) || 0) * 100) +
                ((Number(denoms.n50) || 0) * 50) +
                ((Number(denoms.n20) || 0) * 20) +
                ((Number(denoms.n10) || 0) * 10) +
                (Number(denoms.coins) || 0)
              );
              dMap[e.date] = {
                franchiseId: activeFid || 'NONE',
                date: e.date,
                denominations: denoms,
                total,
                updatedBy: 'Entry',
                updatedAt: new Date().toISOString()
              };
            }
          });
        } else {
          setEntries([]);
          setEntriesLoading(false);
        }

        // Also fetch live drafts from Firestore daily_denominations for this franchise
        try {
          const denomsSnap = await getDocs(buildFranchiseQuery(db, 'daily_denominations', activeFid));
          if (denomsSnap && !denomsSnap.empty) {
            denomsSnap.docs.forEach(docSnap => {
              const d = docSnap.data() as DailyDenominationsRecord;
              if (d && (!activeFid || activeFid === 'all' || d.franchiseId === activeFid)) {
                dMap[d.date || docSnap.id] = d;
              }
            });
          }
        } catch {}

        setDailyDenominationsMap(dMap);

        if (supSettings) {
          setSettings(supSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setSettingsLoading(false);

        if (supInventory) {
          setInventory(supInventory);
        } else {
          setInventory(DEFAULT_INVENTORY);
        }
        setInventoryLoading(false);

        if (supExpenses && supExpenses.length > 0) {
          const filteredExpenses = (activeFid && activeFid !== 'all') ? supExpenses.filter(e => e.franchiseId === activeFid) : supExpenses;
          setExpenses(filteredExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setExpensesLoading(false);
        } else {
          setExpenses([]);
          setExpensesLoading(false);
        }

        if (supProfits) {
          const filteredProfits = (activeFid && activeFid !== 'all') ? supProfits.filter(e => e.franchiseId === activeFid) : supProfits;
          setProfitWithdrawals(filteredProfits.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setProfitWithdrawalsLoading(false);
        }

        if (supSpecials && supSpecials.length > 0) {
          const filteredSpecials = (activeFid && activeFid !== 'all') ? supSpecials.filter(e => e.franchiseId === activeFid) : supSpecials;
          setSpecialOrders(filteredSpecials.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
          setSpecialOrdersLoading(false);
        } else {
          setSpecialOrders([]);
          setSpecialOrdersLoading(false);
        }

        setLastSynced(new Date());
        return;
      }

      // Firestore Fetching
      const fetchCollection = async (collName: string) => {
        try {
          return await getDocsFromServer(buildFranchiseQuery(db, collName, activeFid));
        } catch {
          return await getDocs(buildFranchiseQuery(db, collName, activeFid));
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
        fetchDocument('settings', activeFid || 'global'),
        fetchDocument('inventory', activeFid || 'global'),
        fetchCollection('expenses'),
        fetchCollection('profitWithdrawals'),
        fetchCollection('specialOrders'),
        fetchCollection('daily_denominations')
      ]);

      const dMap: Record<string, DailyDenominationsRecord> = {};
      if (denomsSnap) {
        denomsSnap.docs.forEach(docSnap => {
          const d = docSnap.data() as DailyDenominationsRecord;
          if (d && (!activeFid || activeFid === 'all' || d.franchiseId === activeFid)) {
            dMap[d.date || docSnap.id] = d;
          }
        });
      }
      setDailyDenominationsMap(dMap);

      if (entriesSnap) {
        const docs = entriesSnap.docs.map(d => ({ ...d.data(), id: d.id } as DailyEntry));
        setEntries(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setEntriesLoading(false);
      }

      if (settingsSnap && settingsSnap.exists()) {
        const data = settingsSnap.data() as Settings;
        setSettings(data);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setSettingsLoading(false);

      if (inventorySnap && inventorySnap.exists()) {
        setInventory(inventorySnap.data() as InventoryStock);
      } else {
        setInventory(DEFAULT_INVENTORY);
      }
      setInventoryLoading(false);

      if (expensesSnap) {
        const docs = expensesSnap.docs.map(d => ({ ...d.data(), id: d.id } as ExpenseEntry));
        const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
        const existingIds = new Set(docs.map(d => d.id));
        setExpenses(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
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
        setSpecialOrders(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        setSpecialOrdersLoading(false);
      }

      setLastSynced(new Date());
    } catch (err) {
      console.warn("Database sync refresh warning:", err);
      setEntriesLoading(false);
      setSettingsLoading(false);
      setInventoryLoading(false);
      setExpensesLoading(false);
      setProfitWithdrawalsLoading(false);
      setSpecialOrdersLoading(false);
    } finally {
      setIsSyncing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    console.log('StoreProvider useEffect, currentFranchiseId:', currentFranchiseId);
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
      

      try {
        const unsubEntries = onSnapshot(
          buildFranchiseQuery(db, 'entries', activeFid),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailyEntry));
            setEntries(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setHasMoreEntries(docs.length >= entriesLimit);
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
          doc(db, 'settings', activeFid || 'global'),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Settings;
              setSettings(data);
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
          doc(db, 'inventory', activeFid || 'global'),
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
          buildFranchiseQuery(db, 'expenses', activeFid),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseEntry));
            const existingSignatures = new Set(docs.map(d => `${d.date}-${d.amount}-${d.category}`));
            const existingIds = new Set(docs.map(d => d.id));
            setExpenses(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setHasMoreExpenses(docs.length >= expensesLimit);
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
          buildFranchiseQuery(db, 'profitWithdrawals', activeFid),
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
          buildFranchiseQuery(db, 'specialOrders', activeFid),
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SpecialOrder));
            const existingIds = new Set(docs.map(d => d.id));
            setSpecialOrders(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
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
        buildFranchiseQuery(db, 'daily_denominations', activeFid),
        (snapshot) => {
          const dMap: Record<string, DailyDenominationsRecord> = {};
          snapshot.docs.forEach(docSnap => {
            const d = docSnap.data() as DailyDenominationsRecord;
            if (d && (!activeFid || activeFid === 'all' || d.franchiseId === activeFid)) {
              dMap[d.date || docSnap.id] = d;
            }
          });
          setDailyDenominationsMap(dMap);
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
    window.addEventListener('franchiseChanged', handleDataUpdated);

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
      window.removeEventListener('franchiseChanged', handleDataUpdated);
    };
  }, [activeFid, entriesLimit, expensesLimit, refreshAllFromServer]);

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

  const saveDenominations = useCallback(async (date: string, denoms: Denominations, fid?: string | null) => {
    await saveDailyDenominations(date, denoms, false, fid);
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
    let isMounted = true;

    const loadSupabaseLogs = async () => {
      try {
        const data = await fetchLogsFromSupabase(limitCount);
        if (isMounted) {
          if (data) {
            let filtered = data;
            if (currentFranchiseId && currentFranchiseId !== 'all') {
              filtered = data.filter(l => !l.franchiseId || l.franchiseId === currentFranchiseId || l.franchiseId === 'global');
            }
            setLogs(filtered);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading logs from Supabase:", err);
        if (isMounted) setLoading(false);
      }
    };

    if (isSupabaseConfigured()) {
      loadSupabaseLogs();

      const handleDataUpdated = (e: any) => {
        const type = e?.detail?.type;
        const id = e?.detail?.id;
        if (type === 'logs' || type === 'all') {
          if (id === 'cleared') {
            setLogs([]);
          } else {
            loadSupabaseLogs();
          }
        }
      };
      window.addEventListener('app-data-updated', handleDataUpdated);
      return () => {
        isMounted = false;
        window.removeEventListener('app-data-updated', handleDataUpdated);
      };
    }

    // Firestore listener:
    // Querying with order by timestamp and filtering in memory avoids composite index requirement
    const logsColl = collection(db, 'logs');
    const q = query(logsColl, orderBy('timestamp', 'desc'), limit(limitCount));
    
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = onSnapshot(q, (snapshot) => {
        let docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppLog));
        if (currentFranchiseId && currentFranchiseId !== 'all') {
          docs = docs.filter(l => !l.franchiseId || l.franchiseId === currentFranchiseId || l.franchiseId === 'global');
        }
        if (isMounted) {
          setLogs(docs);
          setLoading(false);
        }
      }, (error) => {
        console.warn("Realtime logs snapshot with order warning:", error);
        const fallbackUnsub = onSnapshot(logsColl, (snapshot) => {
          let docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppLog));
          if (currentFranchiseId && currentFranchiseId !== 'all') {
            docs = docs.filter(l => !l.franchiseId || l.franchiseId === currentFranchiseId || l.franchiseId === 'global');
          }
          docs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          if (isMounted) {
            setLogs(docs.slice(0, limitCount));
            setLoading(false);
          }
        }, (err2) => {
          console.error("Firestore logs fallback error:", err2);
          if (isMounted) setLoading(false);
        });
        unsubscribe = fallbackUnsub;
      });
    } catch (e) {
      console.error("Failed to attach logs snapshot:", e);
      setLoading(false);
    }

    const handleDataUpdated = (e: any) => {
      const type = e?.detail?.type;
      const id = e?.detail?.id;
      if ((type === 'logs' || type === 'all') && id === 'cleared') {
        setLogs([]);
      }
    };
    window.addEventListener('app-data-updated', handleDataUpdated);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('app-data-updated', handleDataUpdated);
    };
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
    franchiseId: currentFranchiseId || 'global',
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
      console.warn("Firestore addLog error:", error);
    }
  }
  triggerDataUpdated('logs', log.id);
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
      franchiseId: log.franchiseId || currentFranchiseId || 'global',
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
    let supabaseSuccess = true;
    if (isSupabaseConfigured()) {
      supabaseSuccess = await clearLogsFromSupabase();
    }
    
    // Clear from Firestore as well to keep both databases in sync
    try {
      const logsColl = collection(db, 'logs');
      const snapshot = await getDocs(logsColl);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        const toDelete = (currentFranchiseId && currentFranchiseId !== 'all')
          ? docs.filter(d => {
              const data = d.data();
              return !data.franchiseId || data.franchiseId === currentFranchiseId || data.franchiseId === 'global';
            })
          : docs;

        const batchSize = 300;
        for (let i = 0; i < toDelete.length; i += batchSize) {
          const chunk = toDelete.slice(i, i + batchSize);
          await Promise.all(chunk.map(d => deleteDoc(doc(db, 'logs', d.id))));
        }
      }
    } catch (fsErr) {
      console.error("Error clearing logs from Firestore:", fsErr);
      if (!isSupabaseConfigured()) {
        throw fsErr;
      }
    }

    if (!supabaseSuccess && isSupabaseConfigured()) {
      throw new Error("Failed to clear logs from Supabase database.");
    }

    // Trigger update so all listeners instantly clear their view
    triggerDataUpdated('logs', 'cleared');
  } catch (error) {
    console.error("Error clearing logs:", error);
    throw error;
  }
}
