import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from 'react';
import { DailyEntry, Settings, InventoryStock, ExpenseEntry, AppLog, ProfitWithdrawal, SpecialOrder, Denominations, DailyDenominationsRecord, QuickBill } from './types';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
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
  enablePlate: false,
  enablePlatformFee: false,
  stickPrice: 40,
  potPrice: 50,
  platePrice: 75,
  platformFee: 0,
  monthlyGoal: 150000,
  upiId: 'nammaoorukulfi@oksbi',
  upiName: 'Namma Ooru Kulfi',
  googleReviewUrl: '',
  instagramUrl: '',
  storeTagline: '100% Traditional Malai & Pot Kulfi',
  storePhone: '',
  storeAddress: '',
  billPrefix: 'NOK-',
  autoSyncBillToEntry: true
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
        await safeSetDoc(doc(db, 'entries', entry.id), {
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
        await safeSetDoc(doc(db, 'expenses', exp.id), {
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
        await safeSetDoc(doc(db, 'specialOrders', order.id), {
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
    await safeSetDoc(doc(db, 'daily_denominations', docId), record, { merge: true });

    // 2. Also update entry document if one exists for this date in Firestore
    if (!skipEntrySync) {
      try {
        const q = query(collection(db, 'entries'), where('date', '==', date), where('franchiseId', '==', effectiveFid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matching = snap.docs[0];
          await safeSetDoc(doc(db, 'entries', matching.id), {
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
      promises.push(safeSetDoc(doc(db, 'entries', entry.id), entryWithUser));
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

export async function getSettings(targetFid?: string | null): Promise<Settings> {
  const fid = targetFid || currentFranchiseId || 'global';
  const targetDocId = (fid === 'all' || !fid) ? 'global' : fid;

  let merged: Settings = DEFAULT_SETTINGS;

  // 1. Try reading from Firestore (contains full digital receipt, UPI & Google review settings)
  try {
    const docRef = doc(db, 'settings', targetDocId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      merged = { ...DEFAULT_SETTINGS, ...(docSnap.data() as Settings) };
    } else if (targetDocId !== 'global') {
      const globalSnap = await getDoc(doc(db, 'settings', 'global'));
      if (globalSnap.exists()) {
        merged = { ...DEFAULT_SETTINGS, ...(globalSnap.data() as Settings) };
      }
    }
  } catch (error) {
    console.warn("Firestore getSettings fallback:", error);
  }

  // 2. If Supabase is configured, overlay relational prices & monthly goal
  if (isSupabaseConfigured()) {
    try {
      const supabaseSettings = await fetchSettingsFromSupabase();
      if (supabaseSettings) {
        merged = {
          ...merged,
          stickPrice: supabaseSettings.stickPrice || merged.stickPrice,
          potPrice: supabaseSettings.potPrice || merged.potPrice,
          platePrice: supabaseSettings.platePrice || merged.platePrice,
          monthlyGoal: supabaseSettings.monthlyGoal || merged.monthlyGoal,
          enableStick: supabaseSettings.enableStick ?? merged.enableStick,
          enablePot: supabaseSettings.enablePot ?? merged.enablePot,
          enablePlate: supabaseSettings.enablePlate ?? merged.enablePlate,
          enablePlatformFee: supabaseSettings.enablePlatformFee ?? merged.enablePlatformFee,
          platformFee: supabaseSettings.platformFee ?? merged.platformFee,
          expensePaidByNames: supabaseSettings.expensePaidByNames || merged.expensePaidByNames,
          expenseCategories: supabaseSettings.expenseCategories || merged.expenseCategories,
        };
      }
    } catch (e) {
      console.warn("Supabase fetchSettings fallback warning:", e);
    }
  }

  return merged;
}

export async function saveSettings(settings: Settings, targetFid?: string | null): Promise<void> {
  triggerWriteStart();
  const fid = targetFid || currentFranchiseId || 'global';
  const targetDocId = (fid === 'all' || !fid || fid === 'NONE') ? 'global' : fid;

  // Defensive serialization: Remove undefined properties to prevent Firestore serialization errors
  const cleanSettings: any = {};
  Object.entries(settings).forEach(([key, val]) => {
    if (val !== undefined) {
      cleanSettings[key] = val;
    }
  });
  cleanSettings.franchiseId = targetDocId;
  cleanSettings.updatedAt = new Date().toISOString();

  // 1. Instant local storage cache update for instantaneous zero-lag UI
  try {
    localStorage.setItem(`kulfi_cache_settings_${targetDocId}`, JSON.stringify(cleanSettings));
    localStorage.setItem('kulfi_cache_settings_global', JSON.stringify(cleanSettings));
    if (currentFranchiseId && currentFranchiseId !== 'all' && currentFranchiseId !== 'NONE') {
      localStorage.setItem(`kulfi_cache_settings_${currentFranchiseId}`, JSON.stringify(cleanSettings));
    }
  } catch {}

  // 2. ALWAYS save to Firestore: this guarantees QR codes, review URLs, and UPI VPAs are persistent
  try {
    await safeSetDoc(doc(db, 'settings', targetDocId), cleanSettings, { merge: true });
    if (targetDocId !== 'global') {
      // Also update global fallback doc so superadmin & defaults share latest config
      await safeSetDoc(doc(db, 'settings', 'global'), cleanSettings, { merge: true });
    }
  } catch (error) {
    console.error("Firestore saveSettings error:", error);
    throw error;
  }

  // 3. Sync pricing and targets to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await upsertSettingsToSupabase(cleanSettings);
    } catch (supErr) {
      console.warn("Supabase saveSettings notice:", supErr);
    }
  }

  await addLog('UPDATE_SETTINGS', 'Updated store settings & digital receipt config');
  triggerDataUpdated('settings', targetDocId);
}

// Master list of Stick Kulfi flavours in the exact official sequence requested
export const MASTER_STICK_FLAVOURS = [
  'Mango malai',
  'Kesar Badam',
  'Malai',
  'Kesar pista',
  'Chocolate',
  'Pista badam',
  'Shahi gulab',
  'Black current',
  'Strawberry',
  'Dry fruit',
  'Coconut',
  'Gulkand',
  'Blue berry',
  'Kesar kajoor',
  'Guava',
] as const;

// Master list of Pot Kulfi flavours in the exact official sequence requested
export const MASTER_POT_FLAVOURS = [
  'Badam',
  'Pista',
  'Pistabadam',
  'Shahi gulab',
] as const;

// Helper to normalize flavour names for robust case/spacing/alias-insensitive matching
export function normalizeFlavourKey(name: string): string {
  let cleaned = (name || '').toLowerCase().replace(/[\s\-_]+/g, '').trim();
  cleaned = cleaned.replace(/pistha/g, 'pista');
  cleaned = cleaned.replace(/khajoor/g, 'kajoor');
  cleaned = cleaned.replace(/blackcurrant/g, 'blackcurrent');
  return cleaned;
}

// Arranges any incoming flavours according to the master sequence, preserving recorded stock
export function arrangeFlavoursInSequence(
  existingFlavours: { name: string; quantity: number }[] | undefined,
  masterList: readonly string[]
): { name: string; quantity: number }[] {
  const existingMap = new Map<string, number>();
  (existingFlavours || []).forEach(f => {
    if (f && f.name) {
      existingMap.set(normalizeFlavourKey(f.name), f.quantity || 0);
    }
  });

  // 1. Arrange master flavours in exact official sequence
  const result: { name: string; quantity: number }[] = masterList.map(name => {
    const key = normalizeFlavourKey(name);
    return {
      name,
      quantity: existingMap.get(key) ?? 0
    };
  });

  // 2. Append any additional custom flavours not in master list
  (existingFlavours || []).forEach(f => {
    if (f && f.name) {
      const key = normalizeFlavourKey(f.name);
      if (!masterList.some(m => normalizeFlavourKey(m) === key)) {
        result.push(f);
      }
    }
  });

  return result;
}

export const DEFAULT_INVENTORY: InventoryStock = {
  id: 'global',
  stickQuantity: 1231,
  potQuantity: 0,
  lastUpdatedDate: '2026-08-21',
  stickFlavours: arrangeFlavoursInSequence([
    { name: 'Mango malai', quantity: 120 },
    { name: 'Kesar Badam', quantity: 360 },
    { name: 'Malai', quantity: 90 },
    { name: 'Kesar pista', quantity: 108 },
    { name: 'Chocolate', quantity: 150 },
    { name: 'Pista badam', quantity: 120 },
    { name: 'Shahi gulab', quantity: 120 },
    { name: 'Black current', quantity: 78 },
    { name: 'Strawberry', quantity: 90 },
    { name: 'Dry fruit', quantity: 60 },
    { name: 'Coconut', quantity: 0 },
    { name: 'Gulkand', quantity: 12 },
    { name: 'Blue berry', quantity: 60 },
    { name: 'Kesar kajoor', quantity: 0 },
    { name: 'Guava', quantity: 12 }
  ], MASTER_STICK_FLAVOURS),
  potFlavours: MASTER_POT_FLAVOURS.map(name => ({ name, quantity: 0 }))
};

export async function getInventoryStock(): Promise<InventoryStock> {
  if (isSupabaseConfigured()) {
    const supabaseInv = await fetchInventoryFromSupabase();
    if (supabaseInv) {
      return {
        ...supabaseInv,
        stickFlavours: arrangeFlavoursInSequence(supabaseInv.stickFlavours, MASTER_STICK_FLAVOURS),
        potFlavours: arrangeFlavoursInSequence(supabaseInv.potFlavours, MASTER_POT_FLAVOURS)
      };
    }
  }

  try {
    let docRef = doc(db, 'inventory', currentFranchiseId || 'global');
    let docSnap = await getDoc(docRef);
    if ((!docSnap.exists() || !docSnap.data()?.stickQuantity) && currentFranchiseId && currentFranchiseId !== 'global') {
      const globalSnap = await getDoc(doc(db, 'inventory', 'global'));
      if (globalSnap.exists()) {
        docSnap = globalSnap;
      }
    }
    if (docSnap.exists()) {
      const data = docSnap.data() as InventoryStock;
      const arranged = {
        ...data,
        stickFlavours: arrangeFlavoursInSequence(data.stickFlavours, MASTER_STICK_FLAVOURS),
        potFlavours: arrangeFlavoursInSequence(data.potFlavours, MASTER_POT_FLAVOURS)
      };
      if (currentFranchiseId && currentFranchiseId !== 'global' && currentFranchiseId !== 'all') {
        safeSetDoc(doc(db, 'inventory', currentFranchiseId), {
          ...arranged,
          id: currentFranchiseId,
          franchiseId: currentFranchiseId,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
      return arranged;
    }
  } catch (error) {
    console.error("Error fetching inventory stock:", error);
  }

  return DEFAULT_INVENTORY;
}

export async function saveInventoryStock(item: InventoryStock): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const orderedSticks = arrangeFlavoursInSequence(item.stickFlavours, MASTER_STICK_FLAVOURS);
  const orderedPots = arrangeFlavoursInSequence(item.potFlavours, MASTER_POT_FLAVOURS);
  const itemWithUser = {
    ...item,
    id: item.id || currentFranchiseId || 'global',
    franchiseId: item.franchiseId || currentFranchiseId || 'NONE',
    userId: user?.uid || item.userId || '',
    updatedAt: new Date().toISOString(),
    stickFlavours: orderedSticks,
    potFlavours: orderedPots
  };

  try {
    if (isSupabaseConfigured()) {
      await upsertInventoryToSupabase(itemWithUser, user?.uid || '');
    } else {
      await safeSetDoc(doc(db, 'inventory', currentFranchiseId || 'global'), itemWithUser);
      if (currentFranchiseId && currentFranchiseId !== 'global') {
        await safeSetDoc(doc(db, 'inventory', 'global'), { ...itemWithUser, id: 'global' }, { merge: true }).catch(() => {});
      } else {
        await safeSetDoc(doc(db, 'inventory', 'F-1788087111153'), { ...itemWithUser, id: 'F-1788087111153', franchiseId: 'F-1788087111153' }, { merge: true }).catch(() => {});
      }
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
      await safeSetDoc(doc(db, 'expenses', expense.id), expenseWithUser);
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
      await safeSetDoc(doc(db, 'profitWithdrawals', withdrawal.id), withdrawalWithUser);
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
      await safeSetDoc(doc(db, 'specialOrders', order.id), orderWithUser);
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
      await safeSetDoc(doc(db, 'specialOrders', newOrder.id), orderWithUser);
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

// Helper to remove any undefined fields before sending to Firestore
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore) as unknown as T;
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = sanitizeForFirestore(val);
    }
  }
  return cleaned;
}

export async function safeSetDoc(docRef: any, data: any, options?: any) {
  const cleaned = sanitizeForFirestore(data);
  if (options) {
    return await setDoc(docRef, cleaned, options);
  } else {
    return await setDoc(docRef, cleaned);
  }
}

export async function saveQuickBill(bill: QuickBill, autoSyncToEntry: boolean = true): Promise<void> {
  const user = auth.currentUser;
  triggerWriteStart();
  const billWithUser: QuickBill = {
    ...bill,
    franchiseId: bill.franchiseId || currentFranchiseId || 'NONE',
    userId: user?.uid || bill.userId || '',
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'bills', bill.id), sanitizeForFirestore(billWithUser));

    if (autoSyncToEntry) {
      try {
        const q = buildFranchiseQuery(db, 'entries', billWithUser.franchiseId, where('date', '==', bill.date));
        const snap = await getDocs(q);

        const stickQty = bill.items.filter(i => i.category === 'stick').reduce((sum, i) => sum + i.quantity, 0);
        const potQty = bill.items.filter(i => i.category === 'pot').reduce((sum, i) => sum + i.quantity, 0);
        const plateQty = bill.items.filter(i => i.category === 'plate').reduce((sum, i) => sum + i.quantity, 0);

        let cashAdd = 0;
        let upiAdd = 0;
        if (bill.paymentMethod === 'upi') {
          upiAdd = bill.totalAmount;
        } else if (bill.paymentMethod === 'cash') {
          cashAdd = bill.totalAmount;
        } else if (bill.paymentMethod === 'split') {
          cashAdd = bill.cashAmount || 0;
          upiAdd = bill.upiAmount || 0;
        }

        let currentSettings: Settings = DEFAULT_SETTINGS;
        try {
          const cached = localStorage.getItem(`kulfi_cache_settings_${currentFranchiseId || 'global'}`) || localStorage.getItem('kulfi_cache_settings_global');
          if (cached) currentSettings = JSON.parse(cached);
        } catch {}
        const stickPrice = currentSettings.stickPrice || 40;
        const potPrice = currentSettings.potPrice || 50;
        const platePrice = currentSettings.platePrice || 75;

        if (!snap.empty) {
          const matchingDoc = snap.docs[0];
          const existingEntry = matchingDoc.data() as DailyEntry;
          const updatedStickSold = (existingEntry.stickSold || 0) + stickQty;
          const updatedPotSold = (existingEntry.potSold || 0) + potQty;
          const updatedPlateSold = (existingEntry.plateSold || 0) + plateQty;
          const updatedPhonePe = (existingEntry.phonePe || 0) + upiAdd;
          const updatedCashBagTotal = (existingEntry.cashBagTotal || 0) + cashAdd;
          const updatedActualAmount = updatedCashBagTotal + updatedPhonePe;
          
          const updatedRequired = (updatedStickSold * stickPrice) + 
                                  (updatedPotSold * potPrice) + 
                                  (updatedPlateSold * platePrice);

          const shortage = Math.max(0, updatedRequired - updatedActualAmount);
          const bonus = Math.max(0, updatedActualAmount - updatedRequired);

          await safeSetDoc(doc(db, 'entries', matchingDoc.id), {
            ...existingEntry,
            stickSold: updatedStickSold,
            potSold: updatedPotSold,
            plateSold: updatedPlateSold,
            phonePe: updatedPhonePe,
            cashBagTotal: updatedCashBagTotal,
            actualAmount: updatedActualAmount,
            requiredAmount: updatedRequired,
            shortage,
            bonus,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else {
          const newEntryId = `entry_${bill.date}_${billWithUser.franchiseId || 'default'}`;
          const initialRequired = (stickQty * stickPrice) + (potQty * potPrice) + (plateQty * platePrice);
          const initialActual = cashAdd + upiAdd;
          const initialShortage = Math.max(0, initialRequired - initialActual);
          const initialBonus = Math.max(0, initialActual - initialRequired);

          const newEntry: DailyEntry = {
            id: newEntryId,
            date: bill.date,
            franchiseId: billWithUser.franchiseId,
            stickLoaded: stickQty,
            stickSold: stickQty,
            stickBalance: 0,
            potLoaded: potQty,
            potSold: potQty,
            potBalance: 0,
            plateLoaded: plateQty,
            plateSold: plateQty,
            plateBalance: 0,
            cashBagLoaded: 0,
            cashBagTotal: cashAdd,
            phonePe: upiAdd,
            discount: bill.discount || 0,
            requiredAmount: initialRequired,
            actualAmount: initialActual,
            shortage: initialShortage,
            bonus: initialBonus,
            finalAmount: initialActual,
            expenses: 0,
            notes: `Auto-created from POS Bill #${bill.billNumber}`,
            userId: user?.uid || '',
            updatedAt: new Date().toISOString()
          };
          await safeSetDoc(doc(db, 'entries', newEntryId), newEntry);
        }
      } catch (syncErr) {
        console.warn("Could not auto-sync bill to daily entry:", syncErr);
      }
    }

    triggerDataUpdated('bills', bill.id);
  } catch (error) {
    console.error("Error saving quick bill:", error);
    throw error;
  }
}

export async function deleteQuickBill(id: string): Promise<void> {
  triggerWriteStart();
  try {
    const docRef = doc(db, 'bills', id);
    try {
      const snap = await getDoc(docRef);
      let billNumber = id;
      if (snap.exists()) {
        const data = snap.data() as QuickBill;
        billNumber = data.billNumber || id;
      }
      await deleteDoc(docRef);
      await addLog('DELETE_BILL', `Deleted Bill #${billNumber}`);
    } catch (dbErr) {
      console.warn("Firestore delete bill warning (proceeding with local removal):", dbErr);
    }
    triggerDataUpdated('bills', id);
  } catch (error) {
    console.error("Error deleting quick bill:", error);
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
  bills: QuickBill[];
  billsLoading: boolean;
  dailyDenominationsMap: Record<string, DailyDenominationsRecord>;
  refreshAllFromServer: () => Promise<void>;
  isSyncing: boolean;
  lastSynced: Date;
  databaseType: 'supabase' | 'firestore';
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {
  const activeFid = franchiseId || currentFranchiseId;
  const cacheKeySuffix = activeFid || 'global';
  const [databaseType, setDatabaseType] = useState<'supabase' | 'firestore'>(() => {
    return isSupabaseConfigured() ? 'supabase' : 'firestore';
  });

  // 1. Instant Cache Hydration: Read immediately from localStorage so UI displays within 0.05s
  const [entries, setEntries] = useState<DailyEntry[]>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_entries_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [entriesLoading, setEntriesLoading] = useState(() => entries.length === 0);
  const [entriesLimit, setEntriesLimit] = useState(1000);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_settings_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [inventory, setInventory] = useState<InventoryStock>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_inventory_${cacheKeySuffix}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const hasFlavours = (parsed.stickFlavours || []).some((f: any) => (f.quantity || 0) > 0);
        if (parsed.stickQuantity > 0 || hasFlavours) {
          return {
            ...parsed,
            stickFlavours: arrangeFlavoursInSequence(parsed.stickFlavours, MASTER_STICK_FLAVOURS),
            potFlavours: arrangeFlavoursInSequence(parsed.potFlavours, MASTER_POT_FLAVOURS)
          };
        }
      }
      const globalCached = localStorage.getItem('kulfi_cache_inventory_global');
      if (globalCached) {
        const parsedGlobal = JSON.parse(globalCached);
        const hasGlobalFlavours = (parsedGlobal.stickFlavours || []).some((f: any) => (f.quantity || 0) > 0);
        if (parsedGlobal.stickQuantity > 0 || hasGlobalFlavours) {
          return {
            ...parsedGlobal,
            stickFlavours: arrangeFlavoursInSequence(parsedGlobal.stickFlavours, MASTER_STICK_FLAVOURS),
            potFlavours: arrangeFlavoursInSequence(parsedGlobal.potFlavours, MASTER_POT_FLAVOURS)
          };
        }
      }
      return DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_expenses_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [expensesLoading, setExpensesLoading] = useState(() => expenses.length === 0);
  const [expensesLimit, setExpensesLimit] = useState(1000);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);

  const [profitWithdrawals, setProfitWithdrawals] = useState<ProfitWithdrawal[]>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_profits_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [profitWithdrawalsLoading, setProfitWithdrawalsLoading] = useState(false);
  
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_specials_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [specialOrdersLoading, setSpecialOrdersLoading] = useState(false);

  const [bills, setBills] = useState<QuickBill[]>(() => {
    try {
      const cached = localStorage.getItem(`kulfi_cache_bills_${cacheKeySuffix}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [billsLoading, setBillsLoading] = useState(false);

  const [dailyDenominationsMap, setDailyDenominationsMap] = useState<Record<string, DailyDenominationsRecord>>({});

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const isRefreshingRef = useRef(false);
  const lastAutoRefreshRef = useRef(0);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const refreshAllFromServer = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsSyncing(true);

    const withTimeout = async <T,>(p: Promise<T>, ms = 4500): Promise<T | null> => {
      let t: any;
      const timeoutPromise = new Promise<null>((resolve) => {
        t = setTimeout(() => resolve(null), ms);
      });
      return Promise.race([p, timeoutPromise]).finally(() => clearTimeout(t));
    };

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
          withTimeout(fetchEntriesFromSupabase()),
          withTimeout(fetchSettingsFromSupabase()),
          withTimeout(fetchInventoryFromSupabase()),
          withTimeout(fetchExpensesFromSupabase()),
          withTimeout(fetchProfitWithdrawalsFromSupabase()),
          withTimeout(fetchSpecialOrdersFromSupabase())
        ]);

        const dMap: Record<string, DailyDenominationsRecord> = {};

        if (supEntries && supEntries.length > 0) {
          const filteredEntries = (activeFid && activeFid !== 'all') ? supEntries.filter(e => e.franchiseId === activeFid) : supEntries;
          const sorted = filteredEntries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setEntries(sorted);
          try { localStorage.setItem(`kulfi_cache_entries_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
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
        } else if (supEntries) {
          setEntries([]);
          try { localStorage.setItem(`kulfi_cache_entries_${cacheKeySuffix}`, JSON.stringify([])); } catch {}
          setEntriesLoading(false);
        } else {
          setEntriesLoading(false);
        }

        // Also fetch live drafts from Firestore daily_denominations for this franchise with timeout
        try {
          const denomsSnap = await withTimeout(getDocs(buildFranchiseQuery(db, 'daily_denominations', activeFid)), 3000);
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

        // Fetch Firestore settings so digital receipt, UPI, and review QR configurations are preserved
        let mergedSettings: Settings = { ...DEFAULT_SETTINGS, ...settings };
        try {
          const cached = localStorage.getItem(`kulfi_cache_settings_${cacheKeySuffix}`) || localStorage.getItem('kulfi_cache_settings_global');
          if (cached) {
            mergedSettings = { ...mergedSettings, ...JSON.parse(cached) };
          }
        } catch {}

        const targetSettingsDocId = (activeFid && activeFid !== 'all' && activeFid !== 'NONE') ? activeFid : 'global';
        try {
          const fsDoc = await withTimeout(getDoc(doc(db, 'settings', targetSettingsDocId)), 3500);
          if (fsDoc && fsDoc.exists()) {
            mergedSettings = { ...mergedSettings, ...(fsDoc.data() as Settings) };
          } else if (targetSettingsDocId !== 'global') {
            const globalDoc = await withTimeout(getDoc(doc(db, 'settings', 'global')), 2500);
            if (globalDoc && globalDoc.exists()) {
              mergedSettings = { ...mergedSettings, ...(globalDoc.data() as Settings) };
            }
          }
        } catch (e) {
          console.warn("Firestore settings read in Supabase mode warning:", e);
        }

        if (supSettings) {
          mergedSettings = {
            ...mergedSettings,
            stickPrice: supSettings.stickPrice || mergedSettings.stickPrice,
            potPrice: supSettings.potPrice || mergedSettings.potPrice,
            platePrice: supSettings.platePrice || mergedSettings.platePrice,
            monthlyGoal: supSettings.monthlyGoal || mergedSettings.monthlyGoal,
            enableStick: supSettings.enableStick ?? mergedSettings.enableStick,
            enablePot: supSettings.enablePot ?? mergedSettings.enablePot,
            enablePlate: supSettings.enablePlate ?? mergedSettings.enablePlate,
            enablePlatformFee: supSettings.enablePlatformFee ?? mergedSettings.enablePlatformFee,
            platformFee: supSettings.platformFee ?? mergedSettings.platformFee,
            expensePaidByNames: supSettings.expensePaidByNames || mergedSettings.expensePaidByNames,
            expenseCategories: supSettings.expenseCategories || mergedSettings.expenseCategories,
          };
        }
        setSettings(mergedSettings);
        try { localStorage.setItem(`kulfi_cache_settings_${cacheKeySuffix}`, JSON.stringify(mergedSettings)); } catch {}
        setSettingsLoading(false);

        if (supInventory) {
          const arrangedInventory: InventoryStock = {
            ...supInventory,
            stickFlavours: arrangeFlavoursInSequence(supInventory.stickFlavours, MASTER_STICK_FLAVOURS),
            potFlavours: arrangeFlavoursInSequence(supInventory.potFlavours, MASTER_POT_FLAVOURS)
          };
          setInventory(arrangedInventory);
          try { localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(arrangedInventory)); } catch {}
        }
        setInventoryLoading(false);

        if (supExpenses && supExpenses.length > 0) {
          const filteredExpenses = (activeFid && activeFid !== 'all') ? supExpenses.filter(e => e.franchiseId === activeFid) : supExpenses;
          const sorted = filteredExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setExpenses(sorted);
          try { localStorage.setItem(`kulfi_cache_expenses_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
          setExpensesLoading(false);
        } else if (supExpenses) {
          setExpenses([]);
          try { localStorage.setItem(`kulfi_cache_expenses_${cacheKeySuffix}`, JSON.stringify([])); } catch {}
          setExpensesLoading(false);
        } else {
          setExpensesLoading(false);
        }

        if (supProfits) {
          const filteredProfits = (activeFid && activeFid !== 'all') ? supProfits.filter(e => e.franchiseId === activeFid) : supProfits;
          const sorted = filteredProfits.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setProfitWithdrawals(sorted);
          try { localStorage.setItem(`kulfi_cache_profits_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
          setProfitWithdrawalsLoading(false);
        } else {
          setProfitWithdrawalsLoading(false);
        }

        if (supSpecials && supSpecials.length > 0) {
          const filteredSpecials = (activeFid && activeFid !== 'all') ? supSpecials.filter(e => e.franchiseId === activeFid) : supSpecials;
          const sorted = filteredSpecials.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setSpecialOrders(sorted);
          try { localStorage.setItem(`kulfi_cache_specials_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
          setSpecialOrdersLoading(false);
        } else if (supSpecials) {
          setSpecialOrders([]);
          try { localStorage.setItem(`kulfi_cache_specials_${cacheKeySuffix}`, JSON.stringify([])); } catch {}
          setSpecialOrdersLoading(false);
        } else {
          setSpecialOrdersLoading(false);
        }

        // POS Bills are always stored in Firestore, so fetch them seamlessly here as well
        try {
          const billsSnap = await withTimeout(getDocs(buildFranchiseQuery(db, 'bills', activeFid)), 3500);
          if (billsSnap) {
            const docs = billsSnap.docs.map(d => ({ ...d.data(), id: d.id } as QuickBill));
            const sorted = docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setBills(sorted);
            try { localStorage.setItem(`kulfi_cache_bills_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
          }
        } catch (bErr) {
          console.warn("Could not fetch bills in Supabase mode:", bErr);
        }
        setBillsLoading(false);

        setLastSynced(new Date());
        return;
      }

      // Firestore Fetching with cache-first and timeout guard
      const fetchCollection = async (collName: string) => {
        try {
          return await withTimeout(getDocs(buildFranchiseQuery(db, collName, activeFid)), 4000);
        } catch {
          return null;
        }
      };

      const fetchDocument = async (collName: string, docId: string) => {
        try {
          return await withTimeout(getDoc(doc(db, collName, docId)), 4000);
        } catch {
          return null;
        }
      };

      const [
        entriesSnap,
        settingsSnap,
        inventorySnap,
        expensesSnap,
        profitsSnap,
        specialsSnap,
        denomsSnap,
        billsSnap
      ] = await Promise.all([
        fetchCollection('entries'),
        fetchDocument('settings', (activeFid && activeFid !== 'all' && activeFid !== 'NONE') ? activeFid : 'global'),
        fetchDocument('inventory', (activeFid && activeFid !== 'all' && activeFid !== 'NONE') ? activeFid : 'global'),
        fetchCollection('expenses'),
        fetchCollection('profitWithdrawals'),
        fetchCollection('specialOrders'),
        fetchCollection('daily_denominations'),
        fetchCollection('bills')
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
        const sorted = docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setEntries(sorted);
        try { localStorage.setItem(`kulfi_cache_entries_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
        setEntriesLoading(false);
      } else {
        setEntriesLoading(false);
      }

      if (settingsSnap && settingsSnap.exists()) {
        const data = settingsSnap.data() as Settings;
        setSettings(data);
        try { localStorage.setItem(`kulfi_cache_settings_${cacheKeySuffix}`, JSON.stringify(data)); } catch {}
      } else {
        try {
          const cached = localStorage.getItem(`kulfi_cache_settings_${cacheKeySuffix}`) || localStorage.getItem('kulfi_cache_settings_global');
          if (cached) {
            setSettings(JSON.parse(cached));
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      }
      setSettingsLoading(false);

      let effectiveInvSnap = inventorySnap;
      if ((!effectiveInvSnap || !effectiveInvSnap.exists()) && activeFid && activeFid !== 'global') {
        try {
          effectiveInvSnap = await fetchDocument('inventory', 'global');
        } catch {}
      }

      if (effectiveInvSnap && effectiveInvSnap.exists()) {
        const rawData = effectiveInvSnap.data() as InventoryStock;
        const data: InventoryStock = {
          ...rawData,
          stickQuantity: (rawData.stickQuantity !== undefined && rawData.stickQuantity !== null) ? rawData.stickQuantity : 0,
          potQuantity: (rawData.potQuantity !== undefined && rawData.potQuantity !== null) ? rawData.potQuantity : 0,
          stickFlavours: arrangeFlavoursInSequence(rawData.stickFlavours, MASTER_STICK_FLAVOURS),
          potFlavours: arrangeFlavoursInSequence(rawData.potFlavours, MASTER_POT_FLAVOURS)
        };
        setInventory(data);
        try {
          localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(data));
          localStorage.setItem('kulfi_cache_inventory_global', JSON.stringify(data));
        } catch {}

        // If franchise document doesn't exist yet, seed it from global so it's persisted for the store
        if (activeFid && activeFid !== 'global' && (!inventorySnap || !inventorySnap.exists())) {
          safeSetDoc(doc(db, 'inventory', activeFid), {
            ...data,
            id: activeFid,
            franchiseId: activeFid,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      } else {
        try {
          const cached = localStorage.getItem(`kulfi_cache_inventory_${cacheKeySuffix}`) || localStorage.getItem('kulfi_cache_inventory_global');
          if (cached) {
            const parsed = JSON.parse(cached);
            setInventory({
              ...parsed,
              stickFlavours: arrangeFlavoursInSequence(parsed.stickFlavours, MASTER_STICK_FLAVOURS),
              potFlavours: arrangeFlavoursInSequence(parsed.potFlavours, MASTER_POT_FLAVOURS)
            });
          }
        } catch {}
      }
      setInventoryLoading(false);

      if (expensesSnap) {
        const docs = expensesSnap.docs.map(d => ({ ...d.data(), id: d.id } as ExpenseEntry));
        const sorted = docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setExpenses(sorted);
        try { localStorage.setItem(`kulfi_cache_expenses_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
        setExpensesLoading(false);
      } else {
        setExpensesLoading(false);
      }

      if (profitsSnap) {
        const docs = profitsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ProfitWithdrawal));
        const sorted = docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setProfitWithdrawals(sorted);
        try { localStorage.setItem(`kulfi_cache_profits_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
        setProfitWithdrawalsLoading(false);
      } else {
        setProfitWithdrawalsLoading(false);
      }

      if (specialsSnap) {
        const docs = specialsSnap.docs.map(d => ({ ...d.data(), id: d.id } as SpecialOrder));
        const sorted = docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setSpecialOrders(sorted);
        try { localStorage.setItem(`kulfi_cache_specials_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
        setSpecialOrdersLoading(false);
      } else {
        setSpecialOrdersLoading(false);
      }

      if (billsSnap) {
        const docs = billsSnap.docs.map(d => ({ ...d.data(), id: d.id } as QuickBill));
        const sorted = docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setBills(sorted);
        try { localStorage.setItem(`kulfi_cache_bills_${cacheKeySuffix}`, JSON.stringify(sorted)); } catch {}
        setBillsLoading(false);
      } else {
        setBillsLoading(false);
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
      setBillsLoading(false);
    } finally {
      setIsSyncing(false);
      isRefreshingRef.current = false;
    }
  }, [activeFid, cacheKeySuffix]);

  useEffect(() => {
    let unsubs: Array<() => void> = [];

    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastAutoRefreshRef.current > 30000) {
        lastAutoRefreshRef.current = now;
        refreshAllFromServer();
      }
    };

    // 1. Supabase Realtime Listener if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const channel = supabase
            .channel('nammaoorukulfi-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
              throttledRefresh();
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
        const targetInvDocId = (activeFid && activeFid !== 'all' && activeFid !== 'NONE') ? activeFid : 'global';

        // Eager fetch on listener attach to guarantee instant resolution without waiting for onSnapshot cycle
        getDoc(doc(db, 'inventory', targetInvDocId)).then(async (snap) => {
          let effectiveSnap = snap;
          if ((!effectiveSnap.exists() || !(effectiveSnap.data() as InventoryStock)?.stickQuantity) && targetInvDocId !== 'global') {
            effectiveSnap = await getDoc(doc(db, 'inventory', 'global'));
          }
          if (effectiveSnap.exists()) {
            const d = effectiveSnap.data() as InventoryStock;
            if (d.stickQuantity > 0 || (d.stickFlavours || []).some(f => (f.quantity || 0) > 0)) {
              const arr: InventoryStock = {
                ...d,
                stickQuantity: d.stickQuantity || 0,
                potQuantity: d.potQuantity || 0,
                stickFlavours: arrangeFlavoursInSequence(d.stickFlavours, MASTER_STICK_FLAVOURS),
                potFlavours: arrangeFlavoursInSequence(d.potFlavours, MASTER_POT_FLAVOURS)
              };
              setInventory(arr);
              try {
                localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(arr));
                localStorage.setItem('kulfi_cache_inventory_global', JSON.stringify(arr));
              } catch {}
              if (targetInvDocId !== 'global') {
                safeSetDoc(doc(db, 'inventory', targetInvDocId), {
                  ...arr,
                  id: targetInvDocId,
                  franchiseId: targetInvDocId,
                  updatedAt: new Date().toISOString()
                }, { merge: true }).catch(() => {});
              }
            }
          }
        }).catch(() => {});

        const unsubInventory = onSnapshot(
          doc(db, 'inventory', targetInvDocId),
          async (docSnap) => {
            if (docSnap.exists() && ((docSnap.data() as InventoryStock).stickQuantity > 0 || ((docSnap.data() as InventoryStock).stickFlavours || []).some(f => (f.quantity || 0) > 0))) {
              const data = docSnap.data() as InventoryStock;
              const arranged: InventoryStock = {
                ...data,
                stickQuantity: (data.stickQuantity !== undefined && data.stickQuantity !== null) ? data.stickQuantity : 0,
                potQuantity: (data.potQuantity !== undefined && data.potQuantity !== null) ? data.potQuantity : 0,
                stickFlavours: arrangeFlavoursInSequence(data.stickFlavours, MASTER_STICK_FLAVOURS),
                potFlavours: arrangeFlavoursInSequence(data.potFlavours, MASTER_POT_FLAVOURS)
              };
              setInventory(arranged);
              try {
                localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(arranged));
                localStorage.setItem('kulfi_cache_inventory_global', JSON.stringify(arranged));
              } catch {}
            } else if (targetInvDocId !== 'global') {
              try {
                const globalSnap = await getDoc(doc(db, 'inventory', 'global'));
                if (globalSnap.exists()) {
                  const data = globalSnap.data() as InventoryStock;
                  const arranged: InventoryStock = {
                    ...data,
                    stickQuantity: (data.stickQuantity !== undefined && data.stickQuantity !== null) ? data.stickQuantity : 0,
                    potQuantity: (data.potQuantity !== undefined && data.potQuantity !== null) ? data.potQuantity : 0,
                    stickFlavours: arrangeFlavoursInSequence(data.stickFlavours, MASTER_STICK_FLAVOURS),
                    potFlavours: arrangeFlavoursInSequence(data.potFlavours, MASTER_POT_FLAVOURS)
                  };
                  setInventory(arranged);
                  try {
                    localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(arranged));
                    localStorage.setItem('kulfi_cache_inventory_global', JSON.stringify(arranged));
                  } catch {}
                  safeSetDoc(doc(db, 'inventory', targetInvDocId), {
                    ...arranged,
                    id: targetInvDocId,
                    franchiseId: targetInvDocId,
                    updatedAt: new Date().toISOString()
                  }, { merge: true }).catch(() => {});
                }
              } catch {}
            }
            setInventoryLoading(false);
          },
          (err) => console.error("Realtime inventory listener error:", err)
        );
        unsubs.push(unsubInventory);

        if (targetInvDocId !== 'global') {
          const unsubGlobal = onSnapshot(
            doc(db, 'inventory', 'global'),
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as InventoryStock;
                setInventory(prev => {
                  const hasCurrentStock = (prev?.stickQuantity || 0) > 0 || (prev?.stickFlavours || []).some(f => (f.quantity || 0) > 0);
                  if (!hasCurrentStock || (data.lastUpdatedDate || '') >= (prev?.lastUpdatedDate || '')) {
                    const arranged: InventoryStock = {
                      ...data,
                      stickQuantity: (data.stickQuantity !== undefined && data.stickQuantity !== null) ? data.stickQuantity : 0,
                      potQuantity: (data.potQuantity !== undefined && data.potQuantity !== null) ? data.potQuantity : 0,
                      stickFlavours: arrangeFlavoursInSequence(data.stickFlavours, MASTER_STICK_FLAVOURS),
                      potFlavours: arrangeFlavoursInSequence(data.potFlavours, MASTER_POT_FLAVOURS)
                    };
                    try {
                      localStorage.setItem(`kulfi_cache_inventory_${cacheKeySuffix}`, JSON.stringify(arranged));
                      localStorage.setItem('kulfi_cache_inventory_global', JSON.stringify(arranged));
                    } catch {}
                    safeSetDoc(doc(db, 'inventory', targetInvDocId), {
                      ...arranged,
                      id: targetInvDocId,
                      franchiseId: targetInvDocId,
                      updatedAt: new Date().toISOString()
                    }, { merge: true }).catch(() => {});
                    return arranged;
                  }
                  return prev;
                });
              }
            },
            () => {}
          );
          unsubs.push(unsubGlobal);
        }
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

    // 2. UNIVERSAL LISTENERS: Bills, Settings & Daily Denominations
    // These must ALWAYS be listened to via Firestore in both Supabase & Firestore modes
    try {
      const unsubBills = onSnapshot(
        buildFranchiseQuery(db, 'bills', activeFid, limit(100)),
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QuickBill));
          setBills(docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
          setBillsLoading(false);
        },
        (err) => {
          console.warn("Realtime bills listener warning:", err);
          setBillsLoading(false);
        }
      );
      unsubs.push(unsubBills);
    } catch (e) {
      console.warn("Could not bind bills snapshot:", e);
    }

    const targetSettingsDocId = (activeFid && activeFid !== 'all' && activeFid !== 'NONE') ? activeFid : 'global';
    try {
      const unsubSettings = onSnapshot(
        doc(db, 'settings', targetSettingsDocId),
        (docSnap) => {
          if (docSnap.exists()) {
            const fsData = docSnap.data() as Settings;
            setSettings(prev => ({
              ...prev,
              ...fsData
            }));
            try { localStorage.setItem(`kulfi_cache_settings_${cacheKeySuffix}`, JSON.stringify(fsData)); } catch {}
          }
          setSettingsLoading(false);
        },
        (err) => console.error("Realtime settings listener error:", err)
      );
      unsubs.push(unsubSettings);
    } catch (e) {
      console.warn("Could not bind settings snapshot:", e);
    }

    // Always attach the daily_denominations listener regardless of Supabase config
    // This allows real-time keystroke draft syncing across all clients via Firebase.
    try {
      const unsubDenoms = onSnapshot(
        buildFranchiseQuery(db, 'daily_denominations', activeFid, limit(60)),
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

    // Only run manual REST refresh if Supabase is enabled.
    // In pure Firestore mode, onSnapshot listeners above stream all real-time updates directly,
    // avoiding duplicate reads that burn the free daily quota.
    if (isSupabaseConfigured()) {
      refreshAllFromServer();
    }

    let debounceTimer: any = null;
    const handleDataUpdated = (e: any) => {
      // In Firestore mode, onSnapshot listeners already update documents in real time.
      if (!isSupabaseConfigured()) return;
      const type = e?.detail?.type;
      if (type === 'logs' || type === 'settings' || type === 'bills') return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshAllFromServer();
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isSupabaseConfigured()) throttledRefresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('app-data-updated', handleDataUpdated);
    window.addEventListener('franchiseChanged', handleDataUpdated);

    if (syncChannel) {
      syncChannel.onmessage = () => throttledRefresh();
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubs.forEach(u => {
        try { u(); } catch {}
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('app-data-updated', handleDataUpdated);
      window.removeEventListener('franchiseChanged', handleDataUpdated);
    };
  }, [activeFid, currentUser, entriesLimit, expensesLimit]);

  const loadMoreEntries = () => setEntriesLimit(prev => prev + 100);
  const loadMoreExpenses = () => setExpensesLimit(prev => prev + 100);

  const contextValue = useMemo(() => ({
    entries, entriesLoading, loadMoreEntries, hasMoreEntries,
    settings, settingsLoading,
    inventory, inventoryLoading,
    expenses, expensesLoading, loadMoreExpenses, hasMoreExpenses,
    profitWithdrawals, profitWithdrawalsLoading,
    specialOrders, specialOrdersLoading,
    bills, billsLoading,
    dailyDenominationsMap,
    refreshAllFromServer,
    isSyncing,
    lastSynced,
    databaseType
  }), [
    entries, entriesLoading, hasMoreEntries,
    settings, settingsLoading,
    inventory, inventoryLoading,
    expenses, expensesLoading, hasMoreExpenses,
    profitWithdrawals, profitWithdrawalsLoading,
    specialOrders, specialOrdersLoading,
    bills, billsLoading,
    dailyDenominationsMap,
    refreshAllFromServer,
    isSyncing,
    lastSynced,
    databaseType
  ]);

  return (
    <StoreContext.Provider value={contextValue}>
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

export function useQuickBills() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useQuickBills must be used within StoreProvider");
  return { 
    bills: ctx.bills, 
    loading: ctx.billsLoading,
    saveBill: saveQuickBill,
    deleteBill: deleteQuickBill,
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
        const fallbackUnsub = onSnapshot(query(logsColl, limit(limitCount)), (snapshot) => {
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
      await safeSetDoc(doc(db, 'logs', log.id), log);
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
      await safeSetDoc(doc(db, 'logs', log.id), updatedLog);
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
