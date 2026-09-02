import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Download, 
  Loader2, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  TrendingUp, 
  Receipt, 
  Package, 
  PartyPopper, 
  Wallet,
  Calendar
} from 'lucide-react';
import { 
  useEntries, 
  useExpenses, 
  useProfitWithdrawals, 
  useSpecialOrders, 
  useInventory, 
  useSettings 
} from '../store';
import { format } from 'date-fns';
import { MonthlyFinancialStatement } from './MonthlyFinancialStatement';
import { 
  exportMultiTabWorkbook, 
  exportSingleSectionCSV, 
  exportCombinedAllSectionsCSV 
} from '../lib/exportWorkbook';

export default function ExportData() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exportScope, setExportScope] = useState<'month' | 'all'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  const { entries } = useEntries();
  const { expenses } = useExpenses();
  const { profitWithdrawals } = useProfitWithdrawals();
  const { specialOrders } = useSpecialOrders();
  const { inventory } = useInventory();
  const { settings } = useSettings();

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const targetMonth = exportScope === 'month' ? currentDate : undefined;
  const periodLabel = exportScope === 'month' ? format(currentDate, 'MMMM yyyy') : 'All Time History';

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const filename = exportMultiTabWorkbook({
        entries,
        expenses,
        profitWithdrawals,
        specialOrders,
        inventory,
        settings,
        targetMonth
      });
      setSuccessMsg(`Downloaded ${filename} with all 6 section tabs!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
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
    setSuccessMsg(`Downloaded complete Master CSV for ${periodLabel}!`);
    setTimeout(() => setSuccessMsg(null), 4000);
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
    setSuccessMsg(`Downloaded ${sectionNames[sectionKey]} CSV!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Export & Financial Reports
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Download multi-tab Excel workbooks, separate CSV section sheets, or 1-page printable Month-End PDF Statements.
            </p>
          </div>

          {/* Period Scope Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Period:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportScope('month')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    exportScope === 'month'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    exportScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Time
                </button>
              </div>

              {exportScope === 'month' && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 px-2 text-[10px] font-black text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 uppercase cursor-pointer">
                    &lt;
                  </Button>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 px-2 min-w-[90px] text-center">
                    {format(currentDate, 'MMM yyyy')}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 px-2 text-[10px] font-black text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 uppercase cursor-pointer">
                    &gt;
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-black animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={() => setShowStatementModal(true)}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black tracking-wider text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>MONTH-END PDF STATEMENT</span>
            </Button>

            <Button 
              onClick={handleExportExcel} 
              disabled={isExporting}
              className="w-full h-14 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black tracking-wider text-xs rounded-2xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              <span>{isExporting ? 'EXPORTING...' : 'DOWNLOAD EXCEL (.XLSX) - 6 TABS'}</span>
            </Button>
          </div>

          {/* Multi-Tab Description & Badges */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-purple-500/5 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Included Tabs in Excel Workbook:
              </span>
              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase">
                Ready for Excel / Sheets
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">1. Daily Sales</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <Receipt className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span className="truncate">2. Expenses</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">3. Inventory Date-Wise</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <PartyPopper className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">4. Event Orders</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">5. Profit Taken</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">6. Summary KPIs</span>
              </div>
            </div>
          </div>

          {/* Individual Section CSV Downloads */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Individual Section CSV Downloads
              </span>
              <button
                type="button"
                onClick={handleExportCombinedCSV}
                className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Master CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Daily Sales CSV</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('sales')}
                  className="h-7 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Inventory Date-Wise CSV</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('inventory')}
                  className="h-7 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Event Orders CSV</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('specials')}
                  className="h-7 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Profit Taken CSV</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('profits')}
                  className="h-7 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-pink-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Expenses CSV</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportSectionCSV('expenses')}
                  className="h-7 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-End PDF Financial Statement Modal */}
      {showStatementModal && (
        <MonthlyFinancialStatement
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          entries={entries}
          expenses={expenses}
          profitWithdrawals={profitWithdrawals}
          specialOrders={specialOrders}
          settings={settings}
          initialDate={currentDate}
        />
      )}
    </div>
  );
}
