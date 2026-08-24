import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RotateCcw,
  Check,
  Calendar
} from 'lucide-react';
import { Denominations } from '../types';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';

interface CashReconciliationCardProps {
  date?: string;
  cashBagLoaded: number;
  expectedSales: number;
  discount: number;
  phonePe: number;
  platformRent: number;
  additionalExpenses: number;
  bonus: number;
  cashBagTotal: number;
  denominations?: Denominations;
  onDenominationsChange?: (denoms: Denominations) => void;
  onApplyCashBagTotal: (total: number) => void;
}

const DEFAULT_DENOMS: Denominations = {
  n500: 0,
  n200: 0,
  n100: 0,
  n50: 0,
  n20: 0,
  n10: 0,
  coins: 0
};

export default function CashReconciliationCard({
  date,
  cashBagLoaded,
  expectedSales,
  discount,
  phonePe,
  platformRent,
  additionalExpenses,
  bonus,
  cashBagTotal,
  denominations,
  onDenominationsChange,
  onApplyCashBagTotal
}: CashReconciliationCardProps) {
  // Use passed denominations or local state
  const [localDenoms, setLocalDenoms] = useState<Denominations>(denominations || DEFAULT_DENOMS);
  const [showDenomCalculator, setShowDenomCalculator] = useState(false);
  const [appliedInfo, setAppliedInfo] = useState<{ amount: number; message: string; timestamp: number } | null>(null);

  // Sync when prop changes (e.g. date switch in parent)
  useEffect(() => {
    if (denominations) {
      setLocalDenoms(denominations);
    }
  }, [denominations]);

  const denoms = denominations || localDenoms;

  // Calculate Cash Sales collected from customers
  const grossSales = Math.max(0, expectedSales - discount);
  const expectedCashSales = Math.max(0, grossSales - phonePe);
  const totalDeductions = platformRent + additionalExpenses + bonus;

  // Expected physical cash in bag at closing
  const expectedPhysicalCash = cashBagLoaded + expectedCashSales - totalDeductions;
  const cashDiscrepancy = cashBagTotal - expectedPhysicalCash;

  // Calculate sum from denomination counter
  const countedFromDenoms = 
    ((denoms.n500 || 0) * 500) +
    ((denoms.n200 || 0) * 200) +
    ((denoms.n100 || 0) * 100) +
    ((denoms.n50 || 0) * 50) +
    ((denoms.n20 || 0) * 20) +
    ((denoms.n10 || 0) * 10) +
    (denoms.coins || 0);

  const hasAnyDenoms = countedFromDenoms > 0;

  const handleDenomChange = (key: keyof Denominations, valStr: string) => {
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    const val = parseInt(cleanStr) || 0;
    const updated = { ...denoms, [key]: Math.max(0, val) };
    
    if (onDenominationsChange) {
      onDenominationsChange(updated);
    } else {
      setLocalDenoms(updated);
    }
  };

  const handleResetDenoms = () => {
    const zeroed = { ...DEFAULT_DENOMS };
    if (onDenominationsChange) {
      onDenominationsChange(zeroed);
    } else {
      setLocalDenoms(zeroed);
    }
    setAppliedInfo(null);
  };

  const handleApplyCounted = () => {
    onApplyCashBagTotal(countedFromDenoms);
    setAppliedInfo({
      amount: countedFromDenoms,
      message: `Successfully applied ₹${countedFromDenoms.toLocaleString('en-IN')} to Cash Bag Total (END)`,
      timestamp: Date.now()
    });

    // Auto-clear notification after 6 seconds
    setTimeout(() => {
      setAppliedInfo(prev => (prev && Date.now() - prev.timestamp >= 5500 ? null : prev));
    }, 6000);
  };

  let formattedDateStr = '';
  if (date) {
    try {
      formattedDateStr = format(parseISO(date), 'dd MMM yyyy');
    } catch {
      formattedDateStr = date;
    }
  }

  return (
    <Card className="border border-slate-300 dark:border-slate-800 shadow-sm bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/60 dark:to-slate-950 overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  Cash Bag Reconciliation
                </h4>
                {formattedDateStr && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {formattedDateStr}
                  </span>
                )}
                {cashBagTotal > 0 && (
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    cashDiscrepancy === 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : cashDiscrepancy < 0
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>
                    {cashDiscrepancy === 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Balanced
                      </>
                    ) : cashDiscrepancy < 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Short ₹{Math.abs(cashDiscrepancy)}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Excess +₹{cashDiscrepancy}
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Audit expected physical cash in cart bag vs actual closing count
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {hasAnyDenoms && !showDenomCalculator && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Counted: ₹{countedFromDenoms.toLocaleString('en-IN')}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDenomCalculator(!showDenomCalculator)}
              className="h-8 text-[10px] font-black uppercase tracking-wider rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {showDenomCalculator ? 'Hide Currency Counter' : 'Open Currency Counter'}
              {showDenomCalculator ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Step by Step Reconciliation Math */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="bg-slate-100/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Float Start</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">₹{cashBagLoaded}</span>
            <span className="text-[8px] text-slate-400 font-bold block">Cash Bag Loaded</span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">2. Cash Sales</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">+₹{expectedCashSales}</span>
            <span className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 font-bold block">(₹{grossSales} − ₹{phonePe} UPI)</span>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
            <span className="text-[8px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block">3. Paid on Cart</span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-400 mt-0.5 block">−₹{totalDeductions}</span>
            <span className="text-[8px] text-rose-600/70 dark:text-rose-400/70 font-bold block">(Rent/Exp/Bonus)</span>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800">
            <span className="text-[8px] font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-wider block">4. Expected In Hand</span>
            <span className="text-base font-black text-cyan-900 dark:text-cyan-300 mt-0.5 block">₹{expectedPhysicalCash}</span>
            <span className="text-[8px] text-cyan-700/70 dark:text-cyan-400/70 font-bold block">Bag Target Cash</span>
          </div>
        </div>

        {/* Confirmation Banner if amount was applied to cash bag */}
        {appliedInfo && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  Applied ₹{appliedInfo.amount.toLocaleString('en-IN')} to Cash Bag Total (END)!
                </p>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  The closing Cash Bag Total field has been successfully updated with the counted physical currencies.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAppliedInfo(null)}
              className="h-7 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/60 px-2 rounded-lg cursor-pointer shrink-0"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Interactive Denomination Counter Drawer */}
        {showDenomCalculator && (
          <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Denomination Currency Counter {formattedDateStr ? `(${formattedDateStr})` : ''}
                </h5>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetDenoms}
                className="h-6 text-[9px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 px-2 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 500 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹500 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n500 || 0) * 500).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n500 || ''}
                  onChange={e => handleDenomChange('n500', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* 200 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹200 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n200 || 0) * 200).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n200 || ''}
                  onChange={e => handleDenomChange('n200', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* 100 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹100 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n100 || 0) * 100).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n100 || ''}
                  onChange={e => handleDenomChange('n100', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* 50 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹50 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n50 || 0) * 50).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n50 || ''}
                  onChange={e => handleDenomChange('n50', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* 20 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹20 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n20 || 0) * 20).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n20 || ''}
                  onChange={e => handleDenomChange('n20', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* 10 */}
              <div className="space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">₹10 ×</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{((denoms.n10 || 0) * 10).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={denoms.n10 || ''}
                  onChange={e => handleDenomChange('n10', e.target.value)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              {/* Coins & Others */}
              <div className="col-span-2 space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-600 dark:text-slate-400">Coins & ₹5 notes (Total ₹)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{(denoms.coins || 0).toLocaleString('en-IN')}</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Amount in coins"
                  value={denoms.coins || ''}
                  onChange={e => handleDenomChange('coins', e.target.value)}
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>

            {/* Total Counted Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs">
                <span className="font-bold text-slate-500">Total Counted: </span>
                <span className="font-black text-base text-slate-900 dark:text-white">
                  ₹{countedFromDenoms.toLocaleString('en-IN')}
                </span>
                {countedFromDenoms !== expectedPhysicalCash && (
                  <span className={`text-[10px] font-bold ml-2 ${
                    countedFromDenoms > expectedPhysicalCash ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'
                  }`}>
                    ({countedFromDenoms > expectedPhysicalCash ? `+₹${countedFromDenoms - expectedPhysicalCash} excess` : `−₹${expectedPhysicalCash - countedFromDenoms} short`})
                  </span>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleApplyCounted}
                className={`text-[10px] font-black uppercase h-9 px-4 rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5 ${
                  appliedInfo && Date.now() - appliedInfo.timestamp < 3000
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {appliedInfo && Date.now() - appliedInfo.timestamp < 3000 ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Applied ₹{countedFromDenoms.toLocaleString('en-IN')}!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply ₹{countedFromDenoms.toLocaleString('en-IN')} to Cash Bag</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
