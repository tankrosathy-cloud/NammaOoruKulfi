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
  closingStick: number;

  // Pot Metrics
  openingPot: number;
  loadedPot: number;
  soldPot: number;
  specialOrderPot: number;
  totalPotDeducted: number;
  cartBalancePot: number;
  closingPot: number;

  // Plate Metrics
  openingPlate: number;
  loadedPlate: number;
  soldPlate: number;
  specialOrderPlate: number;
  totalPlateDeducted: number;
  cartBalancePlate: number;
  closingPlate: number;

  hasEntry: boolean;
  hasSpecialOrder: boolean;
  stockStatusStick: 'healthy' | 'low' | 'out_of_stock';
  stockStatusPot: 'healthy' | 'low' | 'out_of_stock';
  stockStatusPlate: 'healthy' | 'low' | 'out_of_stock';
}

export interface AvailableStockStats {
  baseStockDate: string;
  baseStickQty: number;
  basePotQty: number;
  basePlateQty: number;
  availableStick: number;
  availablePot: number;
  availablePlate: number;
  totalStickSoldSinceBase: number;
  totalPotSoldSinceBase: number;
  totalPlateSoldSinceBase: number;
  totalSpecialStickSinceBase: number;
  totalSpecialPotSinceBase: number;
  totalSpecialPlateSinceBase: number;
  totalStickDeductedSinceBase: number;
  totalPotDeductedSinceBase: number;
  totalPlateDeductedSinceBase: number;
  totalStickSoldThisMonth: number;
  totalPotSoldThisMonth: number;
  totalPlateSoldThisMonth: number;
  avgStickSoldThisMonth: number;
  avgPotSoldThisMonth: number;
  avgPlateSoldThisMonth: number;
}

export function calculateAvailableStock(
  inventory: InventoryStock | null | undefined,
  entries: DailyEntry[] = [],
  specialOrders: SpecialOrder[] = []
): AvailableStockStats {
  const baseStockDate = inventory?.lastUpdatedDate ? inventory.lastUpdatedDate.split('T')[0] : '2026-08-01';
  
  const baseStickQty = Math.max(0, Number(inventory?.stickQuantity) || 0);
  const basePotQty = Math.max(0, Number(inventory?.potQuantity) || 0);
  const basePlateQty = Math.max(0, Number(inventory?.plateQuantity) || 0);

  const relevantEntries = entries.filter(e => e.date >= baseStockDate);
  const relevantSpecials = specialOrders.filter(s => s.date >= baseStockDate);

  const totalStickSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const totalPlateSoldSinceBase = relevantEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0);

  const totalSpecialStickSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
  const totalSpecialPotSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);
  const totalSpecialPlateSinceBase = relevantSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);

  const totalStickDeductedSinceBase = totalStickSoldSinceBase + totalSpecialStickSinceBase;
  const totalPotDeductedSinceBase = totalPotSoldSinceBase + totalSpecialPotSinceBase;
  const totalPlateDeductedSinceBase = totalPlateSoldSinceBase + totalSpecialPlateSinceBase;

  const availableStick = Math.max(0, baseStickQty - totalStickDeductedSinceBase);
  const availablePot = Math.max(0, basePotQty - totalPotDeductedSinceBase);
  const availablePlate = Math.max(0, basePlateQty - totalPlateDeductedSinceBase);

  const now = new Date();
  const startOfCurMonth = format(startOfMonth(now), 'yyyy-MM-dd');
  const endOfCurMonth = format(endOfMonth(now), 'yyyy-MM-dd');

  const thisMonthEntries = entries.filter(e => e.date >= startOfCurMonth && e.date <= endOfCurMonth);
  const thisMonthSpecials = specialOrders.filter(s => s.date >= startOfCurMonth && s.date <= endOfCurMonth);

  const totalStickSoldThisMonth =
    thisMonthEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0) +
    thisMonthSpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);

  const totalPotSoldThisMonth =
    thisMonthEntries.reduce((sum, e) => sum + (e.potSold || 0), 0) +
    thisMonthSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);

  const totalPlateSoldThisMonth =
    thisMonthEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0) +
    thisMonthSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);

  const daysWithActivity = new Set([
    ...thisMonthEntries.map(e => e.date),
    ...thisMonthSpecials.map(s => s.date)
  ]).size;

  const avgStickSoldThisMonth = daysWithActivity > 0 ? Math.round(totalStickSoldThisMonth / daysWithActivity) : 0;
  const avgPotSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPotSoldThisMonth / daysWithActivity) : 0;
  const avgPlateSoldThisMonth = daysWithActivity > 0 ? Math.round(totalPlateSoldThisMonth / daysWithActivity) : 0;

  return {
    baseStockDate,
    baseStickQty,
    basePotQty,
    basePlateQty,
    availableStick,
    availablePot,
    availablePlate,
    totalStickSoldSinceBase,
    totalPotSoldSinceBase,
    totalPlateSoldSinceBase,
    totalSpecialStickSinceBase,
    totalSpecialPotSinceBase,
    totalSpecialPlateSinceBase,
    totalStickDeductedSinceBase,
    totalPotDeductedSinceBase,
    totalPlateDeductedSinceBase,
    totalStickSoldThisMonth,
    totalPotSoldThisMonth,
    totalPlateSoldThisMonth,
    avgStickSoldThisMonth,
    avgPotSoldThisMonth,
    avgPlateSoldThisMonth
  };
}

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
  const basePlateQty = Math.max(0, Number(inventory?.plateQuantity) || 0);

  const requestedDays: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    try {
      const d = format(subDays(parseISO(todayStr), i), 'yyyy-MM-dd');
      requestedDays.push(d);
    } catch {
      // ignore
    }
  }

  const allDatesSet = new Set<string>();
  entries.forEach(e => allDatesSet.add(e.date));
  specialOrders.forEach(s => allDatesSet.add(s.date));
  requestedDays.forEach(d => allDatesSet.add(d));
  allDatesSet.add(baseStockDate);
  allDatesSet.add(todayStr);

  const sortedDates = Array.from(allDatesSet).filter(Boolean).sort();
  const ledgerMap = new Map<string, DayStockLedgerRow>();

  let runningStick = baseStickQty;
  let runningPot = basePotQty;
  let runningPlate = basePlateQty;

  for (const d of sortedDates) {
    if (d >= baseStockDate) {
      const entry = entries.find(e => e.date === d);
      const daySpecials = specialOrders.filter(s => s.date === d);

      const soldStick = entry ? (entry.stickSold || 0) : 0;
      const soldPot = entry ? (entry.potSold || 0) : 0;
      const soldPlate = entry ? (entry.plateSold || 0) : 0;

      const loadedStick = entry ? (entry.stickLoaded || 0) : 0;
      const loadedPot = entry ? (entry.potLoaded || 0) : 0;
      const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;

      const specialOrderStick = daySpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
      const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);
      const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);

      const totalStickDeducted = soldStick + specialOrderStick;
      const totalPotDeducted = soldPot + specialOrderPot;
      const totalPlateDeducted = soldPlate + specialOrderPlate;

      const cartBalanceStick = entry
        ? (entry.stickBalance !== undefined ? entry.stickBalance : Math.max(0, loadedStick - soldStick))
        : 0;
      const cartBalancePot = entry
        ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))
        : 0;
      const cartBalancePlate = entry
        ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))
        : 0;

      const openingStick = runningStick;
      const openingPot = runningPot;
      const openingPlate = runningPlate;

      const closingStick = Math.max(0, openingStick - totalStickDeducted);
      const closingPot = Math.max(0, openingPot - totalPotDeducted);
      const closingPlate = Math.max(0, openingPlate - totalPlateDeducted);

      let displayDate = d;
      let fullDisplayDate = d;
      let dayName = '';
      try {
        const parsed = parseISO(d);
        displayDate = format(parsed, 'EEE, d MMM');
        fullDisplayDate = format(parsed, 'EEEE, d MMMM yyyy');
        dayName = format(parsed, 'EEEE');
      } catch {}

      const isToday = d === todayStr;
      const isBaseline = d === baseStockDate;

      const stockStatusStick: 'healthy' | 'low' | 'out_of_stock' =
        closingStick === 0 ? 'out_of_stock' : closingStick < 150 ? 'low' : 'healthy';
      const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =
        closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';
      const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =
        closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';

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
        openingPlate,
        loadedPlate,
        soldPlate,
        specialOrderPlate,
        totalPlateDeducted,
        cartBalancePlate,
        closingPlate,
        hasEntry: Boolean(entry),
        hasSpecialOrder: daySpecials.length > 0,
        stockStatusStick,
        stockStatusPot,
        stockStatusPlate
      });

      runningStick = closingStick;
      runningPot = closingPot;
      runningPlate = closingPlate;
    }
  }

  const datesBeforeBase = sortedDates.filter(d => d < baseStockDate).reverse();
  let backStick = baseStickQty;
  let backPot = basePotQty;
  let backPlate = basePlateQty;

  for (const d of datesBeforeBase) {
    const entry = entries.find(e => e.date === d);
    const daySpecials = specialOrders.filter(s => s.date === d);

    const soldStick = entry ? (entry.stickSold || 0) : 0;
    const soldPot = entry ? (entry.potSold || 0) : 0;
    const soldPlate = entry ? (entry.plateSold || 0) : 0;

    const loadedStick = entry ? (entry.stickLoaded || 0) : 0;
    const loadedPot = entry ? (entry.potLoaded || 0) : 0;
    const loadedPlate = entry ? (entry.plateLoaded || 0) : 0;

    const specialOrderStick = daySpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
    const specialOrderPot = daySpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);
    const specialOrderPlate = daySpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);

    const totalStickDeducted = soldStick + specialOrderStick;
    const totalPotDeducted = soldPot + specialOrderPot;
    const totalPlateDeducted = soldPlate + specialOrderPlate;

    const cartBalanceStick = entry
      ? (entry.stickBalance !== undefined ? entry.stickBalance : Math.max(0, loadedStick - soldStick))
      : 0;
    const cartBalancePot = entry
      ? (entry.potBalance !== undefined ? entry.potBalance : Math.max(0, loadedPot - soldPot))
      : 0;
    const cartBalancePlate = entry
      ? (entry.plateBalance !== undefined ? entry.plateBalance : Math.max(0, loadedPlate - soldPlate))
      : 0;

    const closingStick = backStick;
    const closingPot = backPot;
    const closingPlate = backPlate;

    const openingStick = closingStick + totalStickDeducted;
    const openingPot = closingPot + totalPotDeducted;
    const openingPlate = closingPlate + totalPlateDeducted;

    let displayDate = d;
    let fullDisplayDate = d;
    let dayName = '';
    try {
      const parsed = parseISO(d);
      displayDate = format(parsed, 'EEE, d MMM');
      fullDisplayDate = format(parsed, 'EEEE, d MMMM yyyy');
      dayName = format(parsed, 'EEEE');
    } catch {}

    const isToday = d === todayStr;
    const isBaseline = d === baseStockDate;

    const stockStatusStick: 'healthy' | 'low' | 'out_of_stock' =
      closingStick === 0 ? 'out_of_stock' : closingStick < 150 ? 'low' : 'healthy';
    const stockStatusPot: 'healthy' | 'low' | 'out_of_stock' =
      closingPot === 0 ? 'out_of_stock' : closingPot < 15 ? 'low' : 'healthy';
    const stockStatusPlate: 'healthy' | 'low' | 'out_of_stock' =
      closingPlate === 0 ? 'out_of_stock' : closingPlate < 15 ? 'low' : 'healthy';

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
      openingPlate,
      loadedPlate,
      soldPlate,
      specialOrderPlate,
      totalPlateDeducted,
      cartBalancePlate,
      closingPlate,
      hasEntry: Boolean(entry),
      hasSpecialOrder: daySpecials.length > 0,
      stockStatusStick,
      stockStatusPot,
      stockStatusPlate
    });

    backStick = openingStick;
    backPot = openingPot;
    backPlate = openingPlate;
  }

  const allRows = Array.from(ledgerMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  const last10DaysRows = requestedDays
    .map(d => ledgerMap.get(d))
    .filter((row): row is DayStockLedgerRow => Boolean(row))
    .reverse();

  const selectedDateRow = (dateStr: string) => ledgerMap.get(dateStr);

  return {
    ledgerRows: allRows,
    last10DaysRows,
    selectedDateRow
  };
}
