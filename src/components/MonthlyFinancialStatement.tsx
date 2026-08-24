import React, { useState, useMemo } from 'react';
import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, Settings } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { 
  Printer, 
  Download, 
  X, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  Users, 
  Coins, 
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Logo } from './Logo';

interface MonthlyFinancialStatementProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyEntry[];
  expenses: ExpenseEntry[];
  profitWithdrawals: ProfitWithdrawal[];
  specialOrders: SpecialOrder[];
  settings: Settings;
  initialDate?: Date;
}

export default function MonthlyFinancialStatement({
  isOpen,
  onClose,
  entries,
  expenses,
  profitWithdrawals,
  specialOrders,
  settings,
  initialDate = new Date()
}: MonthlyFinancialStatementProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialDate);

  const stickPrice = settings?.stickPrice || 40;
  const potPrice = settings?.potPrice || 50;

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => subMonths(prev, -1));

  // Compute month's financial dataset
  const statementData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    // Filtered records
    const monthEntries = entries.filter(e => {
      try {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => a.date.localeCompare(b.date));

    const monthExpenses = expenses.filter(e => {
      try {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => a.date.localeCompare(b.date));

    const monthProfits = profitWithdrawals.filter(e => {
      try {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => a.date.localeCompare(b.date));

    const monthSpecials = specialOrders.filter(e => {
      try {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Daily Sales Rollup
    let dailyStickSold = 0;
    let dailyPotSold = 0;
    let dailyPhonePeTotal = 0;
    let dailyCashBagTotal = 0;
    let dailyCashBagLoaded = 0;
    let dailyDiscounts = 0;
    let dailyCartExpenses = 0;
    let dailyShortage = 0;
    let dailyNetSales = 0;

    monthEntries.forEach(e => {
      dailyStickSold += e.stickSold || 0;
      dailyPotSold += e.potSold || 0;
      dailyPhonePeTotal += e.phonePe || 0;
      dailyCashBagTotal += e.cashBagTotal || 0;
      dailyCashBagLoaded += e.cashBagLoaded || 0;
      dailyDiscounts += e.discount || 0;
      dailyCartExpenses += (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      dailyShortage += e.shortage || 0;

      const dayRevenue = Math.max(
        0,
        (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0)
      );
      dailyNetSales += dayRevenue;
    });

    // Special Event Orders Rollup
    let specialStickSold = 0;
    let specialPotSold = 0;
    let specialRevenue = 0;

    monthSpecials.forEach(order => {
      specialStickSold += order.stickQuantity || 0;
      specialPotSold += order.potQuantity || 0;
      specialRevenue += order.amountReceived || 0;
    });

    // Combined Totals
    const totalStickSold = dailyStickSold + specialStickSold;
    const totalPotSold = dailyPotSold + specialPotSold;
    const grossSalesRevenue = dailyNetSales + specialRevenue;

    // Expenses Rollup
    let businessExpensesTotal = 0;
    const expenseByCategory: Record<string, number> = {};

    monthExpenses.forEach(exp => {
      businessExpensesTotal += exp.amount;
      const cat = exp.category || 'General Operations';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amount;
    });

    if (dailyCartExpenses > 0) {
      expenseByCategory['Daily Cart Ops & Rent'] = (expenseByCategory['Daily Cart Ops & Rent'] || 0) + dailyCartExpenses;
    }

    const totalOperatingExpenses = businessExpensesTotal + dailyCartExpenses;
    const netOperatingProfit = grossSalesRevenue - totalOperatingExpenses;

    // Profit Distributions (50/50 Split)
    const totalProfitWithdrawn = monthProfits.reduce((sum, p) => sum + p.amount, 0);
    const retainedEarnings = netOperatingProfit - totalProfitWithdrawn;

    const yuvarajShare = Math.round(netOperatingProfit * 0.5);
    const sebastinShare = netOperatingProfit - yuvarajShare;

    // Physical Cash collected from cart handovers
    const totalCashHandover = Math.max(0, dailyCashBagTotal - dailyCashBagLoaded);

    return {
      periodName: format(selectedMonth, 'MMMM yyyy'),
      statementId: `NOK-${format(selectedMonth, 'yyyyMM')}`,
      generatedDate: format(new Date(), 'dd MMMM yyyy, h:mm a'),
      operatingDaysCount: monthEntries.length,
      
      // Products
      dailyStickSold,
      specialStickSold,
      totalStickSold,
      stickRevenue: totalStickSold * stickPrice,
      
      dailyPotSold,
      specialPotSold,
      totalPotSold,
      potRevenue: totalPotSold * potPrice,

      specialOrdersCount: monthSpecials.length,
      specialRevenue,

      // Collections
      dailyPhonePeTotal,
      dailyCashBagTotal,
      dailyCashBagLoaded,
      totalCashHandover,
      dailyDiscounts,
      dailyShortage,

      // Top Financials
      grossSalesRevenue,
      dailyCartExpenses,
      businessExpensesTotal,
      totalOperatingExpenses,
      expenseByCategory,
      netOperatingProfit,
      totalProfitWithdrawn,
      retainedEarnings,
      
      // Partner shares
      yuvarajShare,
      sebastinShare,
      monthProfits
    };
  }, [entries, expenses, profitWithdrawals, specialOrders, selectedMonth, stickPrice, potPrice]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Navigation and Toolbar - Hidden when printing */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Monthly Financial Statement
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Official statement & partner profit split
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-7 w-7 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-black uppercase px-2 text-slate-800 dark:text-slate-200">
                {statementData.periodName}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-7 w-7 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="financial-statement-doc" className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          {/* Statement Letterhead */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo className="w-12 h-12" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 leading-none">
                    Namma Ooru <span className="text-pink-600">Kulfi</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Premium Ice Candies & Artisanal Kulfis • Sathyamangalam, Tamil Nadu
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Partners: Yuvaraj & Sebastin
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r-0 border-slate-200 pl-3 sm:pl-0">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-slate-100 text-slate-700 inline-block mb-1">
                  Monthly Financial Statement
                </span>
                <p className="text-lg font-black text-slate-900 uppercase">
                  {statementData.periodName}
                </p>
                <p className="text-[10px] font-bold text-slate-500">
                  Ref: <span className="font-mono">{statementData.statementId}</span>
                </p>
                <p className="text-[9px] text-slate-400 font-bold">
                  Generated: {statementData.generatedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Gross Sales Revenue
              </span>
              <span className="text-xl font-black text-slate-950 block">
                {formatCurrency(statementData.grossSalesRevenue)}
              </span>
              <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                {statementData.operatingDaysCount} Cart Shifts + {statementData.specialOrdersCount} Events
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/50">
              <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest block mb-1">
                Total Expenses
              </span>
              <span className="text-xl font-black text-rose-700 block">
                {formatCurrency(statementData.totalOperatingExpenses)}
              </span>
              <span className="text-[9px] font-bold text-rose-600/70 block mt-0.5">
                Cart Ops + Stock/Business
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/80">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">
                Net Operating Profit
              </span>
              <span className="text-xl font-black text-emerald-700 block">
                {formatCurrency(statementData.netOperatingProfit)}
              </span>
              <span className="text-[9px] font-bold text-emerald-700/80 block mt-0.5">
                {statementData.grossSalesRevenue > 0 
                  ? `${Math.round((statementData.netOperatingProfit / statementData.grossSalesRevenue) * 100)}% Profit Margin`
                  : '0%'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60">
              <span className="text-[9px] font-black text-indigo-800 uppercase tracking-widest block mb-1">
                Retained Capital
              </span>
              <span className="text-xl font-black text-indigo-700 block">
                {formatCurrency(statementData.retainedEarnings)}
              </span>
              <span className="text-[9px] font-bold text-indigo-600/70 block mt-0.5">
                After ₹{statementData.totalProfitWithdrawn} Withdrawn
              </span>
            </div>
          </div>

          {/* Section 2: Product Volume & Revenue Breakdown */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-pink-600" />
                Product Volume & Revenue Breakdown
              </h4>
              <span className="text-[9px] font-bold text-slate-500 uppercase">
                Stick Rate: ₹{stickPrice} • Pot Rate: ₹{potPrice}
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Product Category</th>
                  <th className="p-2.5 text-center">Cart Sales</th>
                  <th className="p-2.5 text-center">Event Orders</th>
                  <th className="p-2.5 text-center">Total Volume</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-black text-slate-900">Stick Kulfi</td>
                  <td className="p-2.5 text-center text-slate-600">{statementData.dailyStickSold} pcs</td>
                  <td className="p-2.5 text-center text-slate-600">{statementData.specialStickSold} pcs</td>
                  <td className="p-2.5 text-center font-black text-cyan-600">{statementData.totalStickSold} pcs</td>
                  <td className="p-2.5 text-right text-slate-600">₹{stickPrice}</td>
                  <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(statementData.stickRevenue)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-black text-slate-900">Pot Kulfi</td>
                  <td className="p-2.5 text-center text-slate-600">{statementData.dailyPotSold} pcs</td>
                  <td className="p-2.5 text-center text-slate-600">{statementData.specialPotSold} pcs</td>
                  <td className="p-2.5 text-center font-black text-purple-600">{statementData.totalPotSold} pcs</td>
                  <td className="p-2.5 text-right text-slate-600">₹{potPrice}</td>
                  <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(statementData.potRevenue)}</td>
                </tr>
                {statementData.specialRevenue > (statementData.specialStickSold * stickPrice + statementData.specialPotSold * potPrice) && (
                  <tr className="bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-700">Special Event Premium / Extras</td>
                    <td className="p-2.5 text-center text-slate-400">—</td>
                    <td className="p-2.5 text-center text-slate-600">{statementData.specialOrdersCount} events</td>
                    <td className="p-2.5 text-center text-slate-400">—</td>
                    <td className="p-2.5 text-right text-slate-400">—</td>
                    <td className="p-2.5 text-right font-black text-slate-900">
                      {formatCurrency(statementData.specialRevenue - (statementData.specialStickSold * stickPrice + statementData.specialPotSold * potPrice))}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100/80 font-black text-slate-900">
                  <td className="p-2.5">Total Kulfi Volume & Sales</td>
                  <td className="p-2.5 text-center">{statementData.dailyStickSold + statementData.dailyPotSold} pcs</td>
                  <td className="p-2.5 text-center">{statementData.specialStickSold + statementData.specialPotSold} pcs</td>
                  <td className="p-2.5 text-center text-emerald-700">{statementData.totalStickSold + statementData.totalPotSold} pcs</td>
                  <td className="p-2.5 text-right">—</td>
                  <td className="p-2.5 text-right text-emerald-700">{formatCurrency(statementData.grossSalesRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Collections & Cashflow Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Payment Channel Audit */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-600" />
                Collections & Payment Channels
              </h4>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">PhonePe / UPI Collections:</span>
                  <span className="font-black text-cyan-700">{formatCurrency(statementData.dailyPhonePeTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Physical Cash Handover (Cart):</span>
                  <span className="font-black text-emerald-700">{formatCurrency(statementData.totalCashHandover)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">Daily Cart Expenses Paid:</span>
                  <span className="font-black text-rose-600">−{formatCurrency(statementData.dailyCartExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Special Orders Received:</span>
                  <span className="font-black text-indigo-700">{formatCurrency(statementData.specialRevenue)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 font-black text-slate-900">
                  <span>Net Revenue Realized:</span>
                  <span className="text-sm text-slate-950">{formatCurrency(statementData.grossSalesRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Audit */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-rose-600" />
                Operating Expenses Itemized
              </h4>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                {Object.entries(statementData.expenseByCategory).length === 0 ? (
                  <p className="text-slate-400 font-bold text-center py-3">No expenses recorded for this period.</p>
                ) : (
                  (Object.entries(statementData.expenseByCategory) as [string, number][]).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center">
                      <span className="text-slate-600 font-bold">{cat}:</span>
                      <span className="font-black text-rose-700">{formatCurrency(Number(amt))}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 font-black text-slate-900">
                  <span>Total Operating Expenses:</span>
                  <span className="text-sm text-rose-700">{formatCurrency(statementData.totalOperatingExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Partner Profit Split (50/50 Allocation) */}
          <div className="mb-6 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Partner Profit Distribution (50/50 Partnership Split)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Yuvaraj Card */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-sm text-indigo-950 uppercase">Partner: Yuvaraj</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    50% Share
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Profit Allocation:</span>
                    <span className="font-black text-indigo-900">{formatCurrency(statementData.yuvarajShare)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Withdrawn This Month:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(Math.round(statementData.totalProfitWithdrawn * 0.5))}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-indigo-100">
                    <span>Net Partner Balance:</span>
                    <span className="text-emerald-700">
                      {formatCurrency(statementData.yuvarajShare - Math.round(statementData.totalProfitWithdrawn * 0.5))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sebastin Card */}
              <div className="p-4 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-sm text-purple-950 uppercase">Partner: Sebastin</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    50% Share
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Profit Allocation:</span>
                    <span className="font-black text-purple-900">{formatCurrency(statementData.sebastinShare)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Withdrawn This Month:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(statementData.totalProfitWithdrawn - Math.round(statementData.totalProfitWithdrawn * 0.5))}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-purple-100">
                    <span>Net Partner Balance:</span>
                    <span className="text-emerald-700">
                      {formatCurrency(statementData.sebastinShare - (statementData.totalProfitWithdrawn - Math.round(statementData.totalProfitWithdrawn * 0.5)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Authorization & Sign-off */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-8">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-black text-slate-900 uppercase">Yuvaraj</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Partner / Operations</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-black text-slate-900 uppercase">Sebastin</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Partner / Finance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
