import { calculateDailyStockLedger } from './inventoryUtils';
import * as XLSX from 'xlsx';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, InventoryStock, Settings } from '../types';
import { isDateInMonth } from './utils';

export interface ExportDataOptions {
  entries: DailyEntry[];
  expenses: ExpenseEntry[];
  profitWithdrawals: ProfitWithdrawal[];
  specialOrders: SpecialOrder[];
  inventory: InventoryStock;
  settings?: Settings;
  targetMonth?: Date; // If undefined, exports all available records
  periodLabel?: string;
}

export function buildDateWiseInventoryLedger(
  entries: DailyEntry[],
  specialOrders: SpecialOrder[],
  inventory: InventoryStock,
  targetMonth?: Date
) {
  // We pass daysCount = 0 since the ledger automatically pulls all entry dates.
  const { ledgerRows } = calculateDailyStockLedger(inventory, entries, specialOrders, 0);

  const mapped = ledgerRows.map(row => {
    const daySpecials = specialOrders.filter(s => s.date === row.date);
    const dayEntry = entries.find(e => e.date === row.date);

    const notesParts: string[] = [];
    if (dayEntry) {
      notesParts.push(`Cart Sold: ${row.soldStick}s / ${row.soldPot}p`);
    }
    if (daySpecials.length > 0) {
      notesParts.push(`Event Orders: ${row.specialOrderStick}s / ${row.specialOrderPot}p (${daySpecials.map(s => s.eventType).join(', ')})`);
    }
    if (!dayEntry && daySpecials.length === 0) {
      notesParts.push('No sales recorded');
    }

    return {
      date: row.date,
      day: row.dayName,
      openingStick: row.openingStick,
      openingPot: row.openingPot,
      loadedStick: row.loadedStick,
      soldStick: row.soldStick,
      cartBalStick: row.cartBalanceStick,
      eventStick: row.specialOrderStick,
      totalStickOutflow: row.totalStickDeducted,
      closingStick: row.closingStick,
      loadedPot: row.loadedPot,
      soldPot: row.soldPot,
      cartBalPot: row.cartBalancePot,
      eventPot: row.specialOrderPot,
      totalPotOutflow: row.totalPotDeducted,
      closingPot: row.closingPot,
      totalPiecesSold: row.totalStickDeducted + row.totalPotDeducted,
      activityNotes: notesParts.join(' | ')
    };
  });

  // Sort them chronologically instead of reverse chronological
  mapped.sort((a, b) => a.date.localeCompare(b.date));

  if (targetMonth) {
    return mapped.filter(row => isDateInMonth(row.date, targetMonth));
  }
  return mapped;
}

export function exportMultiTabWorkbook(options: ExportDataOptions) {
  const {
    entries,
    expenses,
    profitWithdrawals,
    specialOrders,
    inventory,
    targetMonth
  } = options;

  const filterByMonth = (dateStr: string) => {
    if (!targetMonth) return true;
    return isDateInMonth(dateStr, targetMonth);
  };

  const filteredEntries = entries
    .filter(e => filterByMonth(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredExpenses = expenses
    .filter(e => filterByMonth(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredSpecials = specialOrders
    .filter(s => filterByMonth(s.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredProfits = profitWithdrawals
    .filter(p => filterByMonth(p.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const inventoryLedger = buildDateWiseInventoryLedger(entries, specialOrders, inventory, targetMonth);

  // 1. Daily Sales Sheet Data
  const salesRows = filteredEntries.map(e => {
    let dayName = '';
    try {
      dayName = format(parseISO(e.date), 'EEEE');
    } catch {}

    const grossSales = (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
    const dailyExpenses = (e.expenses || 0) + (e.additionalExpenses || 0);
    const finalHandover = (e.actualAmount || 0) - (e.cashBagLoaded || 0);

    return {
      'Date': e.date,
      'Day': dayName,
      'Stick Loaded': e.stickLoaded || 0,
      'Stick Cart Balance': e.stickBalance ?? Math.max(0, (e.stickLoaded || 0) - (e.stickSold || 0)),
      'Stick Sold': e.stickSold || 0,
      'Pot Loaded': e.potLoaded || 0,
      'Pot Cart Balance': e.potBalance ?? Math.max(0, (e.potLoaded || 0) - (e.potSold || 0)),
      'Pot Sold': e.potSold || 0,
      'Given Cash Bag Loaded (₹)': e.cashBagLoaded || 0,
      'Cash Bag Total (₹)': e.cashBagTotal || 0,
      'PhonePe / UPI (₹)': e.phonePe || 0,
      'Offer / Discount (₹)': e.discount || 0,
      'Required Amount (₹)': e.requiredAmount || 0,
      'Actual Amount (₹)': e.actualAmount || 0,
      'Gross Sales Revenue (₹)': grossSales,
      'Daily Running Expenses (₹)': dailyExpenses,
      'Expense Details': e.expenseDetails || '',
      'Bonus Given (₹)': e.bonus || 0,
      'Shortage (₹)': e.shortage || 0,
      'Net Cash Handover (₹)': finalHandover,
      'Notes': e.notes || ''
    };
  });

  // 2. Expenses Sheet Data
  const expensesRows = filteredExpenses.map(e => ({
    'Date': e.date,
    'Category': e.category || 'General',
    'Amount (₹)': e.amount || 0,
    'Paid By': e.paidBy || 'Owner',
    'Notes': e.notes || ''
  }));

  // 3. Inventory Date-Wise Sheet Data
  const inventoryRows = inventoryLedger.map(row => ({
    'Date': row.date,
    'Day': row.day,
    'Opening Stick Stock': row.openingStick,
    'Opening Pot Stock': row.openingPot,
    'Cart Loaded (Stick)': row.loadedStick,
    'Cart Sold (Stick)': row.soldStick,
    'Cart Return (Stick)': row.cartBalStick,
    'Event Sold (Stick)': row.eventStick,
    'Total Stick Sold Today': row.totalStickOutflow,
    'Closing Stick Stock': row.closingStick,
    'Cart Loaded (Pot)': row.loadedPot,
    'Cart Sold (Pot)': row.soldPot,
    'Cart Return (Pot)': row.cartBalPot,
    'Event Sold (Pot)': row.eventPot,
    'Total Pot Sold Today': row.totalPotOutflow,
    'Closing Pot Stock': row.closingPot,
    'Total Pieces Sold Today': row.totalPiecesSold,
    'Activity Details': row.activityNotes
  }));

  // 4. Event Orders Sheet Data
  const specialRows = filteredSpecials.map(s => {
    const totalPcs = (s.stickQuantity || 0) + (s.potQuantity || 0);
    const avgRate = totalPcs > 0 ? Math.round((s.amountReceived || 0) / totalPcs) : 0;
    return {
      'Date': s.date,
      'Event Type': s.eventType || 'Event',
      'Stick Quantity (pcs)': s.stickQuantity || 0,
      'Pot Quantity (pcs)': s.potQuantity || 0,
      'Total Pieces (pcs)': totalPcs,
      'Amount Received (₹)': s.amountReceived || 0,
      'Avg Rate Per Pc (₹)': avgRate,
      'Notes & Client Details': s.notes || ''
    };
  });

  // 5. Profit Taken Sheet Data
  const profitRows = filteredProfits.map(p => ({
    'Date': p.date,
    'Amount Withdrawn (₹)': p.amount || 0,
    'Notes & Purpose': p.notes || ''
  }));

  // 6. Monthly Summary Sheet Data
  const totalDailyRevenue = salesRows.reduce((sum, r) => sum + r['Gross Sales Revenue (₹)'], 0);
  const totalEventRevenue = specialRows.reduce((sum, r) => sum + r['Amount Received (₹)'], 0);
  const totalCombinedRevenue = totalDailyRevenue + totalEventRevenue;

  const totalDailyExpenses = salesRows.reduce((sum, r) => sum + r['Daily Running Expenses (₹)'], 0);
  const totalOtherExpenses = expensesRows.reduce((sum, r) => sum + r['Amount (₹)'], 0);
  const totalAllExpenses = totalDailyExpenses + totalOtherExpenses;

  const totalShortage = salesRows.reduce((sum, r) => sum + r['Shortage (₹)'], 0);
  const netSavings = totalCombinedRevenue - totalAllExpenses;
  const totalProfitWithdrawn = profitRows.reduce((sum, r) => sum + r['Amount Withdrawn (₹)'], 0);
  const retainedEarnings = netSavings - totalProfitWithdrawn;

  const totalStickSoldCart = salesRows.reduce((sum, r) => sum + r['Stick Sold'], 0);
  const totalStickSoldEvent = specialRows.reduce((sum, r) => sum + r['Stick Quantity (pcs)'], 0);
  const totalPotSoldCart = salesRows.reduce((sum, r) => sum + r['Pot Sold'], 0);
  const totalPotSoldEvent = specialRows.reduce((sum, r) => sum + r['Pot Quantity (pcs)'], 0);

  const summaryRows = [
    { 'Metric / Description': 'Reporting Period', 'Value': targetMonth ? format(targetMonth, 'MMMM yyyy') : 'All Time', 'Unit / Note': '' },
    { 'Metric / Description': 'Total Stick Sold (Cart)', 'Value': totalStickSoldCart, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total Stick Sold (Event Orders)', 'Value': totalStickSoldEvent, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total Stick Sold (Combined)', 'Value': totalStickSoldCart + totalStickSoldEvent, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total Pot Sold (Cart)', 'Value': totalPotSoldCart, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total Pot Sold (Event Orders)', 'Value': totalPotSoldEvent, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total Pot Sold (Combined)', 'Value': totalPotSoldCart + totalPotSoldEvent, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Total All Pieces Sold', 'Value': totalStickSoldCart + totalStickSoldEvent + totalPotSoldCart + totalPotSoldEvent, 'Unit / Note': 'Pieces' },
    { 'Metric / Description': 'Daily Cart Sales Revenue', 'Value': totalDailyRevenue, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Event Orders Revenue', 'Value': totalEventRevenue, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Total Gross Business Revenue', 'Value': totalCombinedRevenue, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Daily Running Cart Expenses', 'Value': totalDailyExpenses, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Other Shop & Business Expenses', 'Value': totalOtherExpenses, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Total All Operating Expenses', 'Value': totalAllExpenses, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Net Operating Savings / Profit', 'Value': netSavings, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Total Profit Taken / Withdrawn', 'Value': totalProfitWithdrawn, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Retained Earnings Balance', 'Value': retainedEarnings, 'Unit / Note': '₹ INR' },
    { 'Metric / Description': 'Total Cash Shortages Recorded', 'Value': totalShortage, 'Unit / Note': '₹ INR' }
  ];

  // Build Excel Workbook
  const wb = XLSX.utils.book_new();

  // Tab 1: Daily Sales
  const wsSales = XLSX.utils.json_to_sheet(salesRows.length > 0 ? salesRows : [{ 'Date': 'No entries recorded', 'Note': '' }]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Daily Sales');

  // Tab 2: Other Expenses
  const wsExpenses = XLSX.utils.json_to_sheet(expensesRows.length > 0 ? expensesRows : [{ 'Date': 'No expenses recorded', 'Amount': 0 }]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // Tab 3: Inventory Date-Wise
  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows.length > 0 ? inventoryRows : [{ 'Date': 'No inventory ledger records', 'Stock': 0 }]);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Date-Wise');

  // Tab 4: Event Orders
  const wsSpecials = XLSX.utils.json_to_sheet(specialRows.length > 0 ? specialRows : [{ 'Date': 'No event orders recorded', 'Amount': 0 }]);
  XLSX.utils.book_append_sheet(wb, wsSpecials, 'Event Orders');

  // Tab 5: Profit Taken
  const wsProfits = XLSX.utils.json_to_sheet(profitRows.length > 0 ? profitRows : [{ 'Date': 'No profit withdrawals recorded', 'Amount': 0 }]);
  XLSX.utils.book_append_sheet(wb, wsProfits, 'Profit Taken');

  // Tab 6: Summary
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const periodSlug = targetMonth ? format(targetMonth, 'MMM_yyyy') : 'All_Time';
  const filename = `Namma_Ooru_Kulfi_Full_Report_${periodSlug}.xlsx`;
  
  XLSX.writeFile(wb, filename);
  return filename;
}

export function exportSingleSectionCSV(
  sectionKey: 'sales' | 'expenses' | 'inventory' | 'specials' | 'profits' | 'summary',
  options: ExportDataOptions
) {
  const {
    entries,
    expenses,
    profitWithdrawals,
    specialOrders,
    inventory,
    targetMonth
  } = options;

  const filterByMonth = (dateStr: string) => {
    if (!targetMonth) return true;
    return isDateInMonth(dateStr, targetMonth);
  };

  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  let filePrefix = 'Report';

  if (sectionKey === 'sales') {
    filePrefix = 'Daily_Sales';
    headers = [
      'Date', 'Day', 'Stick Loaded', 'Stick Balance', 'Stick Sold',
      'Pot Loaded', 'Pot Balance', 'Pot Sold', 'Given Cash Bag Loaded',
      'Cash Bag Total', 'PhonePe/UPI', 'Discount', 'Required Amount',
      'Actual Amount', 'Gross Sales Revenue', 'Daily Expenses', 'Expense Details',
      'Bonus', 'Shortage', 'Net Cash Handover', 'Notes'
    ];
    const filtered = entries.filter(e => filterByMonth(e.date)).sort((a, b) => a.date.localeCompare(b.date));
    rows = filtered.map(e => {
      let dayName = '';
      try { dayName = format(parseISO(e.date), 'EEEE'); } catch {}
      const grossSales = (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      const dailyExpenses = (e.expenses || 0) + (e.additionalExpenses || 0);
      const finalHandover = (e.actualAmount || 0) - (e.cashBagLoaded || 0);
      return [
        e.date,
        dayName,
        e.stickLoaded || 0,
        e.stickBalance ?? Math.max(0, (e.stickLoaded || 0) - (e.stickSold || 0)),
        e.stickSold || 0,
        e.potLoaded || 0,
        e.potBalance ?? Math.max(0, (e.potLoaded || 0) - (e.potSold || 0)),
        e.potSold || 0,
        e.cashBagLoaded || 0,
        e.cashBagTotal || 0,
        e.phonePe || 0,
        e.discount || 0,
        e.requiredAmount || 0,
        e.actualAmount || 0,
        grossSales,
        dailyExpenses,
        `"${(e.expenseDetails || '').replace(/"/g, '""')}"`,
        e.bonus || 0,
        e.shortage || 0,
        finalHandover,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ];
    });
  } else if (sectionKey === 'expenses') {
    filePrefix = 'Expenses';
    headers = ['Date', 'Category', 'Amount', 'Paid By', 'Notes'];
    const filtered = expenses.filter(e => filterByMonth(e.date)).sort((a, b) => a.date.localeCompare(b.date));
    rows = filtered.map(e => [
      e.date,
      `"${(e.category || 'General').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.paidBy || 'Owner').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
  } else if (sectionKey === 'inventory') {
    filePrefix = 'Inventory_DateWise';
    headers = [
      'Date', 'Day', 'Opening Stick Stock', 'Opening Pot Stock',
      'Cart Loaded Stick', 'Cart Sold Stick', 'Cart Return Stick', 'Event Sold Stick', 'Total Stick Sold', 'Closing Stick Stock',
      'Cart Loaded Pot', 'Cart Sold Pot', 'Cart Return Pot', 'Event Sold Pot', 'Total Pot Sold', 'Closing Pot Stock',
      'Total Pieces Sold Today', 'Activity Details'
    ];
    const ledger = buildDateWiseInventoryLedger(entries, specialOrders, inventory, targetMonth);
    rows = ledger.map(r => [
      r.date,
      r.day,
      r.openingStick,
      r.openingPot,
      r.loadedStick,
      r.soldStick,
      r.cartBalStick,
      r.eventStick,
      r.totalStickOutflow,
      r.closingStick,
      r.loadedPot,
      r.soldPot,
      r.cartBalPot,
      r.eventPot,
      r.totalPotOutflow,
      r.closingPot,
      r.totalPiecesSold,
      `"${r.activityNotes.replace(/"/g, '""')}"`
    ]);
  } else if (sectionKey === 'specials') {
    filePrefix = 'Event_Orders';
    headers = ['Date', 'Event Type', 'Stick Quantity', 'Pot Quantity', 'Total Pieces', 'Amount Received', 'Notes'];
    const filtered = specialOrders.filter(s => filterByMonth(s.date)).sort((a, b) => a.date.localeCompare(b.date));
    rows = filtered.map(s => [
      s.date,
      `"${(s.eventType || 'Event').replace(/"/g, '""')}"`,
      s.stickQuantity || 0,
      s.potQuantity || 0,
      (s.stickQuantity || 0) + (s.potQuantity || 0),
      s.amountReceived || 0,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);
  } else if (sectionKey === 'profits') {
    filePrefix = 'Profit_Taken';
    headers = ['Date', 'Amount Withdrawn', 'Notes / Purpose'];
    const filtered = profitWithdrawals.filter(p => filterByMonth(p.date)).sort((a, b) => a.date.localeCompare(b.date));
    rows = filtered.map(p => [
      p.date,
      p.amount || 0,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const periodSlug = targetMonth ? format(targetMonth, 'MMM_yyyy') : 'All_Time';
  link.setAttribute('download', `${filePrefix}_${periodSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCombinedAllSectionsCSV(options: ExportDataOptions) {
  const {
    entries,
    expenses,
    profitWithdrawals,
    specialOrders,
    inventory,
    targetMonth
  } = options;

  const filterByMonth = (dateStr: string) => {
    if (!targetMonth) return true;
    return isDateInMonth(dateStr, targetMonth);
  };

  const periodLabel = targetMonth ? format(targetMonth, 'MMMM yyyy') : 'All Time';
  const lines: string[] = [];

  lines.push(`NAMMA OORU KULFI - COMPLETE BUSINESS EXPORT (${periodLabel})`);
  lines.push(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  lines.push('');

  // 1. DAILY SALES SECTION
  lines.push('=== SECTION 1: DAILY SALES & REVENUE ===');
  lines.push([
    'Date', 'Day', 'Stick Loaded', 'Stick Balance', 'Stick Sold',
    'Pot Loaded', 'Pot Balance', 'Pot Sold', 'Given Cash Bag Loaded',
    'Cash Bag Total', 'PhonePe/UPI', 'Discount', 'Required Amount',
    'Actual Amount', 'Gross Sales Revenue', 'Daily Expenses', 'Expense Details',
    'Bonus', 'Shortage', 'Net Cash Handover', 'Notes'
  ].join(','));
  const filteredEntries = entries.filter(e => filterByMonth(e.date)).sort((a, b) => a.date.localeCompare(b.date));
  filteredEntries.forEach(e => {
    let dayName = '';
    try { dayName = format(parseISO(e.date), 'EEEE'); } catch {}
    const grossSales = (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
    const dailyExpenses = (e.expenses || 0) + (e.additionalExpenses || 0);
    const finalHandover = (e.actualAmount || 0) - (e.cashBagLoaded || 0);
    lines.push([
      e.date,
      dayName,
      e.stickLoaded || 0,
      e.stickBalance ?? Math.max(0, (e.stickLoaded || 0) - (e.stickSold || 0)),
      e.stickSold || 0,
      e.potLoaded || 0,
      e.potBalance ?? Math.max(0, (e.potLoaded || 0) - (e.potSold || 0)),
      e.potSold || 0,
      e.cashBagLoaded || 0,
      e.cashBagTotal || 0,
      e.phonePe || 0,
      e.discount || 0,
      e.requiredAmount || 0,
      e.actualAmount || 0,
      grossSales,
      dailyExpenses,
      `"${(e.expenseDetails || '').replace(/"/g, '""')}"`,
      e.bonus || 0,
      e.shortage || 0,
      finalHandover,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ].join(','));
  });
  lines.push('');

  // 2. INVENTORY DATE-WISE SECTION
  lines.push('=== SECTION 2: INVENTORY DATE-WISE LEDGER ===');
  lines.push([
    'Date', 'Day', 'Opening Stick Stock', 'Opening Pot Stock',
    'Cart Loaded Stick', 'Cart Sold Stick', 'Cart Return Stick', 'Event Sold Stick', 'Total Stick Sold', 'Closing Stick Stock',
    'Cart Loaded Pot', 'Cart Sold Pot', 'Cart Return Pot', 'Event Sold Pot', 'Total Pot Sold', 'Closing Pot Stock',
    'Total Pieces Sold Today', 'Activity Details'
  ].join(','));
  const ledger = buildDateWiseInventoryLedger(entries, specialOrders, inventory, targetMonth);
  ledger.forEach(r => {
    lines.push([
      r.date,
      r.day,
      r.openingStick,
      r.openingPot,
      r.loadedStick,
      r.soldStick,
      r.cartBalStick,
      r.eventStick,
      r.totalStickOutflow,
      r.closingStick,
      r.loadedPot,
      r.soldPot,
      r.cartBalPot,
      r.eventPot,
      r.totalPotOutflow,
      r.closingPot,
      r.totalPiecesSold,
      `"${r.activityNotes.replace(/"/g, '""')}"`
    ].join(','));
  });
  lines.push('');

  // 3. EVENT ORDERS SECTION
  lines.push('=== SECTION 3: EVENT & SPECIAL ORDERS ===');
  lines.push(['Date', 'Event Type', 'Stick Quantity', 'Pot Quantity', 'Total Pieces', 'Amount Received', 'Notes'].join(','));
  const filteredSpecials = specialOrders.filter(s => filterByMonth(s.date)).sort((a, b) => a.date.localeCompare(b.date));
  filteredSpecials.forEach(s => {
    lines.push([
      s.date,
      `"${(s.eventType || 'Event').replace(/"/g, '""')}"`,
      s.stickQuantity || 0,
      s.potQuantity || 0,
      (s.stickQuantity || 0) + (s.potQuantity || 0),
      s.amountReceived || 0,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ].join(','));
  });
  lines.push('');

  // 4. OTHER EXPENSES SECTION
  lines.push('=== SECTION 4: OTHER SHOP & BUSINESS EXPENSES ===');
  lines.push(['Date', 'Category', 'Amount', 'Paid By', 'Notes'].join(','));
  const filteredExpenses = expenses.filter(e => filterByMonth(e.date)).sort((a, b) => a.date.localeCompare(b.date));
  filteredExpenses.forEach(e => {
    lines.push([
      e.date,
      `"${(e.category || 'General').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.paidBy || 'Owner').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ].join(','));
  });
  lines.push('');

  // 5. PROFIT TAKEN SECTION
  lines.push('=== SECTION 5: PROFIT TAKEN / WITHDRAWALS ===');
  lines.push(['Date', 'Amount Withdrawn', 'Notes / Purpose'].join(','));
  const filteredProfits = profitWithdrawals.filter(p => filterByMonth(p.date)).sort((a, b) => a.date.localeCompare(b.date));
  filteredProfits.forEach(p => {
    lines.push([
      p.date,
      p.amount || 0,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ].join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const periodSlug = targetMonth ? format(targetMonth, 'MMM_yyyy') : 'All_Time';
  link.setAttribute('download', `Namma_Ooru_Kulfi_Full_Export_${periodSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
