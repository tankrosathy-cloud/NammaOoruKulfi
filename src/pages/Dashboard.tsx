import React, { useMemo } from 'react';
import { useEntries, useSettings } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Package, AlertCircle } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function Dashboard() {
  const { entries, loading } = useEntries();
  const { settings } = useSettings();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const stats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    
    const monthlyEntries = entries.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
      } catch {
        return false;
      }
    });

    const monthlyRevenue = monthlyEntries.reduce((sum, e) => sum + (e.actualAmount - (e.cashBagLoaded || 0)), 0);
    const monthlyExpenses = monthlyEntries.reduce((sum, e) => sum + (e.expenses || 0) + (e.bonus || 0), 0);
    
    return {
      latest,
      monthlyRevenue,
      monthlyExpenses,
      monthlyNet: monthlyRevenue - monthlyExpenses,
    };
  }, [entries]);

  if (loading) return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading dashboard...</div>;

  const latest = stats.latest;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">Overview</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monthly performance & current inventory</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-black leading-none text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pink-500" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-black leading-none text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">{formatCurrency(stats.monthlyExpenses)}</div>
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      {latest ? (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <CardHeader className="p-6 border-b border-slate-800/60 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" /> Latest Inventory
              </CardTitle>
              <span className="text-[10px] font-bold text-cyan-100 bg-cyan-900/30 border border-cyan-800 px-3 py-1.5 rounded-full uppercase tracking-wider">
                {format(parseISO(latest.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 text-white">
            <div className="divide-y divide-slate-800/60">
              <InventoryRow label="Stick Kulfi" loaded={latest.stickLoaded} balance={latest.stickBalance} sold={latest.stickSold} color="cyan" />
              <InventoryRow label="Plate Kulfi" loaded={latest.plateLoaded} balance={latest.plateBalance} sold={latest.plateSold} color="purple" />
              <InventoryRow label="Pot Kulfi" loaded={latest.potLoaded} balance={latest.potBalance} sold={latest.potSold} color="pink" />
            </div>
            
            <div className="p-6 bg-slate-950/50 rounded-b-3xl border-t border-slate-800/60 grid grid-cols-2 gap-4">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Sales</p>
                 <p className="font-black text-lg text-cyan-400">{formatCurrency(latest.actualAmount - latest.cashBagLoaded)}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PhonePe Amount</p>
                 <p className="font-black text-lg text-white">{formatCurrency(latest.phonePe)}</p>
               </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
            No entries found. Add an entry to see inventory stats.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InventoryRow({ label, loaded, balance, sold, color }: { label: string, loaded: number, balance: number, sold: number, color: string }) {
  const colorClass = color === 'cyan' ? 'text-cyan-400' : color === 'purple' ? 'text-purple-400' : 'text-pink-400';
  return (
    <div className="flex justify-between items-center p-5">
      <span className="font-black text-sm uppercase tracking-wider text-slate-200">{label}</span>
      <div className="flex gap-6 text-right">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Loaded</span>
          <span className="font-black text-sm text-white">{loaded || 0}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bal</span>
          <span className="font-black text-sm text-slate-300">{balance || 0}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sold</span>
          <span className={`font-black text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${colorClass}`}>{sold || 0}</span>
        </div>
      </div>
    </div>
  );
}
