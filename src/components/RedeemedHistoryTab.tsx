import React, { useState, useMemo } from 'react';
import { 
  Gift, 
  Search, 
  Calendar, 
  Phone, 
  Share2, 
  Receipt, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag,
  Users,
  Coins,
  ArrowRight
} from 'lucide-react';
import { QuickBill } from '../types';
import { format } from 'date-fns';

interface RedeemedHistoryTabProps {
  bills: QuickBill[];
  stickPrice: number;
  potPrice: number;
  isDark: boolean;
  onViewBill: (bill: QuickBill) => void;
  onShareWhatsApp: (bill: QuickBill) => void;
  customerChronologicalBalanceMap: Map<string, number>;
}

export const RedeemedHistoryTab: React.FC<RedeemedHistoryTabProps> = ({
  bills,
  stickPrice,
  potPrice,
  isDark,
  onViewBill,
  onShareWhatsApp,
  customerChronologicalBalanceMap
}) => {
  const todayDate = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(todayDate, 'yyyy-MM-dd'), [todayDate]);
  
  const yesterdayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);
  const yesterdayStr = useMemo(() => format(yesterdayDate, 'yyyy-MM-dd'), [yesterdayDate]);

  // Date filter: 'all' | 'today' | 'yesterday' | 'custom'
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get clean 10-digit phone
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Filter all bills with pointsRedeemed > 0
  const allRedeemedBills = useMemo(() => {
    return bills
      .filter(b => (b.pointsRedeemed || 0) > 0)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [bills]);

  // Apply Date and Search Filters
  const filteredRedeemedBills = useMemo(() => {
    let list = allRedeemedBills;

    if (dateFilter === 'today') {
      list = list.filter(b => b.date === todayStr);
    } else if (dateFilter === 'yesterday') {
      list = list.filter(b => b.date === yesterdayStr);
    } else if (dateFilter === 'custom') {
      list = list.filter(b => b.date === customDate);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(b => 
        b.billNumber.toLowerCase().includes(q) ||
        (b.customerPhone && b.customerPhone.includes(q)) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        b.items.some(i => i.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allRedeemedBills, dateFilter, customDate, searchQuery, todayStr, yesterdayStr]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const totalBills = filteredRedeemedBills.length;
    const totalPointsRedeemed = filteredRedeemedBills.reduce((sum, b) => sum + (b.pointsRedeemed || 0), 0);
    const totalFreeDiscount = filteredRedeemedBills.reduce((sum, b) => sum + (b.discount || 0), 0);
    
    // Calculate approximate count of free kulfis (40 pts = stick, 50 pts = pot)
    const totalFreeKulfis = Math.round(totalPointsRedeemed / 40);

    const uniqueCustomers = new Set<string>();
    filteredRedeemedBills.forEach(b => {
      const clean = getCleanPhone(b.customerPhone);
      if (clean) uniqueCustomers.add(clean);
    });

    return {
      totalBills,
      totalPointsRedeemed,
      totalFreeDiscount,
      totalFreeKulfis,
      uniqueCustomersCount: uniqueCustomers.size
    };
  }, [filteredRedeemedBills]);

  // Counts for quick filter buttons
  const todayCount = useMemo(() => {
    return allRedeemedBills.filter(b => b.date === todayStr).length;
  }, [allRedeemedBills, todayStr]);

  const yesterdayCount = useMemo(() => {
    return allRedeemedBills.filter(b => b.date === yesterdayStr).length;
  }, [allRedeemedBills, yesterdayStr]);

  return (
    <div style={{ WebkitOverflowScrolling: 'touch' }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4">
      
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/20 shrink-0">
            🎁
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Kulfi Redeemed Customer History
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {allRedeemedBills.length} Redemptions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete audit trail of customers who redeemed their loyalty points for free stick and pot kulfis.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="date"
            value={customDate}
            onChange={e => {
              setCustomDate(e.target.value);
              setDateFilter('custom');
            }}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Free Kulfis</span>
            <span className="text-base">🍨</span>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {summaryStats.totalFreeKulfis}
          </p>
          <p className="text-[10px] text-slate-500">Sticks & Pots given free</p>
        </div>

        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Points Burned</span>
            <span className="text-base">⭐</span>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {summaryStats.totalPointsRedeemed} pts
          </p>
          <p className="text-[10px] text-slate-500">Total points deducted</p>
        </div>

        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Value Saved</span>
            <span className="text-base">💰</span>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            ₹{summaryStats.totalFreeDiscount}
          </p>
          <p className="text-[10px] text-slate-500">Given to customers</p>
        </div>

        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Customers</span>
            <span className="text-base">👥</span>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {summaryStats.uniqueCustomersCount}
          </p>
          <p className="text-[10px] text-slate-500">Unique happy customers</p>
        </div>
      </div>

      {/* Date Scope Quick Buttons & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Date Scope Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              dateFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All Time</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {allRedeemedBills.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              dateFilter === 'today'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚡ Today</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {todayCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              dateFilter === 'yesterday'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📅 Yesterday</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {yesterdayCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mobile, bill# or item..."
            className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Redeemed Bills List */}
      <div className="space-y-3">
        {filteredRedeemedBills.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl">
              🎁
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {searchQuery 
                ? 'No redemption records match your search'
                : dateFilter === 'today'
                  ? 'No kulfis redeemed today yet'
                  : dateFilter === 'yesterday'
                    ? 'No kulfis redeemed yesterday'
                    : 'No kulfi redemptions recorded yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a customer redeems 40 points (for a free Stick Kulfi) or 50 points (for a free Pot Kulfi) at the counter, the bill will automatically be recorded here.
            </p>
          </div>
        ) : (
          filteredRedeemedBills.map(bill => {
            const cleanPhone = getCleanPhone(bill.customerPhone);
            const pointsRedeemed = bill.pointsRedeemed || 0;
            const chronologicalBalance = customerChronologicalBalanceMap.get(bill.id) ?? bill.totalLoyaltyPoints;

            // Free items description
            let freeKulfiLabel = `${pointsRedeemed} pts redeemed`;
            if (pointsRedeemed >= 50 && pointsRedeemed % 50 === 0) {
              const potCount = pointsRedeemed / 50;
              freeKulfiLabel = `${potCount}x Free Pot Kulfi (${pointsRedeemed} pts)`;
            } else if (pointsRedeemed >= 40 && pointsRedeemed % 40 === 0) {
              const stickCount = pointsRedeemed / 40;
              freeKulfiLabel = `${stickCount}x Free Stick Kulfi (${pointsRedeemed} pts)`;
            }

            return (
              <div
                key={bill.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                  isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* Left: Bill Details & Customer Phone */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      #{bill.billNumber}
                    </span>

                    {/* Free Kulfi Badge */}
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-400 shrink-0" />
                      {freeKulfiLabel}
                    </span>

                    {bill.discount > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ₹{bill.discount} Free Value
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400">
                      {format(new Date(bill.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>

                  {/* Customer Phone & Balance */}
                  <div className="flex items-center gap-2.5 text-xs flex-wrap">
                    {cleanPhone ? (
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        +91 {cleanPhone}
                      </span>
                    ) : (
                      <span className="text-slate-500">Walk-in Customer</span>
                    )}

                    {bill.customerName && (
                      <span className="text-slate-400">({bill.customerName})</span>
                    )}

                    {chronologicalBalance !== undefined && (
                      <span className="text-slate-400 font-medium">
                        Balance after bill: <b className="text-amber-400 font-mono">{chronologicalBalance} pts</b>
                      </span>
                    )}

                    {bill.pointsEarned !== undefined && bill.pointsEarned > 0 && (
                      <span className="text-amber-500 font-bold">
                        (+{bill.pointsEarned} pts earned on paid items)
                      </span>
                    )}
                  </div>

                  {/* Items summary */}
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    {bill.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                {/* Right: Bill Paid Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                      ₹{bill.totalAmount}
                    </span>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Paid via {bill.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Receipt */}
                    <button
                      type="button"
                      onClick={() => onViewBill(bill)}
                      className="px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="View Bill Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline">Receipt</span>
                    </button>

                    {/* WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => onShareWhatsApp(bill)}
                      className="px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="Share receipt on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="h-10 md:hidden shrink-0" />
    </div>
  );
};
