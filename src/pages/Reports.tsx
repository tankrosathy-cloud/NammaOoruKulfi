import React, { useState, useMemo } from 'react';
import { useEntries, deleteEntry } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { formatCurrency } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Trash2, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports({ onEdit }: { onEdit: (date: string) => void }) {
  const { entries, loading, reload } = useEntries();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { filteredEntries, chartData, totals } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

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
      revenue: Math.max(0, e.actualAmount - (e.cashBagLoaded || 0)),
    }));

    const totals = filtered.reduce(
      (acc, e) => {
        const netSales = e.actualAmount - (e.cashBagLoaded || 0);
        const totalExp = (e.expenses || 0) + (e.bonus || 0);
        acc.revenue += netSales;
        acc.expenses += totalExp;
        acc.shortage += (e.shortage || 0);
        acc.finalAmount += (netSales - totalExp);
        return acc;
      },
      { revenue: 0, expenses: 0, shortage: 0, finalAmount: 0 }
    );

    return { filteredEntries: filtered, chartData, totals };
  }, [entries, currentDate]);

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    setDeleteConfirmId(null);
    reload();
  };

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => subMonths(prev, -1));

  if (loading) return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading reports...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">Reports</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 rounded-full border-slate-700 bg-slate-800 text-white">&lt;</Button>
          <span className="text-xs font-black tracking-wider uppercase w-24 text-center text-slate-200">{format(currentDate, 'MMM yyyy')}</span>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 rounded-full border-slate-700 bg-slate-800 text-white">&gt;</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-cyan-950/40 border-cyan-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Total Revenue</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-pink-950/40 border-pink-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Total Expenses</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totals.expenses)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-950/40 border-purple-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Total Shortage</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totals.shortage)}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-950/40 border-emerald-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Net Savings</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totals.finalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-5 pt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontWeight: 'bold'}} itemStyle={{color: '#22d3ee'}} />
                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={4} dot={false} style={{ filter: 'drop-shadow(0px 0px 8px rgba(34,211,238,0.5))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Daily Entries</h3>
        {filteredEntries.length === 0 ? (
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center py-6 bg-slate-900/50 rounded-3xl border border-slate-800">No entries for this month.</p>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <Card key={entry.id} className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-black text-sm uppercase tracking-wider text-white">{format(parseISO(entry.date), 'dd MMM yyyy')}</span>
                      <div className="flex items-center gap-4 mt-3">
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rev</p>
                           <p className="font-black text-sm text-cyan-400">{formatCurrency(entry.actualAmount - (entry.cashBagLoaded || 0))}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exp</p>
                           <p className="font-black text-sm text-pink-500">{formatCurrency((entry.expenses || 0) + (entry.bonus || 0))}</p>
                        </div>
                      </div>
                    </div>
                    {deleteConfirmId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-slate-400" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700" onClick={() => handleDelete(entry.id)}>Delete</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full" onClick={() => onEdit(entry.date)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setDeleteConfirmId(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Notes</p>
                      <p className="text-xs font-medium text-slate-300 leading-snug uppercase">{entry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
