import React, { useState, useMemo } from 'react';
import { useEntries, deleteEntry, useExpenses, deleteExpense } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { formatCurrency } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Trash2, Edit2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

import { ExpenseEntry } from '../types';
export default function Reports({ role = 'owner', onEdit, onEditExpense }: { role?: 'owner' | 'manager', onEdit: (date: string) => void, onEditExpense: (expense: ExpenseEntry) => void }) {
  const isOwner = role === 'owner';
  const { entries, loading, reload } = useEntries();
  const { expenses, loading: expensesLoading, reload: reloadExpenses } = useExpenses();
  const [expenseDeleteConfirmId, setExpenseDeleteConfirmId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { filteredEntries, filteredExpenses, chartData, totals } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    const filteredExps = expenses.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => b.date.localeCompare(a.date));

    const filtered = entries.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => b.date.localeCompare(a.date));

    const chartData = [...filtered].reverse().map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      revenue: Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0)),
    }));

    const totals = filtered.reduce(
      (acc, e) => {
        const netSales = e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
        const totalExp = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
        acc.revenue += netSales;
        acc.expenses += totalExp;
        acc.shortage += (e.shortage || 0);
        acc.finalAmount += (netSales - totalExp);
        acc.stickSold += (e.stickSold || 0);
        acc.potSold += (e.potSold || 0);
        return acc;
      },
      { revenue: 0, expenses: 0, shortage: 0, finalAmount: 0, stickSold: 0, potSold: 0 }
    );
    
    // Add standalone expenses to totals for owner only
    if (isOwner) {
      filteredExps.forEach(exp => {
          totals.expenses += exp.amount;
          totals.finalAmount -= exp.amount;
      });
    }


    return { filteredEntries: filtered, filteredExpenses: filteredExps, chartData, totals };
  }, [entries, expenses, currentDate]);

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
    if (filteredEntries.length === 0) return;
    
    const headers = ['Date', 'Stick Sold', 'Pot Sold', 'Total Revenue', 'Expenses', 'Expense Details', 'Net Amount', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(e => [
        e.date,
        e.stickSold,
        e.potSold,
        e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0),
        (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0),
        `"${(e.expenseDetails || '').replace(/"/g, '""')}"`,
        (e.actualAmount - (e.cashBagLoaded || 0)),
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${format(currentDate, 'MMM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Loading reports...</div>;

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">Reports</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 rounded-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-white dark:hover:bg-slate-800">&lt;</Button>
          <span className="text-xs font-black tracking-wider uppercase w-24 text-center text-slate-700 dark:text-slate-200">{format(currentDate, 'MMM yyyy')}</span>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 rounded-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-white dark:hover:bg-slate-800">&gt;</Button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportCSV} 
          className="bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100/60 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800 dark:hover:bg-cyan-900/50 dark:hover:text-cyan-300 font-bold"
          disabled={filteredEntries.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

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
          <Card className={isDark ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-emerald-100/90 border-emerald-300 shadow-sm shadow-emerald-100/30'}>
            <CardContent className="p-5">
              <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black'}`}>Net Savings</p>
              <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.finalAmount)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className={isDark ? 'bg-slate-900/40 border-slate-850/60' : 'bg-slate-50 border-slate-200 shadow-inner'}>
        <CardContent className="p-5 grid grid-cols-2 gap-4 divide-x divide-slate-200/80 dark:divide-slate-800/40">
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

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Daily Entries</h3>
        {filteredEntries.length === 0 ? (
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No entries for this month.</p>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(entry.date), 'dd MMM yyyy')}</span>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3">
                        {isOwner && (
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rev</p>
                             <p className="font-black text-sm text-cyan-600 dark:text-cyan-400">{formatCurrency(entry.actualAmount - (entry.cashBagLoaded || 0) + (entry.expenses || 0) + (entry.additionalExpenses || 0) + (entry.bonus || 0))}</p>
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
                    {deleteConfirmId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDelete(entry.id)}>Delete</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEdit(entry.date)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setDeleteConfirmId(entry.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {isOwner && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 mt-8">Other Expenses</h3>
          {filteredExpenses.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">No expenses for this month.</p>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map(expense => (
                <Card key={expense.id} className="border-red-100 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{format(parseISO(expense.date), 'dd MMM yyyy')}</span>
                        <div className="flex items-center gap-4 mt-3">
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
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditExpense(expense)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {expenseDeleteConfirmId === expense.id ? (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick={() => setExpenseDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setExpenseDeleteConfirmId(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
