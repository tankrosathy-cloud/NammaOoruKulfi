import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  Calendar, 
  Package, 
  PartyPopper, 
  Receipt, 
  Wallet, 
  CheckCircle2, 
  X, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, InventoryStock, Settings } from '../types';
import { 
  exportMultiTabWorkbook, 
  exportSingleSectionCSV, 
  exportCombinedAllSectionsCSV,
  buildDateWiseInventoryLedger
} from '../lib/exportWorkbook';
import { useTheme } from '../context/ThemeContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyEntry[];
  expenses: ExpenseEntry[];
  profitWithdrawals: ProfitWithdrawal[];
  specialOrders: SpecialOrder[];
  inventory: InventoryStock;
  settings?: Settings;
  currentDate: Date;
}

export default function ExportModal({
  isOpen,
  onClose,
  entries,
  expenses,
  profitWithdrawals,
  specialOrders,
  inventory,
  settings,
  currentDate
}: ExportModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [exportScope, setExportScope] = useState<'month' | 'all'>('month');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetMonth = exportScope === 'month' ? currentDate : undefined;
  const periodLabel = exportScope === 'month' ? format(currentDate, 'MMMM yyyy') : 'All Time History';

  const handleExportExcel = () => {
    const filename = exportMultiTabWorkbook({
      entries,
      expenses,
      profitWithdrawals,
      specialOrders,
      inventory,
      settings,
      targetMonth
    });
    setDownloadSuccess(`Downloaded ${filename} with all 6 section tabs!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportCombinedCSV = () => {
    exportCombinedAllSectionsCSV({
      entries,
      expenses,
      profitWithdrawals,
      specialOrders,
      inventory,
      settings,
      targetMonth
    });
    setDownloadSuccess(`Downloaded complete Master CSV for ${periodLabel}!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportSectionCSV = (sectionKey: 'sales' | 'expenses' | 'inventory' | 'specials' | 'profits') => {
    exportSingleSectionCSV(sectionKey, {
      entries,
      expenses,
      profitWithdrawals,
      specialOrders,
      inventory,
      settings,
      targetMonth
    });
    const sectionNames = {
      sales: 'Daily Sales',
      expenses: 'Expenses',
      inventory: 'Inventory Date-Wise',
      specials: 'Event Orders',
      profits: 'Profit Taken'
    };
    setDownloadSuccess(`Downloaded ${sectionNames[sectionKey]} CSV!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Export Data & Worksheets
              </h2>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Multi-Tab Excel Workbook & CSV Options
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Scope Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Export Period:
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setExportScope('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  exportScope === 'month'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {format(currentDate, 'MMM yyyy')}
              </button>
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Download Success Notice */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-black animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Primary Action: Multi-Tab Excel Workbook */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Recommended: Multi-Tab Spreadsheet
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
                6 Sheets / Tabs
              </span>
            </div>

            <Card className="border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Excel Workbook (.xlsx)</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black">All Sections</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      One master file with distinct worksheet tabs for every business area.
                    </p>
                  </div>
                  <Button
                    onClick={handleExportExcel}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-wider h-11 px-5 rounded-2xl shadow-md shadow-cyan-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .XLSX</span>
                  </Button>
                </div>

                {/* Grid of Tabs Included */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">1. Daily Sales</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">2. Expenses</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">3. Inventory Date-Wise</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <PartyPopper className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">4. Event Orders</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">5. Profit Taken</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">6. Executive Summary</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: CSV Exports */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                CSV Export Options
              </span>
              <button
                type="button"
                onClick={handleExportCombinedCSV}
                className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Master All-in-One CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Daily Sales CSV */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Daily Sales CSV</p>
                    <p className="text-[10px] text-slate-500 font-bold">Stick, Pot, Revenue, UPI</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('sales')}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              {/* Inventory Date-Wise CSV */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Inventory Ledger CSV</p>
                    <p className="text-[10px] text-slate-500 font-bold">Date-wise Opening & Closing</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('inventory')}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              {/* Event Orders CSV */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                    <PartyPopper className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Event Orders CSV</p>
                    <p className="text-[10px] text-slate-500 font-bold">Weddings, Events, Bulk Orders</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('specials')}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              {/* Profit Taken CSV */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Profit Taken CSV</p>
                    <p className="text-[10px] text-slate-500 font-bold">Partner Withdrawals & Notes</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('profits')}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              {/* Expenses CSV */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between sm:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Other Expenses CSV</p>
                    <p className="text-[10px] text-slate-500 font-bold">Category breakdown, Amount, Paid By</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('expenses')}
                  className="h-8 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-black uppercase tracking-wider rounded-xl"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
