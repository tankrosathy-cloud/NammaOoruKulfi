import React, { useState, useMemo } from 'react';
import { useEntries, deleteEntry, useExpenses, deleteExpense, useProfitWithdrawals, saveProfitWithdrawal, deleteProfitWithdrawal, useSpecialOrders, saveSpecialOrder, deleteSpecialOrder, updateSpecialOrder, useInventory, useSettings, useDailyDenominations, getDenomsStorageKey } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { formatCurrency, isDateInMonth } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Trash2, Edit2, Download, Eye, X, Plus, Calendar, FileText, MessageCircle, Share2, Printer, Coins } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, Denominations, DailyDenominationsRecord } from '../types';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MonthlyFinancialStatement } from '../components/MonthlyFinancialStatement';
import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';
import ExportModal from '../components/ExportModal';
import { exportMultiTabWorkbook } from '../lib/exportWorkbook';

const getEntryDenominations = (e: DailyEntry, dailyDenomsMap?: Record<string, DailyDenominationsRecord>): Denominations | undefined => {
  if (dailyDenomsMap && dailyDenomsMap[e.date]?.denominations) {
    return dailyDenomsMap[e.date].denominations;
  }
  if (e.denominations) return e.denominations;
  try {
    const cached = localStorage.getItem(getDenomsStorageKey(e.date, e.franchiseId));
    if (cached) return JSON.parse(cached);
  } catch {}
  return undefined;
};

const getDenomTotal = (d?: Denominations): number => {
  if (!d) return 0;
  return (
    ((Number(d.n500) || 0) * 500) +
    ((Number(d.n200) || 0) * 200) +
    ((Number(d.n100) || 0) * 100) +
    ((Number(d.n50) || 0) * 50) +
    ((Number(d.n20) || 0) * 20) +
    ((Number(d.n10) || 0) * 10) +
    (Number(d.coins) || 0)
  );
};

export default function Reports({ role = 'owner', onEdit, onEditExpense }: { role?: 'owner' | 'manager', onEdit: (date: string) => void, onEditExpense: (expense: ExpenseEntry) => void }) {
  const isOwner = role === 'owner';
  const { entries, loading, reload, loadMore: loadMoreEntries, hasMore: hasMoreEntries } = useEntries();
  const { expenses, loading: expensesLoading, reload: reloadExpenses, loadMore: loadMoreExpenses, hasMore: hasMoreExpenses } = useExpenses();
  const { profitWithdrawals } = useProfitWithdrawals();
  const { settings } = useSettings();
  const { dailyDenominationsMap } = useDailyDenominations();
  const [expenseDeleteConfirmId, setExpenseDeleteConfirmId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [profitDeleteConfirmId, setProfitDeleteConfirmId] = useState<string | null>(null);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [profitForm, setProfitForm] = useState({ amount: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [whatsAppEntryToShare, setWhatsAppEntryToShare] = useState<DailyEntry | null>(null);
  
  const { specialOrders } = useSpecialOrders();
  const { inventory } = useInventory();
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialDeleteConfirmId, setSpecialDeleteConfirmId] = useState<string | null>(null);
  const [specialForm, setSpecialForm] = useState({ eventType: 'Event', stickQuantity: '', potQuantity: '', plateQuantity: '', amountReceived: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [specialEditId, setSpecialEditId] = useState<string | null>(null);
  const [specialOldOrder, setSpecialOldOrder] = useState<SpecialOrder | null>(null);
  const [profitEditId, setProfitEditId] = useState<string | null>(null);
const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [activeListTab, setActiveListTab] = useState<string>('entries');

  const { filteredEntries, filteredExpenses, filteredProfits, filteredSpecials, chartData, totals, profitTaken, retainedEarnings } = useMemo(() => {
    const filteredExps = expenses.filter(e => isDateInMonth(e.date, currentDate)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const filteredProfs = profitWithdrawals.filter(e => isDateInMonth(e.date, currentDate)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const filteredSpecials = specialOrders.filter(e => isDateInMonth(e.date, currentDate)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const filtered = entries.filter(e => isDateInMonth(e.date, currentDate)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const chartData = [...filtered].reverse().map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      revenue: Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0)),
    }));

    const totals = filtered.reduce(
      (acc, e) => {
        const netSales = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
        const totalExp = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
        acc.revenue += netSales;
        acc.expenses += totalExp;
        acc.shortage += (e.shortage || 0);
        acc.stickSold += (e.stickSold || 0);
        acc.potSold += (e.potSold || 0);
        acc.plateSold += (e.plateSold || 0);
        return acc;
      },
      { revenue: 0, expenses: 0, shortage: 0, finalAmount: 0, stickSold: 0, potSold: 0, plateSold: 0 }
    );
    
    
    // Add special orders to revenue and items sold
    filteredSpecials.forEach(order => {
      totals.revenue += order.amountReceived;
      totals.stickSold += order.stickQuantity;
      totals.potSold += order.potQuantity;
      totals.plateSold += order.plateQuantity || 0;
    });

    // Add standalone expenses to totals for owner only
    if (isOwner) {
      filteredExps.forEach(exp => {
          totals.expenses += exp.amount;
      });
    }

    // Calculate Net Savings: Total Revenue - Total Expenses
    totals.finalAmount = totals.revenue - totals.expenses;
    
    let profitTaken = 0;
    filteredProfs.forEach(p => {
      profitTaken += p.amount;
    });
    const retainedEarnings = totals.finalAmount - profitTaken;

    return { filteredEntries: filtered, filteredExpenses: filteredExps, filteredProfits: filteredProfs, filteredSpecials, chartData, totals, profitTaken, retainedEarnings };
  }, [entries, expenses, profitWithdrawals, specialOrders, currentDate]);

  
  const handleProfitSubmit = async () => {
    if (!profitForm.amount) return;
    try {
      await saveProfitWithdrawal({
        id: profitEditId ? profitEditId : Date.now().toString(),
        date: profitForm.date,
        amount: Number(profitForm.amount),
        notes: profitForm.notes
      });
      setShowProfitModal(false);
      setProfitEditId(null);
      setProfitForm({ amount: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (e) {
      console.error(e);
    }
  };

  const onEditProfit = (profit: ProfitWithdrawal) => {
    setProfitEditId(profit.id);
    setProfitForm({
      amount: profit.amount.toString(),
      notes: profit.notes || '',
      date: profit.date
    });
    setShowProfitModal(true);
  };

  const handleDeleteProfit = async (id: string) => {
    await deleteProfitWithdrawal(id);
    setProfitDeleteConfirmId(null);
  };

  const handleSpecialSubmit = async () => {
    if (!specialForm.amountReceived) return;
    try {
      if (specialEditId && specialOldOrder) {
        await updateSpecialOrder(specialOldOrder, {
          id: specialEditId,
          date: specialForm.date,
          eventType: specialForm.eventType,
          stickQuantity: Number(specialForm.stickQuantity) || 0,
          potQuantity: Number(specialForm.potQuantity) || 0,
          plateQuantity: Number(specialForm.plateQuantity) || 0,
          amountReceived: Number(specialForm.amountReceived),
          notes: specialForm.notes
        });
      } else {
        await saveSpecialOrder({
          id: Date.now().toString(),
          date: specialForm.date,
          eventType: specialForm.eventType,
          stickQuantity: Number(specialForm.stickQuantity) || 0,
          potQuantity: Number(specialForm.potQuantity) || 0,
          amountReceived: Number(specialForm.amountReceived),
          notes: specialForm.notes
        });
      }
      setShowSpecialModal(false);
      setSpecialEditId(null);
      setSpecialOldOrder(null);
      setSpecialForm({ eventType: 'Event', stickQuantity: '', potQuantity: '', plateQuantity: '', amountReceived: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (e) {
      console.error(e);
    }
  };

  const onEditSpecial = (order: SpecialOrder) => {
    setSpecialEditId(order.id);
    setSpecialOldOrder(order);
    setSpecialForm({
      eventType: order.eventType,
      stickQuantity: order.stickQuantity.toString(),
      potQuantity: order.potQuantity.toString(),
      plateQuantity: (order.plateQuantity || 0).toString(),
      amountReceived: order.amountReceived.toString(),
      notes: order.notes || '',
      date: order.date
    });
    setShowSpecialModal(true);
  };

  const handleDeleteSpecial = async (order: SpecialOrder) => {
    await deleteSpecialOrder(order);
    setSpecialDeleteConfirmId(null);
  };


  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    setDeleteConfirmId(null);
    reload();
  };
  
  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    setExpenseDeleteConfirmId(null);
    reloadExpenses();
  };


  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => subMonths(prev, -1));

  const handleExportCSV = () => {
    setShowExportModal(true);
  };

  if (loading) return <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Loading reports...</div>;

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">Reports</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 rounded-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-800">&lt;</Button>
          <span className="text-xs font-black tracking-wider uppercase w-24 text-center text-slate-700 dark:text-slate-200">{format(currentDate, 'MMM yyyy')}</span>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 rounded-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-800">&gt;</Button>
        </div>
      </div>
      
      {isOwner && (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowStatementModal(true)} 
          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-black text-xs cursor-pointer shadow-sm"
        >
          <FileText className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
          Month-End Statement
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportCSV} 
          className="bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100/60 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800 dark:hover:bg-cyan-900/50 dark:hover:text-cyan-300 font-bold cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV / Excel
        </Button>
      </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {isOwner && (
          <Card className={isDark ? 'bg-cyan-950/40 border-cyan-900/50' : 'bg-cyan-100/90 border-cyan-300 shadow-sm shadow-cyan-100/30'}>
            <CardContent className="p-5">
              <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-cyan-400 font-bold' : 'text-cyan-800 font-black'}`}>Total Revenue</p>
              <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.revenue)}</p>
            </CardContent>
          </Card>
        )}
        <Card className={isDark ? 'bg-pink-950/40 border-pink-900/50' : 'bg-pink-100/90 border-pink-300 shadow-sm shadow-pink-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-pink-400 font-bold' : 'text-pink-800 font-black'}`}>Total Expenses</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.expenses)}</p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-purple-950/40 border-purple-900/50' : 'bg-purple-100/90 border-purple-300 shadow-sm shadow-purple-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-purple-400 font-bold' : 'text-purple-800 font-black'}`}>Total Shortage</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.shortage)}</p>
          </CardContent>
        </Card>
        
        {isOwner && (
          <>
            <Card className={isDark ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-emerald-100/90 border-emerald-300 shadow-sm shadow-emerald-100/30'}>
              <CardContent className="p-5">
                <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black'}`}>Net Savings</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.finalAmount)}</p>
              </CardContent>
            </Card>
            
            <Card className={isDark ? 'bg-fuchsia-950/40 border-fuchsia-900/50 relative overflow-hidden' : 'bg-fuchsia-100/90 border-fuchsia-300 shadow-sm shadow-fuchsia-100/30 relative overflow-hidden'}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-fuchsia-400 font-bold' : 'text-fuchsia-800 font-black'}`}>Profit Taken</p>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(profitTaken)}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-8 w-8 rounded-full ${isDark ? 'bg-fuchsia-900/50 border-fuchsia-700/50 hover:bg-fuchsia-800/50 text-fuchsia-300' : 'bg-fuchsia-200 border-fuchsia-300 hover:bg-fuchsia-300 text-fuchsia-900'}`}
                    onClick={() => setShowProfitModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-indigo-100/90 border-indigo-300 shadow-sm shadow-indigo-100/30'}>
              <CardContent className="p-5">
                <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-indigo-400 font-bold' : 'text-indigo-800 font-black'}`}>Retained Earnings</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(retainedEarnings)}</p>
              </CardContent>
            </Card>
          </>
        )}

      </div>

      <Card className={isDark ? 'bg-slate-900/40 border-slate-850/60' : 'bg-slate-50 border-slate-200 shadow-inner'}>
        <CardContent className="p-5 flex flex-wrap gap-6 divide-x divide-slate-200/80 dark:divide-slate-800/40">
          <div>
            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? 'text-cyan-400 font-bold' : 'text-cyan-800 font-black'}`}>Total Stick Sold</p>
            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.stickSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>
          </div>
          <div className="pl-4">
            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? 'text-purple-400 font-bold' : 'text-purple-800 font-black'}`}>Total Pot Sold</p>
            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.potSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && isOwner && (
        <Card>
          <CardContent className="p-5 pt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#334155', fontWeight: 'bold'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#334155', fontWeight: 'bold'}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{borderRadius: '16px', border: isDark ? '1px solid #1e293b' : '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontWeight: 'bold'}} itemStyle={{color: isDark ? '#22d3ee' : '#0891b2'}} />
                <Line type="monotone" dataKey="revenue" stroke={isDark ? '#22d3ee' : '#0891b2'} strokeWidth={4} dot={false} style={{ filter: isDark ? 'drop-shadow(0px 0px 8px rgba(34,211,238,0.5))' : 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setActiveListTab('entries')}
          className={`flex-1 min-w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
            activeListTab === 'entries' 
              ? isDark ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg' : 'bg-cyan-50 border-cyan-200 shadow-md' 
              : isDark ? 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
          }`}
        >
          <div className="relative z-10">
            <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              activeListTab === 'entries' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500'
            }`}>Daily Entries</h3>
            <p className={`text-lg font-black ${
              activeListTab === 'entries' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
            }`}>{filteredEntries.length} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Records</span></p>
          </div>
        </button>

        {isOwner && (
          <button 
            onClick={() => setActiveListTab('expenses')}
            className={`flex-1 min-w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
              activeListTab === 'expenses' 
                ? isDark ? 'bg-pink-500/20 border-pink-500/50 shadow-lg' : 'bg-pink-50 border-pink-200 shadow-md' 
                : isDark ? 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="relative z-10">
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                activeListTab === 'expenses' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-500'
              }`}>Other Expenses</h3>
              <p className={`text-lg font-black ${
                activeListTab === 'expenses' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>{filteredExpenses.length} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Records</span></p>
            </div>
          </button> )}
          {isOwner && (
          <button 
            onClick={() => setActiveListTab('specials')}
            className={`flex-1 min-w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
              activeListTab === 'specials' 
                ? isDark ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg' : 'bg-indigo-50 border-indigo-200 shadow-md' 
                : isDark ? 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="relative z-10">
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                activeListTab === 'specials' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
              }`}>Event Orders</h3>
              <p className={`text-lg font-black ${
                activeListTab === 'specials' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>{filteredSpecials.length} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Records</span></p>
            </div>
          </button>
        )}
        {isOwner && (
          <button 
            onClick={() => setActiveListTab('profits')}
            className={`flex-1 min-w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
              activeListTab === 'profits' 
                ? isDark ? 'bg-fuchsia-500/20 border-fuchsia-500/50 shadow-lg' : 'bg-fuchsia-50 border-fuchsia-200 shadow-md' 
                : isDark ? 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="relative z-10">
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                activeListTab === 'profits' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-500'
              }`}>Profit Taken</h3>
              <p className={`text-lg font-black ${
                activeListTab === 'profits' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>{filteredProfits.length} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Records</span></p>
            </div>
          </button>
        )}
      </div>

      {activeListTab === 'specials' && isOwner && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowSpecialModal(true)} className="gap-2 h-10 rounded-xl px-4 text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Log Event Order
          </Button>
        </div>
      )}


      {activeListTab === 'entries' && (
        <div>
          {filteredEntries.length === 0 ? (
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No entries for this month.</p>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(entry.date), 'dd MMM yyyy')}</span>
                        {(() => {
                          const denoms = getEntryDenominations(entry, dailyDenominationsMap);
                          const total = getDenomTotal(denoms);
                          if (total > 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                <Coins className="w-2.5 h-2.5" />
                                <span>Denom: ₹{total.toLocaleString('en-IN')}</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3">
                        {isOwner && (
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rev</p>
                             <p className="font-black text-sm text-cyan-600 dark:text-cyan-400">{formatCurrency(Math.max(0, entry.actualAmount - (entry.cashBagLoaded || 0) + (entry.expenses || 0) + (entry.additionalExpenses || 0) + (entry.bonus || 0)))}</p>
                          </div>
                        )}
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exp</p>
                           <p className="font-black text-sm text-pink-500">{formatCurrency((entry.expenses || 0) + (entry.additionalExpenses || 0) + (entry.bonus || 0))}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Sold</p>
                           <p className="font-black text-sm text-amber-500">{entry.stickSold || 0}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Sold</p>
                           <p className="font-black text-sm text-purple-500">{entry.potSold || 0}</p>
                        </div>
                      </div>
                    </div>
                    {isOwner ? (
                      deleteConfirmId === entry.id ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                          <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDelete(entry.id)}>Delete</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" title="Share on WhatsApp" className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-full" onClick={() => setWhatsAppEntryToShare(entry)}>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(entry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEdit(entry.date)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setDeleteConfirmId(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" title="Share on WhatsApp" className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-full" onClick={() => setWhatsAppEntryToShare(entry)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEdit(entry.date)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {entry.expenseDetails && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Expense Details</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{entry.expenseDetails}</p>
                    </div>
                  )}
                  {entry.notes && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{entry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      )}

      {isOwner && activeListTab === 'expenses' && (
        <div>
          {filteredExpenses.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No expenses for this month.</p>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map(expense => (
                <Card key={expense.id} className="border-red-100 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(expense.date), 'dd MMM yyyy')}</span>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                             <p className="font-black text-sm text-pink-500">{formatCurrency(expense.amount)}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">By</p>
                             <p className="font-black text-sm text-slate-700 dark:text-slate-300">{expense.paidBy}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {expenseDeleteConfirmId === expense.id ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick={() => setExpenseDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditExpense(expense)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setExpenseDeleteConfirmId(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-100/60 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 mt-4">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">{expense.category}</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{expense.notes || 'No notes'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {isOwner && activeListTab === 'profits' && (
        <div>
          {filteredProfits.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No profit records for this month.</p>
          ) : (
            <div className="space-y-4">
              {filteredProfits.map(profit => (
                <Card key={profit.id} className="border-fuchsia-100 dark:border-fuchsia-900/50 bg-fuchsia-50/60 dark:bg-fuchsia-950/20">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(profit.date), 'dd MMM yyyy')}</span>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                             <p className="font-black text-sm text-fuchsia-500">{formatCurrency(profit.amount)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {profitDeleteConfirmId === profit.id ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick={() => setProfitDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDeleteProfit(profit.id)}>Delete</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry({ ...profit, _isProfit: true })}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditProfit(profit)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setProfitDeleteConfirmId(profit.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {profit.notes && (
                      <div className="bg-slate-100/60 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 mt-4">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{profit.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {isOwner && activeListTab === 'specials' && (
        <div>
          {filteredSpecials.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No event orders for this month.</p>
          ) : (
            <div className="space-y-4">
              {filteredSpecials.map(order => (
                <Card key={order.id} className="border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(order.date), 'dd MMM yyyy')}</span>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                             <p className="font-black text-sm text-cyan-500">{formatCurrency(order.amountReceived)}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</p>
                             <p className="font-black text-sm text-slate-700 dark:text-slate-300">{order.eventType}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sticks</p>
                             <p className="font-black text-sm text-amber-500">{order.stickQuantity || 0}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pots</p>
                             <p className="font-black text-sm text-purple-500">{order.potQuantity || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {specialDeleteConfirmId === order.id ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick={() => setSpecialDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDeleteSpecial(order)}>Delete</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditSpecial(order)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setSpecialDeleteConfirmId(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {order.notes && (
                      <div className="bg-slate-100/60 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 mt-4">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{order.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewEntry(null)}>
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {viewEntry.eventType ? 'Event Order Details' : viewEntry._isProfit ? 'Profit Details' : viewEntry.category ? 'Expense Details' : 'Entry Details'}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setViewEntry(null)}>
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {viewEntry._isProfit ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount Taken</p>
                      <p className={`font-black text-sm text-fuchsia-500`}>{formatCurrency(viewEntry.amount)}</p>
                    </div>
                  </div>
                  {viewEntry.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{viewEntry.notes}</p>
                    </div>
                  )}
                </>
              ) : viewEntry.eventType ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Type</p>
                      <p className={`font-black text-sm text-indigo-500`}>{viewEntry.eventType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount Received</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.amountReceived)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Inventory Deducted</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-amber-500/10 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Sticks</p>
                        <p className={`font-black text-xs text-amber-600 dark:text-amber-400`}>{viewEntry.stickQuantity}</p>
                      </div>
                      <div className="bg-purple-500/10 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Pots</p>
                        <p className={`font-black text-xs text-purple-600 dark:text-purple-400`}>{viewEntry.potQuantity}</p>
                      </div>
                    </div>
                  </div>
                  {viewEntry.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{viewEntry.notes}</p>
                    </div>
                  )}
                </>
              ) : viewEntry.category ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                      <p className={`font-black text-sm text-pink-500`}>{viewEntry.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid By</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEntry.paidBy}</p>
                    </div>
                  </div>
                  {viewEntry.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{viewEntry.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Sales</p>
                      <p className={`font-black text-sm text-cyan-500`}>{formatCurrency(viewEntry.actualAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Inventory Details</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Stick Load</p>
                        <p className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEntry.stickLoaded}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Stick Bal</p>
                        <p className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEntry.stickBalance}</p>
                      </div>
                      <div className="bg-cyan-500/10 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Stick Sold</p>
                        <p className={`font-black text-xs text-cyan-600 dark:text-cyan-400`}>{viewEntry.stickSold}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pot Load</p>
                        <p className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEntry.potLoaded}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pot Bal</p>
                        <p className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEntry.potBalance}</p>
                      </div>
                      <div className="bg-pink-500/10 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase">Pot Sold</p>
                        <p className={`font-black text-xs text-pink-600 dark:text-pink-400`}>{viewEntry.potSold}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Financial Breakdown</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required Amt</p>
                        <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.requiredAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discount</p>
                        <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.discount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PhonePe</p>
                        <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.phonePe)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shortage</p>
                        <p className={`font-black text-sm ${viewEntry.shortage > 0 ? 'text-pink-500' : isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.shortage)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Bag Loaded</p>
                        <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.cashBagLoaded)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Bag Total</p>
                        <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(viewEntry.cashBagTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bonus</p>
                        <p className={`font-black text-sm text-amber-500`}>{formatCurrency(viewEntry.bonus)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Handover</p>
                        <p className={`font-black text-sm text-emerald-500`}>{formatCurrency(viewEntry.finalAmount)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Physical Cash Denominations Breakdown */}
                  {(() => {
                    const denoms = getEntryDenominations(viewEntry, dailyDenominationsMap);
                    const total = getDenomTotal(denoms);
                    if (!denoms || total === 0) return null;
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Physical Cash Denominations</span>
                          </p>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            Total Counted: ₹{total.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Number(denoms.n500) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹500 × {denoms.n500}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n500 * 500).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.n200) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹200 × {denoms.n200}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n200 * 200).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.n100) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹100 × {denoms.n100}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n100 * 100).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.n50) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹50 × {denoms.n50}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n50 * 50).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.n20) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹20 × {denoms.n20}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n20 * 20).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.n10) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                              <span className="text-[10px] font-bold text-slate-500">₹10 × {denoms.n10}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(denoms.n10 * 10).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(denoms.coins) > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs col-span-2 sm:col-span-1">
                              <span className="text-[10px] font-bold text-slate-500">Coins / Others</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{Number(denoms.coins).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {viewEntry.expenseDetails && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Expense Details</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{viewEntry.expenseDetails}</p>
                    </div>
                  )}
                  {viewEntry.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{viewEntry.notes}</p>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setWhatsAppEntryToShare(viewEntry)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Share on WhatsApp</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className={`w-full max-w-md max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{specialEditId ? 'Edit Event Order' : 'Log Event / Bulk Order'}</h2>
                <Button variant="ghost" size="sm" onClick={() => { setShowSpecialModal(false); setSpecialEditId(null); setSpecialOldOrder(null); setSpecialForm({ eventType: 'Event', stickQuantity: '', potQuantity: '', plateQuantity: '', amountReceived: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') }); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={specialForm.date} 
                    onChange={(e) => setSpecialForm({...specialForm, date: e.target.value})}
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Input 
                    type="text" 
                    value={specialForm.eventType} 
                    onChange={(e) => setSpecialForm({...specialForm, eventType: e.target.value})}
                    placeholder="e.g. Birthday, Marriage"
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sticks Taken</Label>
                    <Input 
                      type="number" 
                      value={specialForm.stickQuantity} 
                      onChange={(e) => setSpecialForm({...specialForm, stickQuantity: e.target.value})}
                      placeholder="e.g. 50"
                      className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                    />
                  </div>
                  <div>
                    <Label>Pots Taken</Label>
                    <Input 
                      type="number" 
                      value={specialForm.potQuantity} 
                      onChange={(e) => setSpecialForm({...specialForm, potQuantity: e.target.value})}
                      placeholder="e.g. 20"
                      className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                    />
                  </div>
                  <div>
                    <Label>Plates Taken</Label>
                    <Input 
                      type="number" 
                      value={specialForm.plateQuantity} 
                      onChange={(e) => setSpecialForm({...specialForm, plateQuantity: e.target.value})}
                      placeholder="e.g. 20"
                      className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <Label>Amount Received (₹)</Label>
                  <Input 
                    type="number" 
                    value={specialForm.amountReceived} 
                    onChange={(e) => setSpecialForm({...specialForm, amountReceived: e.target.value})}
                    placeholder="e.g. 5000"
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input 
                    type="text" 
                    value={specialForm.notes} 
                    onChange={(e) => setSpecialForm({...specialForm, notes: e.target.value})}
                    placeholder="Any specific details"
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <Button className="w-full mt-4" onClick={handleSpecialSubmit}>
                  {specialEditId ? 'Update Event Order' : 'Save Event Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {showProfitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className={`w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profitEditId ? 'Edit Profit Taken' : 'Log Profit Taken'}</h2>
                <Button variant="ghost" size="sm" onClick={() => { setShowProfitModal(false); setProfitEditId(null); setProfitForm({ amount: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') }); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={profitForm.date} 
                    onChange={(e) => setProfitForm({...profitForm, date: e.target.value})}
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={profitForm.amount} 
                    onChange={(e) => setProfitForm({...profitForm, amount: e.target.value})}
                    placeholder="e.g. 10000"
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input 
                    type="text" 
                    value={profitForm.notes} 
                    onChange={(e) => setProfitForm({...profitForm, notes: e.target.value})}
                    placeholder="e.g. Monthly withdrawal"
                    className={`mt-1 ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
                  />
                </div>
                <Button className="w-full mt-4" onClick={handleProfitSubmit}>
                  {profitEditId ? 'Update Profit Record' : 'Save Profit Record'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Export CSV / Excel Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          entries={entries}
          expenses={expenses}
          profitWithdrawals={profitWithdrawals}
          specialOrders={specialOrders}
          inventory={inventory}
          settings={settings}
          currentDate={currentDate}
        />
      )}

      {/* WhatsApp Daily Closing Summary Modal */}
      {whatsAppEntryToShare && (
        <WhatsAppSummaryModal
          isOpen={!!whatsAppEntryToShare}
          onClose={() => setWhatsAppEntryToShare(null)}
          entry={whatsAppEntryToShare}
          inventory={inventory}
          settings={settings}
        />
      )}

    </div>
  );
}