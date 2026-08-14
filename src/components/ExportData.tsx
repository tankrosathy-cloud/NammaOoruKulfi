import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { getEntries, getExpenses } from '../store';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import * as XLSX from 'xlsx';

export default function ExportData() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      // Fetch all entries and expenses (assuming getEntries/getExpenses fetches all or enough, 
      // but in this system they seem to fetch full lists or limit based on pagination. 
      // If store is cached, we might need a specific query, but let's use the exported fetchers)
      const allEntries = await getEntries();
      const allExpenses = await getExpenses();

      const filteredEntries = allEntries.filter(e => {
        try {
          const date = parseISO(e.date);
          return isWithinInterval(date, { start, end });
        } catch {
          return false;
        }
      }).sort((a, b) => a.date.localeCompare(b.date));

      const filteredExpenses = allExpenses.filter(e => {
        try {
          const date = parseISO(e.date);
          return isWithinInterval(date, { start, end });
        } catch {
          return false;
        }
      }).sort((a, b) => a.date.localeCompare(b.date));

      // Prepare Daily Entries Data
      const entriesData = filteredEntries.map(e => ({
        'Date': format(parseISO(e.date), 'dd-MMM'),
        'Stick Load': e.stickLoaded || 0,
        'Pot Load': e.potLoaded || 0,
        'Given Amt (Cash Bag Loaded)': e.cashBagLoaded || 0,
        'Stick Bal': e.stickBalance || 0,
        'Pot Bal': e.potBalance || 0,
        'Cash Bag (Total)': e.cashBagTotal || 0,
        'PhonePe': e.phonePe || 0,
        'Offer (Discount)': e.discount || 0,
        'Stick Sold': e.stickSold || 0,
        'Pot Sold': e.potSold || 0,
        'Required Amt': e.requiredAmount || 0,
        'Available Amt (Actual)': e.actualAmount,
        'Shortage': e.shortage || 0,
        'Notes': e.notes || '',
        'Bonus': e.bonus || 0,
        'Final Handover': (e.actualAmount || 0) - (e.cashBagLoaded || 0),
        'Daily Expenses': (e.expenses || 0) + (e.additionalExpenses || 0),
        'Expense Details': e.expenseDetails || ''
      }));

      // Prepare Other Expenses Data
      const expensesData = filteredExpenses.map(e => ({
        'Date': format(parseISO(e.date), 'dd MMM yyyy'),
        'Category': e.category,
        'Amount': e.amount,
        'Paid By': e.paidBy,
        'Notes': e.notes || ''
      }));

      const wb = XLSX.utils.book_new();
      
      const wsEntries = XLSX.utils.json_to_sheet(entriesData);
      XLSX.utils.book_append_sheet(wb, wsEntries, 'Daily Entries');
      
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Other Expenses');

      const monthName = format(currentDate, 'MMM_yyyy');
      XLSX.writeFile(wb, `Report_${monthName}.xlsx`);

    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Export Monthly Report
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Download Excel reports containing full inventory and financial breakdowns.
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 text-[10px] font-black text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 uppercase tracking-widest">Prev</Button>
            <span className="font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 text-[10px] font-black text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 uppercase tracking-widest">Next</Button>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest"
          >
            {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            {isExporting ? 'EXPORTING...' : 'DOWNLOAD EXCEL (.XLSX)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
