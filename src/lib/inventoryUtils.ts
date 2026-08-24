import { DailyEntry, InventoryStock, SpecialOrder } from '../types';
import { format, subDays, parseISO, isToday as isTodayFn, startOfMonth, endOfMonth } from 'date-fns';

export interface DayStockLedgerRow {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Sat, 22 Aug"
  fullDisplayDate: string; // e.g. "Saturday, 22 August 2026"
  dayName: string; // "Saturday"
  isToday: boolean;
  isBaseline: boolean;

  // Stick Metrics
  openingStick: number;
  loadedStick: number;
  soldStick: number;
  specialOrderStick: number;
  totalStickDeducted: number;
  cartBalanceStick: number;
  closingStick: number; // Available inventory at 11:59 PM

  // Pot Metrics
  openingPot: number;
  loadedPot: number;
  soldPot: number;
  specialOrderPot: number;
  totalPotDeducted: number;
  cartBalancePot: number;
  closingPot: number; // Available inventory at 11:59 PM

  hasEntry: boolean;
  hasSpecialOrder: boolean;
  stockStatusStick: 'healthy' | 'low' | 'out_of_stock';
  stockStatusPot: 'healthy' | 'low' | 'out_of_stock';
}

export interface AvailableStockStats {
  baseStockDate: string;
  baseStickQty: number;
  basePotQty: number;

  // Real-time Available Stock Today
  availableStick: number;
  availablePot: number;

  // Total Deductions since base date
  totalStickSoldSinceBase: number;
  totalPotSoldSinceBase: number;
  totalSpecialStickSinceBase: number;
  totalSpecialPotSinceBase: number;
  totalStickDeductedSinceBase: number;
  totalPotDeductedSinceBase: number;

  // Month-to-date stats
  totalStickSoldThisMonth: number;
  totalPotSoldThisMonth: number;
  avgStickSoldThisMonth: number;
  avgPotSoldThisMonth: number;
}

/**
 * Calculates current real-time available stock and monthly summary stats
 */
export function calculateAvailableStock(
  inventory: InventoryStock | null | undefined,
  entries: DailyEntry[] = [],
  specialOrders: SpecialOrder[] = []
): AvailableStockStats {
  const baseStockDate = (inventory?.lastUpdatedDate || '2026-08-01').split('T')[0];
  const baseStickQty = Math.max(0, Number(inventory?.stickQuantity) || 0);
  const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);

  // Filter entries & special orders on or after the baseline date
  const relevantEntries = entries.filter(e => e.date >= baseStockDate);
  const relevantSpecialOrders = specialOrders.filter(s => s.date >= baseStockDate);

  const totalStickSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);

  const totalSpecialStickSinceBase = relevantSpecialOrders.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
  const totalSpecialPotSinceBase = relevantSpecialOrders.reduce((sum, s) => sum + (s.potQuantity || 0), 0);

  const totalStickDeductedSinceBase = totalStickSoldSinceBase + totalSpecialStickSinceBase;
  const totalPotDeductedSinceBase = totalPotSoldSinceBase + totalSpecialPotSinceBase;

  const availableStick = Math.max(0, baseStickQty - totalStickDeductedSinceBase);
  const availablePot = Math.max(0, basePotQty - totalPotDeductedSinceBase);

  // Month-to-date performance
  const now = new Date();
  const currentMonthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');

  const thisMonthEntries = entries.filter(e => e.date >= currentMonthStartStr && e.date <= currentMonthEndStr);
  const thisMonthSpecials = specialOrders.filter(s => s.date >= currentMonthStartStr && s.date <= currentMonthEndStr);

  const totalStickSoldThisMonth =
    thisMonthEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0) +
    thisMonthSpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);

  const totalPotSoldThisMonth =
    thisMonthEntries.reduce((sum, e) => sum + (e.potSold || 0), 0) +
    thisMonthSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);

  const daysWithActivity = new Set([
    ...thisMonthEntries.map(e => e.date),
    ...thisMonthSpecials.map(s => s.date)
  ]).size;

  const avgStickSoldThisMonth = daysWithActivity > 0 ? Math.round(totalStickSoldThisMonth / daysWithActivity) : 0;
  const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;

  return {
    baseStockDate,
    baseStickQty,
    basePotQty,
    availableStick,
    availablePot,
    totalStickSoldSinceBase,
    totalPotSoldSinceBase,
    totalSpecialStickSinceBase,
    totalSpecialPotSinceBase,
    totalStickDeductedSinceBase,
    totalPotDeductedSinceBase,
    totalStickSoldThisMonth,
    totalPotSoldThisMonth,
    avgStickSoldThisMonth,
    avgPotSoldThisMonth
  };
}

/**
 * Calculates continuous, mathematically balanced daily stock ledger
 * for every day including Morning Open (00:00 AM) and End-of-Day (11:59 PM) closing stock.
 */
export function calculateDailyStockLedger(
  inventory: InventoryStock | null | undefined,
  entries: DailyEntry[] = [],
  specialOrders: SpecialOrder[] = [],
  daysCount: number = 10
): {
  ledgerRows: DayStockLedgerRow[];
  last10DaysRows: DayStockLedgerRow[];
  selectedDateRow: (dateStr: string) => DayStockLedgerRow | undefined;
} {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const baseStockDate = (inventory?.lastUpdatedDate || '2026-08-01').split('T')[0];
  const baseStickQty = Math.max(0, Number(inventory?.stickQuantity) || 0);
  const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);

  // Determine last N days list
  const requestedDays: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    try {
      const d = format(subDays(parseISO(todayStr), i), 'yyyy-MM-dd');
      requestedDays.push(d);
    } catch {
      // ignore
    }
  }

  // Gather all relevant dates
  const allDatesSet = new Set<string>();
  entries.forEach(e => allDatesSet.add(e.date));
  specialOrders.forEach(s => allDatesSet.add(s.date));
  requestedDays.forEach(d => allDatesSet.add(d));
  allDatesSet.add(baseStockDate);
  allDatesSet.add(todayStr);

  const sortedDates = Array.from(allDatesSet).filter(Boolean).sort();

  const ledgerMap = new Map<string, DayStockLedgerRow>();

  // 1. Forward calculation from baseStockDate onwards
  let runningStick = baseStickQty;
  let runningPot = basePotQty;

  for (const d of sortedDates) {
    if (d >= baseStockDate) {
      const entry = entries.find(e => e.date === d);
      const daySpecials = specialOrders.filter(s => s.date === d);

      const soldStick = entry ? (entry.stickSold || 0) : 0;
      const soldPot = entry ? (entry.potSold || 0) : 0;
      const loadedStick = entry ? (entry.stickLoaded || 0) : 0;
      const loadedPot = entry ? (entry.potLoaded || 0) : 0;

      const specialOrderStick = daySpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
      const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);

      const totalStickDeducted = soldStick + specialOrderStick;
      const totalPotDeducted = soldPot + specialOrderPot;

      const cartBalanceStick = entry
        ? (entry.stickBalance !== undefined ? entry.stickBalance : Math.max(0, loadedStick - soldStick))
        : 0;
      const cartBalancePot = entry
        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))
        : 0;

      const openingStick = runningStick;
      const openingPot = runningPot;

      const closingStick = Math.max(0, openingStick - totalStickDeducted);
      const closingPot = Math.max(0, openingPot - totalPotDeducted);

      let displayDate = d;
      let fullDisplayDate = d;
      let dayName = '';
      try {
        const parsed = parseISO(d);
        displayDate = format(parsed, 'EEE, d MMM');
        fullDisplayDate = format(parsed, 'EEEE, d MMMM yyyy');
        dayName = format(parsed, 'EEEE');
      } catch {
        // ignore
      }

      const isToday = d === todayStr;
      const isBaseline = d === baseStockDate;

      const stockStatusStick: 'healthy' | 'low' | 'out_of_stock' =
        closingStick === 0 ? 'out_of_stock' : closingStick < 150 ? 'low' : 'healthy';
      const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =
        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';

      ledgerMap.set(d, {
        date: d,
        displayDate,
        fullDisplayDate,
        dayName,
        isToday,
        isBaseline,
        openingStick,
        loadedStick,
        soldStick,
        specialOrderStick,
        totalStickDeducted,
        cartBalanceStick,
        closingStick,
        openingPot,
        loadedPot,
        soldPot,
        specialOrderPot,
        totalPotDeducted,
        cartBalancePot,
        closingPot,
        hasEntry: Boolean(entry),
        hasSpecialOrder: daySpecials.length > 0,
        stockStatusStick,
        stockStatusPot
      });

      runningStick = closingStick;
      runningPot = closingPot;
    }
  }

  // 2. Backward calculation for historical dates before baseStockDate (if any exist)
  const datesBeforeBase = sortedDates.filter(d => d < baseStockDate).reverse();
  let backStick = baseStickQty;
  let backPot = basePotQty;

  for (const d of datesBeforeBase) {
    const entry = entries.find(e => e.date === d);
    const daySpecials = specialOrders.filter(s => s.date === d);

    const soldStick = entry ? (entry.stickSold || 0) : 0;
    const soldPot = entry ? (entry.potSold || 0) : 0;
    const loadedStick = entry ? (entry.stickLoaded || 0) : 0;
    const loadedPot = entry ? (entry.potLoaded || 0) : 0;

    const specialOrderStick = daySpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
    const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);

    const totalStickDeducted = soldStick + specialOrderStick;
    const totalPotDeducted = soldPot + specialOrderPot;

    const cartBalanceStick = entry
      ? (entry.stickBalance !== undefined ? entry.stickBalance : Math.max(0, loadedStick - soldStick))
      : 0;
    const cartBalancePot = entry
      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))
      : 0;

    const closingStick = backStick;
    const closingPot = backPot;

    const openingStick = closingStick + totalStickDeducted;
    const openingPot = closingPot + totalPotDeducted;

    let displayDate = d;
    let fullDisplayDate = d;
    let dayName = '';
    try {
      const parsed = parseISO(d);
      displayDate = format(parsed, 'EEE, d MMM');
      fullDisplayDate = format(parsed, 'EEEE, d MMMM yyyy');
      dayName = format(parsed, 'EEEE');
    } catch {
      // ignore
    }

    const isToday = d === todayStr;
    const isBaseline = d === baseStockDate;

    const stockStatusStick: 'healthy' | 'low' | 'out_of_stock' =
      closingStick === 0 ? 'out_of_stock' : closingStick < 150 ? 'low' : 'healthy';
    const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =
      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';

    ledgerMap.set(d, {
      date: d,
      displayDate,
      fullDisplayDate,
      dayName,
      isToday,
      isBaseline,
      openingStick,
      loadedStick,
      soldStick,
      specialOrderStick,
      totalStickDeducted,
      cartBalanceStick,
      closingStick,
      openingPot,
      loadedPot,
      soldPot,
      specialOrderPot,
      totalPotDeducted,
      cartBalancePot,
      closingPot,
      hasEntry: Boolean(entry),
      hasSpecialOrder: daySpecials.length > 0,
      stockStatusStick,
      stockStatusPot
    });

    backStick = openingStick;
    backPot = openingPot;
  }

  // Build sorted results
  const allRows = Array.from(ledgerMap.values()).sort((a, b) => b.date.localeCompare(a.date)); // newest first

  // Specifically extract last 10 days
  const last10DaysRows = requestedDays
    .map(d => ledgerMap.get(d))
    .filter((row): row is DayStockLedgerRow => Boolean(row))
    .reverse(); // newest first

  const selectedDateRow = (dateStr: string) => ledgerMap.get(dateStr);

  return {
    ledgerRows: allRows,
    last10DaysRows,
    selectedDateRow
  };
}
