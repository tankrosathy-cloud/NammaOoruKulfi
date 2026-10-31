import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Search, 
  Phone, 
  Sparkles, 
  Gift, 
  Share2, 
  Calendar, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Award,
  Users,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { QuickBill } from '../types';
import { format } from 'date-fns';

interface CustomerLeaderboardTabProps {
  bills: QuickBill[];
  stickPrice: number;
  potPrice: number;
  isDark: boolean;
  storeName?: string;
  onViewBill?: (bill: QuickBill) => void;
  customerChronologicalBalanceMap: Map<string, number>;
}

interface CustomerEntry {
  phone: string;
  name: string;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  currentBalance: number;
  totalBills: number;
  totalSpend: number;
  lastVisitIso: string;
  firstVisitIso: string;
  freeSticksAvailable: number;
  freePotsAvailable: number;
  bills: QuickBill[];
}

export const CustomerLeaderboardTab: React.FC<CustomerLeaderboardTabProps> = ({
  bills,
  stickPrice,
  potPrice,
  isDark,
  storeName = 'Namma Ooru Kulfi',
  onViewBill,
  customerChronologicalBalanceMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'balance' | 'earned' | 'visits' | 'spend'>('balance');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  // Helper to extract clean 10-digit phone
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Aggregate bills by clean phone number
  const customerList = useMemo(() => {
    const customerMap = new Map<string, {
      phone: string;
      name: string;
      lifetimeEarned: number;
      lifetimeRedeemed: number;
      totalBills: number;
      totalSpend: number;
      lastVisitIso: string;
      firstVisitIso: string;
      bills: QuickBill[];
    }>();

    bills.forEach(b => {
      const clean = getCleanPhone(b.customerPhone);
      if (!clean || clean.length < 10) return;

      const existing = customerMap.get(clean) || {
        phone: clean,
        name: b.customerName?.trim() || '',
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        totalBills: 0,
        totalSpend: 0,
        lastVisitIso: b.createdAt || '',
        firstVisitIso: b.createdAt || '',
        bills: []
      };

      if (!existing.name && b.customerName?.trim()) {
        existing.name = b.customerName.trim();
      }

      existing.lifetimeEarned += (b.pointsEarned || 0);
      existing.lifetimeRedeemed += (b.pointsRedeemed || 0);
      existing.totalBills += 1;
      existing.totalSpend += (b.totalAmount || 0);
      existing.bills.push(b);

      if (b.createdAt && (!existing.lastVisitIso || b.createdAt > existing.lastVisitIso)) {
        existing.lastVisitIso = b.createdAt;
      }
      if (b.createdAt && (!existing.firstVisitIso || b.createdAt < existing.firstVisitIso)) {
        existing.firstVisitIso = b.createdAt;
      }

      customerMap.set(clean, existing);
    });

    const list: CustomerEntry[] = Array.from(customerMap.values()).map(c => {
      const currentBalance = Math.max(0, c.lifetimeEarned - c.lifetimeRedeemed);
      // Sort customer bills newest first
      const sortedBills = [...c.bills].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      return {
        ...c,
        bills: sortedBills,
        currentBalance,
        freeSticksAvailable: Math.floor(currentBalance / 40),
        freePotsAvailable: Math.floor(currentBalance / 50),
      };
    });

    return list;
  }, [bills]);

  // Sort and filter
  const sortedAndFiltered = useMemo(() => {
    let list = [...customerList];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c => 
        c.phone.includes(q) ||
        (c.name && c.name.toLowerCase().includes(q))
      );
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'balance') {
        if (b.currentBalance !== a.currentBalance) return b.currentBalance - a.currentBalance;
        return b.lifetimeEarned - a.lifetimeEarned;
      }
      if (sortBy === 'earned') {
        if (b.lifetimeEarned !== a.lifetimeEarned) return b.lifetimeEarned - a.lifetimeEarned;
        return b.currentBalance - a.currentBalance;
      }
      if (sortBy === 'visits') {
        if (b.totalBills !== a.totalBills) return b.totalBills - a.totalBills;
        return b.currentBalance - a.currentBalance;
      }
      if (sortBy === 'spend') {
        if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
        return b.currentBalance - a.currentBalance;
      }
      return 0;
    });

    return list;
  }, [customerList, searchQuery, sortBy]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalCustomers = customerList.length;
    const totalBalanceInCirculation = customerList.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalLifetimeEarned = customerList.reduce((sum, c) => sum + c.lifetimeEarned, 0);
    const eligibleForFreeKulfi = customerList.filter(c => c.currentBalance >= 40).length;
    const topCustomer = customerList.length > 0 
      ? [...customerList].sort((a, b) => b.currentBalance - a.currentBalance)[0] 
      : null;

    return {
      totalCustomers,
      totalBalanceInCirculation,
      totalLifetimeEarned,
      eligibleForFreeKulfi,
      topCustomer
    };
  }, [customerList]);

  // WhatsApp reward message sender
  const handleSendWhatsAppGreeting = (customer: CustomerEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `🍨 *Vanakkam from ${storeName}!* 🎉\n\n`;
    text += `Dear Valued Customer,\n`;
    text += `You have *${customer.currentBalance} Loyalty Points* in your account! 🏆\n\n`;

    if (customer.currentBalance >= 50) {
      text += `🎁 *GREAT NEWS!* You have enough points to claim a *FREE Pot Kulfi (50 pts)* or *FREE Stick Kulfi (40 pts)* right now!\n\n`;
    } else if (customer.currentBalance >= 40) {
      text += `🎁 *GREAT NEWS!* You have enough points to claim a *FREE Stick Kulfi (40 pts)* right now!\n\n`;
    } else {
      const needed = 40 - customer.currentBalance;
      text += `🍦 You are only *${needed} points* away from earning your next *FREE Kulfi*! (Earn 3 pts on every kulfi purchased)\n\n`;
    }

    text += `Visit our counter today and treat yourself and your family to 100% pure traditional kulfi! 🍨\n\n`;
    text += `📍 *Store Hours:* 6:00 PM to 11:30 PM (All Days)\n`;
    text += `Thank you for your love and support! 🙏`;

    const waUrl = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ WebkitOverflowScrolling: 'touch' }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4">
      
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Customer Loyalty Leaderboard
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                {stats.totalCustomers} Customers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked from most loyalty points to least. Send reward reminders to encourage repeat visits.
            </p>
          </div>
        </div>

        {/* Top metrics pill */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">Free Kulfi Ready</p>
              <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{stats.eligibleForFreeKulfi} Customers (≥40 pts)</p>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase text-cyan-500 tracking-wider">Total Active Points</p>
              <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{stats.totalBalanceInCirculation} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Sort Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSortBy('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              sortBy === 'balance'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span>Most Points</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('earned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              sortBy === 'earned'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Lifetime Earned</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('visits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              sortBy === 'visits'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Visits</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('spend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              sortBy === 'spend'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>₹ Spend</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mobile number or name..."
            className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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

      {/* Rankings List */}
      <div className="space-y-3">
        {sortedAndFiltered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl">
              🏆
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {searchQuery ? 'No customers found matching search' : 'No customer records yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When bills are created with customer phone numbers at the counter, their points are automatically tracked and ranked here!
            </p>
          </div>
        ) : (
          sortedAndFiltered.map((customer, index) => {
            const rank = index + 1;
            const isPodium = rank <= 3;
            const isExpanded = expandedPhone === customer.phone;

            // Tier info
            const isDiamond = customer.currentBalance >= 75;
            const isGold = customer.currentBalance >= 40;
            const isSilver = customer.currentBalance >= 20;

            let podiumStyle = '';
            let rankBadge = '';

            if (rank === 1) {
              podiumStyle = isDark 
                ? 'border-amber-400/50 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-900/90 shadow-lg shadow-amber-500/10' 
                : 'border-amber-400 bg-amber-50/50 shadow-md';
              rankBadge = '🥇 #1 GOLD CHAMPION';
            } else if (rank === 2) {
              podiumStyle = isDark 
                ? 'border-slate-400/40 bg-gradient-to-r from-slate-400/10 via-slate-900/90 to-slate-900/90 shadow-md' 
                : 'border-slate-300 bg-slate-50/60 shadow-sm';
              rankBadge = '🥈 #2 SILVER';
            } else if (rank === 3) {
              podiumStyle = isDark 
                ? 'border-amber-700/40 bg-gradient-to-r from-amber-700/10 via-slate-900/90 to-slate-900/90 shadow-md' 
                : 'border-amber-200 bg-amber-50/30 shadow-sm';
              rankBadge = '🥉 #3 BRONZE';
            } else {
              podiumStyle = isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm';
            }

            return (
              <div 
                key={customer.phone}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${podiumStyle}`}
              >
                {/* Main Customer Card */}
                <div 
                  onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 cursor-pointer hover:bg-slate-800/20"
                >
                  {/* Left: Rank & Customer Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      {rank === 1 ? (
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/30">
                          👑 1
                        </div>
                      ) : rank === 2 ? (
                        <div className="w-10 h-10 rounded-2xl bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-md">
                          🥈 2
                        </div>
                      ) : rank === 3 ? (
                        <div className="w-10 h-10 rounded-2xl bg-amber-700/80 text-amber-100 font-black text-sm flex items-center justify-center shadow-md">
                          🥉 3
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                          #{rank}
                        </div>
                      )}
                    </div>

                    {/* Customer Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-cyan-500" />
                          +91 {customer.phone}
                        </span>

                        {customer.name && (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                            ({customer.name})
                          </span>
                        )}

                        {isPodium && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            {rankBadge}
                          </span>
                        )}

                        {isDiamond ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            💎 VIP Legend
                          </span>
                        ) : isGold ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🍦 Free Kulfi Ready
                          </span>
                        ) : isSilver ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            ⭐ Regular
                          </span>
                        ) : null}
                      </div>

                      {/* Subtitle / summary stats */}
                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-slate-400" />
                          <b>{customer.totalBills}</b> visits
                        </span>
                        <span>•</span>
                        <span>₹{customer.totalSpend} total spent</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-medium">+{customer.lifetimeEarned} earned</span>
                        {customer.lifetimeRedeemed > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400 font-medium">🎁 -{customer.lifetimeRedeemed} redeemed</span>
                          </>
                        )}
                        {customer.lastVisitIso && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">
                              Last: {format(new Date(customer.lastVisitIso), 'dd MMM yyyy')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance Display & Quick WhatsApp Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
                          {customer.currentBalance}
                        </span>
                        <span className="text-xs font-black uppercase text-amber-500/80 tracking-wider">
                          pts
                        </span>
                      </div>
                      
                      {/* Reward eligibility label */}
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {customer.currentBalance >= 50 ? (
                          <span className="text-emerald-400 font-black">🎁 1 Free Pot or Stick Ready!</span>
                        ) : customer.currentBalance >= 40 ? (
                          <span className="text-emerald-400 font-black">🍦 1 Free Stick Ready!</span>
                        ) : (
                          <span>{40 - customer.currentBalance} pts to free kulfi</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Greeting / Offer Button */}
                      <button
                        type="button"
                        onClick={(e) => handleSendWhatsAppGreeting(customer, e)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                        title="Send WhatsApp greeting & reward reminder"
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden xs:inline">WhatsApp</span>
                      </button>

                      {/* Expand / Collapse Chevron */}
                      <button
                        type="button"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Customer Bills History Drawer */}
                {isExpanded && (
                  <div className={`p-4 border-t space-y-3 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Past Bills History ({customer.bills.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        First visit: {customer.firstVisitIso ? format(new Date(customer.firstVisitIso), 'dd MMM yyyy') : 'N/A'}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                      {customer.bills.map(b => (
                        <div 
                          key={b.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                #{b.billNumber}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {format(new Date(b.createdAt), 'dd MMM yyyy, hh:mm a')}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                {b.paymentMethod}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {b.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <p className="font-mono font-black text-slate-900 dark:text-white">
                                ₹{b.totalAmount}
                              </p>
                              <div className="text-[10px] font-bold flex items-center gap-1 justify-end">
                                {b.pointsEarned ? <span className="text-amber-500">+{b.pointsEarned} pts</span> : null}
                                {b.pointsRedeemed ? <span className="text-purple-400">🎁 -{b.pointsRedeemed} pts</span> : null}
                              </div>
                            </div>

                            {onViewBill && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewBill(b);
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="h-10 md:hidden shrink-0" />
    </div>
  );
};
