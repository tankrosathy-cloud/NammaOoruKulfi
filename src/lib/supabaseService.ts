import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { DailyEntry, Settings, InventoryStock, ExpenseEntry, AppLog, ProfitWithdrawal, SpecialOrder } from '../types';
import { INITIAL_AUGUST_ENTRIES, INITIAL_AUGUST_EXPENSES, INITIAL_AUGUST_SPECIAL_ORDERS } from './augustDataset';

// -------------------------------------------------------------
// Data Converters
// -------------------------------------------------------------

function entryToRow(e: DailyEntry, userId: string = '') {
  return {
    id: e.id,
    date: e.date,
    stick_loaded: Number(e.stickLoaded) || 0,
    stick_balance: e.stickBalance !== undefined ? Number(e.stickBalance) : null,
    stick_sold: Number(e.stickSold) || 0,
    pot_loaded: Number(e.potLoaded) || 0,
    pot_balance: e.potBalance !== undefined ? Number(e.potBalance) : null,
    pot_sold: Number(e.potSold) || 0,
    cash_bag_loaded: Number(e.cashBagLoaded) || 0,
    cash_bag_total: Number(e.cashBagTotal) || 0,
    phone_pe: Number(e.phonePe) || 0,
    discount: Number(e.discount) || 0,
    bonus: Number(e.bonus) || 0,
    required_amount: Number(e.requiredAmount) || 0,
    actual_amount: Number(e.actualAmount) || 0,
    shortage: Number(e.shortage) || 0,
    final_amount: Number(e.finalAmount) || 0,
    expenses: Number(e.expenses) || 0,
    additional_expenses: Number(e.additionalExpenses) || 0,
    expense_details: e.expenseDetails || '',
    notes: e.notes || '',
    denominations: e.denominations || null,
    user_id: userId || e.userId || '',
    updated_at: new Date().toISOString()
  };
}

function rowToEntry(r: any): DailyEntry {
  let parsedDenominations = undefined;
  if (r.denominations) {
    if (typeof r.denominations === 'string') {
      try {
        parsedDenominations = JSON.parse(r.denominations);
      } catch {}
    } else if (typeof r.denominations === 'object') {
      parsedDenominations = r.denominations;
    }
  }

  return {
    id: r.id,
    date: r.date,
    stickLoaded: Number(r.stick_loaded) || 0,
    stickBalance: r.stick_balance !== null && r.stick_balance !== undefined ? Number(r.stick_balance) : undefined,
    stickSold: Number(r.stick_sold) || 0,
    potLoaded: Number(r.pot_loaded) || 0,
    potBalance: r.pot_balance !== null && r.pot_balance !== undefined ? Number(r.pot_balance) : undefined,
    potSold: Number(r.pot_sold) || 0,
    cashBagLoaded: Number(r.cash_bag_loaded) || 0,
    cashBagTotal: Number(r.cash_bag_total) || 0,
    phonePe: Number(r.phone_pe) || 0,
    discount: Number(r.discount) || 0,
    bonus: Number(r.bonus) || 0,
    requiredAmount: Number(r.required_amount) || 0,
    actualAmount: Number(r.actual_amount) || 0,
    shortage: Number(r.shortage) || 0,
    finalAmount: Number(r.final_amount) || 0,
    expenses: Number(r.expenses) || 0,
    additionalExpenses: Number(r.additional_expenses) || 0,
    expenseDetails: r.expense_details || '',
    notes: r.notes || '',
    denominations: parsedDenominations,
    userId: r.user_id || '',
    updatedAt: r.updated_at
  };
}

function expenseToRow(e: ExpenseEntry, userId: string = '') {
  return {
    id: e.id,
    date: e.date,
    category: e.category,
    amount: Number(e.amount) || 0,
    paid_by: e.paidBy || '',
    notes: e.notes || '',
    title: e.title || '',
    user_id: userId || e.userId || '',
    updated_at: new Date().toISOString()
  };
}

function rowToExpense(r: any): ExpenseEntry {
  return {
    id: r.id,
    date: r.date,
    category: r.category,
    amount: Number(r.amount) || 0,
    paidBy: r.paid_by || '',
    notes: r.notes || '',
    title: r.title || '',
    userId: r.user_id || '',
    updatedAt: r.updated_at
  };
}

function specialOrderToRow(s: SpecialOrder, userId: string = '') {
  return {
    id: s.id,
    date: s.date,
    event_type: s.eventType,
    stick_quantity: Number(s.stickQuantity) || 0,
    pot_quantity: Number(s.potQuantity) || 0,
    amount_received: Number(s.amountReceived) || 0,
    notes: s.notes || '',
    user_id: userId || s.userId || '',
    updated_at: new Date().toISOString()
  };
}

function rowToSpecialOrder(r: any): SpecialOrder {
  return {
    id: r.id,
    date: r.date,
    eventType: r.event_type,
    stickQuantity: Number(r.stick_quantity) || 0,
    potQuantity: Number(r.pot_quantity) || 0,
    amountReceived: Number(r.amount_received) || 0,
    notes: r.notes || '',
    userId: r.user_id || '',
    updatedAt: r.updated_at
  };
}

function inventoryToRow(inv: InventoryStock, userId: string = '') {
  return {
    id: 'global',
    stick_quantity: Number(inv.stickQuantity) || 0,
    pot_quantity: Number(inv.potQuantity) || 0,
    stick_flavours: inv.stickFlavours || [],
    pot_flavours: inv.potFlavours || [],
    last_updated_date: inv.lastUpdatedDate || new Date().toISOString().split('T')[0],
    user_id: userId || inv.userId || '',
    updated_at: new Date().toISOString()
  };
}

function rowToInventory(r: any): InventoryStock {
  return {
    id: 'global',
    stickQuantity: Number(r.stick_quantity) || 0,
    potQuantity: Number(r.pot_quantity) || 0,
    stickFlavours: Array.isArray(r.stick_flavours) ? r.stick_flavours : [],
    potFlavours: Array.isArray(r.pot_flavours) ? r.pot_flavours : [],
    lastUpdatedDate: r.last_updated_date || new Date().toISOString().split('T')[0],
    userId: r.user_id || ''
  };
}

function settingsToRow(s: Settings) {
  return {
    id: 'global',
    stick_price: Number(s.stickPrice) || 40,
    pot_price: Number(s.potPrice) || 50,
    plate_price: Number(s.platePrice) || 75,
    monthly_goal: Number(s.monthlyGoal) || 150000,
    updated_at: new Date().toISOString()
  };
}

function rowToSettings(r: any): Settings {
  return {
    stickPrice: Number(r.stick_price) || 40,
    potPrice: Number(r.pot_price) || 50,
    platePrice: Number(r.plate_price) || 75,
    monthlyGoal: Number(r.monthly_goal) || 150000
  };
}

function withdrawalToRow(w: ProfitWithdrawal, userId: string = '') {
  return {
    id: w.id,
    date: w.date,
    amount: Number(w.amount) || 0,
    withdrawn_by: w.withdrawnBy || '',
    notes: w.notes || '',
    month: w.month || '',
    user_id: userId || w.userId || ''
  };
}

function rowToWithdrawal(r: any): ProfitWithdrawal {
  return {
    id: r.id,
    date: r.date,
    amount: Number(r.amount) || 0,
    withdrawnBy: r.withdrawn_by || '',
    notes: r.notes || '',
    month: r.month || '',
    userId: r.user_id || ''
  };
}

function logToRow(l: AppLog) {
  return {
    id: l.id,
    timestamp: l.timestamp || new Date().toISOString(),
    user_email: l.userEmail || '',
    action: l.action,
    details: l.details || '',
    deleted_payload: l.deletedPayload || ''
  };
}

function rowToLog(r: any): AppLog {
  return {
    id: r.id,
    timestamp: r.timestamp,
    userEmail: r.user_email,
    action: r.action,
    details: r.details,
    deletedPayload: r.deleted_payload
  };
}

// -------------------------------------------------------------
// CRUD Operations
// -------------------------------------------------------------

export async function fetchEntriesFromSupabase(): Promise<DailyEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase fetch entries error:', error);
    return null;
  }

  return (data || []).map(rowToEntry);
}

export async function upsertEntryToSupabase(entry: DailyEntry, userId: string = ''): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = entryToRow(entry, userId);
  const { error } = await client.from('entries').upsert(row, { onConflict: 'id' });
  if (error) {
    // If Postgres table doesn't have denominations column yet, fallback without it
    if (error.message && error.message.includes('denominations')) {
      const { denominations, ...fallbackRow } = row;
      const { error: retryError } = await client.from('entries').upsert(fallbackRow, { onConflict: 'id' });
      if (retryError) {
        console.error('Supabase upsert entry retry error:', retryError);
        throw retryError;
      }
      return true;
    }
    console.error('Supabase upsert entry error:', error);
    throw error;
  }
  return true;
}

export async function deleteEntryFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('entries').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete entry error:', error);
    throw error;
  }
  return true;
}

export async function fetchExpensesFromSupabase(): Promise<ExpenseEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase fetch expenses error:', error);
    return null;
  }

  return (data || []).map(rowToExpense);
}

export async function upsertExpenseToSupabase(expense: ExpenseEntry, userId: string = ''): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = expenseToRow(expense, userId);
  const { error } = await client.from('expenses').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert expense error:', error);
    throw error;
  }
  return true;
}

export async function deleteExpenseFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('expenses').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete expense error:', error);
    throw error;
  }
  return true;
}

export async function fetchSpecialOrdersFromSupabase(): Promise<SpecialOrder[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('special_orders')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase fetch special orders error:', error);
    return null;
  }

  return (data || []).map(rowToSpecialOrder);
}

export async function upsertSpecialOrderToSupabase(order: SpecialOrder, userId: string = ''): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = specialOrderToRow(order, userId);
  const { error } = await client.from('special_orders').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert special order error:', error);
    throw error;
  }
  return true;
}

export async function deleteSpecialOrderFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('special_orders').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete special order error:', error);
    throw error;
  }
  return true;
}

export async function fetchInventoryFromSupabase(): Promise<InventoryStock | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('inventory')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error || !data) {
    return null;
  }

  return rowToInventory(data);
}

export async function upsertInventoryToSupabase(inv: InventoryStock, userId: string = ''): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = inventoryToRow(inv, userId);
  const { error } = await client.from('inventory').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert inventory error:', error);
    throw error;
  }
  return true;
}

export async function fetchSettingsFromSupabase(): Promise<Settings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error || !data) {
    return null;
  }

  return rowToSettings(data);
}

export async function upsertSettingsToSupabase(s: Settings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = settingsToRow(s);
  const { error } = await client.from('settings').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert settings error:', error);
    throw error;
  }
  return true;
}

export async function fetchProfitWithdrawalsFromSupabase(): Promise<ProfitWithdrawal[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('profit_withdrawals')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return null;
  }

  return (data || []).map(rowToWithdrawal);
}

export async function upsertProfitWithdrawalToSupabase(w: ProfitWithdrawal, userId: string = ''): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = withdrawalToRow(w, userId);
  const { error } = await client.from('profit_withdrawals').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert profit withdrawal error:', error);
    throw error;
  }
  return true;
}

export async function deleteProfitWithdrawalFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('profit_withdrawals').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete profit withdrawal error:', error);
    throw error;
  }
  return true;
}

export async function fetchLogsFromSupabase(limitCount: number = 100): Promise<AppLog[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('app_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limitCount);

  if (error) {
    return null;
  }

  return (data || []).map(rowToLog);
}

export async function insertLogToSupabase(log: AppLog): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const row = logToRow(log);
  const { error } = await client.from('app_logs').insert(row);
  if (error) {
    console.warn('Supabase insert log warning:', error);
    return false;
  }
  return true;
}

export async function clearLogsFromSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('app_logs').delete().neq('id', 'placeholder');
  if (error) {
    console.error('Supabase clear logs error:', error);
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// 1-Click Migration from Local / Dataset / Firestore to Supabase
// -------------------------------------------------------------

export async function migrateAllDataToSupabase(
  sourceData: {
    entries: DailyEntry[];
    expenses: ExpenseEntry[];
    specialOrders: SpecialOrder[];
    inventory: InventoryStock;
    settings: Settings;
  }
): Promise<{
  success: boolean;
  entriesCount: number;
  expensesCount: number;
  specialOrdersCount: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please supply Supabase URL and Anon Key.');
  }

  // 1. Settings & Inventory
  await upsertSettingsToSupabase(sourceData.settings);
  await upsertInventoryToSupabase(sourceData.inventory);

  // 2. Entries
  const entryRows = sourceData.entries.map(e => entryToRow(e));
  const { error: entriesErr } = await client.from('entries').upsert(entryRows, { onConflict: 'id' });
  if (entriesErr) {
    throw new Error(`Failed to upload entries: ${entriesErr.message}`);
  }

  // 3. Expenses
  const expRows = sourceData.expenses.map(e => expenseToRow(e));
  const { error: expErr } = await client.from('expenses').upsert(expRows, { onConflict: 'id' });
  if (expErr) {
    throw new Error(`Failed to upload expenses: ${expErr.message}`);
  }

  // 4. Special Orders
  const specialRows = sourceData.specialOrders.map(s => specialOrderToRow(s));
  const { error: specialErr } = await client.from('special_orders').upsert(specialRows, { onConflict: 'id' });
  if (specialErr) {
    throw new Error(`Failed to upload special orders: ${specialErr.message}`);
  }

  return {
    success: true,
    entriesCount: entryRows.length,
    expensesCount: expRows.length,
    specialOrdersCount: specialRows.length,
    message: `Successfully migrated all ${entryRows.length} daily entries, ${expRows.length} expenses, and special orders to Supabase PostgreSQL!`
  };
}
