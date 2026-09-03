import React, { useMemo, useState, useEffect } from 'react';
import { useEntries, useSettings, useExpenses, useInventory, useSpecialOrders, useProfitWithdrawals } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency, isDateInMonth } from '../lib/utils';
import { TrendingUp, TrendingDown, Package, AlertCircle, BarChart3, PieChart as PieIcon, Activity, Sparkles, Sun, CloudRain, PartyPopper, Calendar, Bell, X, MessageCircle } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useWeather } from '../lib/useWeather';
import { calculatePrediction } from '../lib/prediction';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';
import { calculateAvailableStock } from '../lib/inventoryUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4,
      ease: [0.215, 0.610, 0.355, 1.000] // elegant cubic-bezier easeOut
    } 
  }
};


export default function Dashboard({ onNavigateToEntry }: { onNavigateToEntry?: (date: string) => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [activeDayView, setActiveDayView] = useState<'today' | 'latest'>('today');
  const { entries, loading: entriesLoading, loadMore: loadMoreEntries, hasMore: hasMoreEntries } = useEntries();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { specialOrders } = useSpecialOrders();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { profitWithdrawals, loading: profitLoading } = useProfitWithdrawals();
  const loading = entriesLoading || expensesLoading || inventoryLoading || profitLoading;
  const { settings } = useSettings();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  const defaultIsWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
  
  const { getWeatherForDate } = useWeather();
  const autoWeather = getWeatherForDate(tomorrowStr);
  
  const [isWeekend, setIsWeekend] = useState(defaultIsWeekend);
  const [isHoliday, setIsHoliday] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'normal' | 'hot' | 'rain'>('normal');
  const [userOverrodeWeather, setUserOverrodeWeather] = useState(false);

  useEffect(() => {
    if (!userOverrodeWeather && autoWeather) {
      setWeatherCondition(autoWeather === 'rainy' ? 'rain' : autoWeather);
    }
  }, [autoWeather, userOverrodeWeather]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const stats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthlyRevenue = 0;
    let lifetimeRevenue = 0;
    let monthlyExpenses = 0;
    let monthlyShortage = 0;

    const todayDate = new Date();
    entries.forEach(e => {
      const revenue = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      const exp = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      
      lifetimeRevenue += revenue;
      
      if (e.date === todayStr) {
        todayRevenue += revenue;
      }
      
      if (isDateInMonth(e.date, todayDate)) {
        monthlyRevenue += revenue;
        monthlyExpenses += exp;
        monthlyShortage += (e.shortage || 0);
      }
      
      try {
        const date = parseISO(e.date);
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });

    const latestRevenue = latest ? Math.max(0, latest.actualAmount - (latest.cashBagLoaded || 0) + (latest.expenses || 0) + (latest.additionalExpenses || 0) + (latest.bonus || 0)) : 0;

    // Add special orders profit (event orders)
    specialOrders.forEach(order => {
      const revenue = order.amountReceived || 0;
      lifetimeRevenue += revenue;

      if (order.date === todayStr) {
        todayRevenue += revenue;
      }

      if (isDateInMonth(order.date, todayDate)) {
        monthlyRevenue += revenue;
      }

      try {
        const date = parseISO(order.date);
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });
    
    const last7DaysEntries = sorted.slice(0, 7).reverse();
    const chartData = last7DaysEntries.map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      stickSold: e.stickSold || 0,
      potSold: e.potSold || 0
    }));

    // Current Month Daily Sales Trend
    const currentMonthEntries = entries
      .filter(e => isDateInMonth(e.date, todayDate))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Combine special orders with current month entries for sales trend
    const currentMonthSpecials = specialOrders.filter(e => isDateInMonth(e.date, todayDate));
    
    // Group sales by date
    const salesByDate: Record<string, number> = {};
    
    currentMonthEntries.forEach(e => {
      const dateKey = format(parseISO(e.date), 'dd MMM');
      const sales = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + sales;
    });
    
    currentMonthSpecials.forEach(order => {
      const dateKey = format(parseISO(order.date), 'dd MMM');
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.amountReceived;
    });

    const trendDates = Array.from(new Set([...currentMonthEntries.map(e => e.date), ...currentMonthSpecials.map(e => e.date)]));
    trendDates.sort();
    
    const monthlySalesTrend = trendDates.map(dateStr => {
       const dateKey = format(parseISO(dateStr), 'dd MMM');
       return { date: dateKey, Sales: salesByDate[dateKey] || 0 };
    });

    // Current Month Expense Distribution
    const expenseCategoriesMap: Record<string, number> = {};

    expenses.forEach(e => {
      if (isDateInMonth(e.date, todayDate)) {
        const category = e.category || 'Others';
        expenseCategoriesMap[category] = (expenseCategoriesMap[category] || 0) + e.amount;
      }
    });

    // Sum up daily entries' operational expenses
    currentMonthEntries.forEach(e => {
      const dailyOpsExp = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      if (dailyOpsExp > 0) {
        expenseCategoriesMap['Daily Operations'] = (expenseCategoriesMap['Daily Operations'] || 0) + dailyOpsExp;
      }
    });

    const expenseDistribution = Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    expenses.forEach(e => {
      try {
        const date = parseISO(e.date);
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          monthlyExpenses += e.amount;
        }
      } catch (err) {}
    });

    return {
      latest,
      latestRevenue,
      todayRevenue,
      weekRevenue,
      monthlyRevenue,
      lifetimeRevenue,
      monthlyExpenses,
      monthlyNet: monthlyRevenue - monthlyExpenses,
      monthlyShortage,
      chartData,
      monthlySalesTrend,
      expenseDistribution
    };
  }, [entries, expenses, specialOrders]);

  
  const inventoryStats = useMemo(() => {
    return calculateAvailableStock(inventory, entries, specialOrders);
  }, [entries, inventory, specialOrders]);

  const nextDaySuggestion = useMemo(() => {
    const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition, 'normal', tomorrowStr);
    return { ...result, multiplier: Math.round(result.multiplier * 100) };
  }, [entries, isWeekend, isHoliday, weatherCondition, tomorrowStr]);

  const overallStats = useMemo(() => {
    let revenue = 0;
    let totalExpenses = 0;
    let shortage = 0;

    entries.forEach(e => {
      const netSales = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      const exp = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      revenue += netSales;
      totalExpenses += exp;
      shortage += (e.shortage || 0);
    });

    specialOrders.forEach(order => {
      revenue += order.amountReceived;
    });

    expenses.forEach(exp => {
      totalExpenses += exp.amount;
    });

    const netSavings = revenue - totalExpenses;

    let profitTaken = 0;
    profitWithdrawals.forEach(p => {
      profitTaken += p.amount;
    });

    const retainedEarnings = netSavings - profitTaken;

    return {
      shortage,
      netSavings,
      profitTaken,
      retainedEarnings
    };
  }, [entries, expenses, specialOrders, profitWithdrawals]);

  if (loading) {
    return (
      <div className={`p-6 text-center font-bold uppercase tracking-wider ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Loading dashboard...
      </div>
    );
  }

  const latest = stats.latest;

  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-250 shadow-md shadow-slate-200/40';
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold';
  const valueColor = isDark ? 'text-white' : 'text-slate-950 font-black';

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="p-6 space-y-8 pb-32"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-start relative">
        <div>
          <h2 className={`text-3xl font-black tracking-tighter uppercase mb-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Overview</h2>
          <p className={`${labelColor} text-[10px] font-bold uppercase tracking-widest`}>Monthly performance & current inventory</p>
        </div>
        
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
        </button>

        {showNotifications && (
          <div className={`absolute top-14 right-0 w-72 z-50 rounded-2xl shadow-xl border p-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className={`text-[11px] font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Stock Update Reminder</p>
                    <p className={`text-[10px] mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Don't forget to verify physical stock against dashboard balance today.</p>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className={`text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>System Message</p>
                    <p className={`text-[10px] mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dashboard data synced successfully.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* OVERALL METRICS GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card className={isDark ? 'bg-purple-950/20 border-purple-900/30' : 'bg-purple-100/90 border-purple-300 shadow-sm shadow-purple-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-purple-400 font-bold' : 'text-purple-800 font-black'}`}>Total Shortage</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(overallStats.shortage)}</p>
          </CardContent>
        </Card>
        
        <Card className={isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-100/90 border-emerald-300 shadow-sm shadow-emerald-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black'}`}>Net Savings</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(overallStats.netSavings)}</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-fuchsia-950/20 border-fuchsia-900/30' : 'bg-fuchsia-100/90 border-fuchsia-300 shadow-sm shadow-fuchsia-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-fuchsia-400 font-bold' : 'text-fuchsia-800 font-black'}`}>Profit Taken</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(overallStats.profitTaken)}</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-indigo-950/20 border-indigo-900/30' : 'bg-indigo-100/90 border-indigo-300 shadow-sm shadow-indigo-100/30'}>
          <CardContent className="p-5">
            <p className={`text-[10px] uppercase tracking-widest mb-2 ${isDark ? 'text-indigo-400 font-bold' : 'text-indigo-800 font-black'}`}>Retained Earnings</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(overallStats.retainedEarnings)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {latest && (
        <motion.div variants={itemVariants}>
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-cyan-500/5 via-pink-500/5 to-emerald-500/5 border-slate-200 shadow-sm'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Latest Recorded Entry</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    latest.date === todayStr ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {latest.date === todayStr ? 'Today' : format(parseISO(latest.date), 'dd MMM yyyy')}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  Stick: <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{latest.stickSold || 0} pcs</span> | Pot: <span className="text-pink-600 dark:text-pink-400 font-extrabold">{latest.potSold || 0} pcs</span> {settings?.enablePlate && (<span>| Plate: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{latest.plateSold || 0} pcs</span> </span>)}| Actual Cash: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatCurrency(latest.actualAmount)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {latest.shortage ? (
                <div className="text-left sm:text-right mr-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500">Shortage</span>
                  <p className="text-xs font-black text-orange-500">{formatCurrency(latest.shortage)}</p>
                </div>
              ) : latest.excess ? (
                <div className="text-left sm:text-right mr-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Excess</span>
                  <p className="text-xs font-black text-emerald-500">{formatCurrency(latest.excess)}</p>
                </div>
              ) : null}
              {onNavigateToEntry && (
                <button
                  type="button"
                  onClick={() => onNavigateToEntry(latest.date)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  View / Edit
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400`}>
                  {activeDayView === 'today' ? 'Today' : `Latest (${latest ? format(parseISO(latest.date), 'dd MMM') : 'Day'})`}
                </p>
                {latest && latest.date !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setActiveDayView(prev => prev === 'today' ? 'latest' : 'today')}
                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 uppercase tracking-tight transition-colors"
                  >
                    {activeDayView === 'today' ? `See ${format(parseISO(latest.date), 'dd MMM')}` : 'See Today'}
                  </button>
                )}
              </div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {formatCurrency(activeDayView === 'today' ? stats.todayRevenue : stats.latestRevenue)}
              </div>
              {activeDayView === 'today' && stats.todayRevenue === 0 && latest && latest.date !== todayStr && (
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Latest: {formatCurrency(stats.latestRevenue)} ({format(parseISO(latest.date), 'dd MMM')})
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-600 dark:text-pink-400`}>This Week</p>
              <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{formatCurrency(stats.weekRevenue)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Month
              </p>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">Lifetime</p>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{formatCurrency(stats.lifetimeRevenue)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
              <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black leading-none text-pink-600 dark:text-pink-400 truncate">{formatCurrency(stats.monthlyExpenses)}</div>
            <p className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
              <TrendingDown className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Shortage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black leading-none text-orange-500 dark:text-orange-400 truncate">{formatCurrency(stats.monthlyShortage)}</div>
            <p className="text-[10px] font-extrabold text-orange-500 dark:text-orange-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex justify-between items-center ${labelColor}`}>
              <span>Monthly Sales Goal</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-black">{Math.min(100, Math.round((stats.monthlyRevenue / (settings.monthlyGoal || 150000)) * 100))}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className={`w-full rounded-full h-3 mb-2 overflow-hidden border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'
            }`}>
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, Math.max(0, (stats.monthlyRevenue / (settings.monthlyGoal || 150000)) * 100))}%` }}
              ></div>
            </div>
            <div className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
            }`}>
              <span>{formatCurrency(stats.monthlyRevenue)}</span>
              <span>Target: {formatCurrency(settings.monthlyGoal || 150000)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Inventory Stats */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
          Inventory Status
        </h3>
        <div className={`grid gap-4 ${settings?.enablePlate ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Package className="w-3 h-3" /> Stick Sold (Month)
              </p>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{inventoryStats.totalStickSoldThisMonth} <span className="text-sm font-bold">pcs</span></div>
              <p className="text-[10px] text-cyan-700/70 dark:text-cyan-400/70 font-semibold mt-0.5">Avg: {inventoryStats.avgStickSoldThisMonth} / day</p>
            </CardContent>
          </Card>
          
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-600 dark:text-pink-400 flex items-center gap-1">
                <Package className="w-3 h-3" /> Pot Sold (Month)
              </p>
              <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{inventoryStats.totalPotSoldThisMonth} <span className="text-sm font-bold">pcs</span></div>
              <p className="text-[10px] text-pink-700/70 dark:text-pink-400/70 font-semibold mt-0.5">Avg: {inventoryStats.avgPotSoldThisMonth} / day</p>
            </CardContent>
          </Card>

          {settings?.enablePlate && (
            <Card className={cardBg}>
              <CardContent className="p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Plate Sold (Month)
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{inventoryStats.totalPlateSoldThisMonth || 0} <span className="text-sm font-bold">pcs</span></div>
                <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-semibold mt-0.5">Avg: {inventoryStats.avgPlateSoldThisMonth || 0} / day</p>
              </CardContent>
            </Card>
          )}

          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-800 dark:text-cyan-500">
                Stick Available
              </p>
              <div className="text-2xl font-black text-cyan-800 dark:text-cyan-500">{inventoryStats.availableStick} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>
          
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-800 dark:text-pink-500">
                Pot Available
              </p>
              <div className="text-2xl font-black text-pink-800 dark:text-pink-500">{inventoryStats.availablePot} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>

          {settings?.enablePlate && (
            <Card className={cardBg}>
              <CardContent className="p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-amber-800 dark:text-amber-500">
                  Plate Available
                </p>
                <div className="text-2xl font-black text-amber-800 dark:text-amber-500">{inventoryStats.availablePlate || 0} <span className="text-sm font-bold">pcs</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Current Month Analytics (Trends & Distribution) */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div>
          <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-700'} mb-3`}>
            {format(new Date(), 'MMMM yyyy')} Analytics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Daily Sales Trend Area Chart */}
            <Card className={cardBg}>
              <CardHeader className="p-5 pb-2">
                <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
                  <Activity className="w-4 h-4 text-cyan-500" /> Daily Sales Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {stats.monthlySalesTrend.length === 0 ? (
                  <div className="h-[220px] w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    No sales logged yet this month
                  </div>
                ) : (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlySalesTrend}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#06b6d4" : "#0891b2"} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={isDark ? "#06b6d4" : "#0891b2"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke={isDark ? "#475569" : "#334155"} 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: isDark ? '#94a3b8' : '#334155', fontWeight: 'bold' }}
                        />
                        <YAxis 
                          stroke={isDark ? "#475569" : "#334155"} 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `₹${value}`} 
                          tick={{ fill: isDark ? '#94a3b8' : '#334155', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                            border: isDark ? '1px solid #1e293b' : '1px solid #cbd5e1', 
                            borderRadius: '12px',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                          itemStyle={{ color: isDark ? '#06b6d4' : '#0891b2' }}
                          labelStyle={{ color: isDark ? '#94a3b8' : '#334155', fontSize: '11px', fontWeight: 'extrabold' }}
                          formatter={(value: number) => [formatCurrency(value), 'Sales']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Sales" 
                          stroke={isDark ? "#06b6d4" : "#0891b2"} 
                          strokeWidth={3.5} 
                          fillOpacity={1} 
                          fill="url(#salesGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Expense Distribution Pie/Donut Chart */}
            <Card className={cardBg}>
              <CardHeader className="p-5 pb-2">
                <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
                  <PieIcon className="w-4 h-4 text-pink-500" /> Expense Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {stats.expenseDistribution.length === 0 ? (
                  <div className="h-[220px] w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    No expenses logged yet this month
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Left Column: Pie Chart */}
                    <div className="h-[180px] w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.expenseDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.expenseDistribution.map((entry, index) => {
                              const colors: Record<string, string> = {
                                'Daily Operations': '#06b6d4',
                                'Petrol/Fuel': '#f59e0b',
                                'Food': '#10b981',
                                'Supplies': '#3b82f6',
                                'Maintenance': '#ef4444',
                                'Salary': '#8b5cf6',
                                'Rent': '#6366f1',
                                'Others': '#64748b'
                              };
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={colors[entry.name] || '#64748b'} 
                                />
                              );
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Label for Donut style */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600 font-extrabold'}`}>Total</span>
                        <span className="text-sm font-black text-slate-950 dark:text-white leading-none mt-0.5">
                          {formatCurrency(stats.expenseDistribution.reduce((sum, item) => sum + item.value, 0))}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Custom Interactive Legend */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-none">
                      {stats.expenseDistribution.map((item) => {
                        const colors: Record<string, string> = {
                          'Daily Operations': '#06b6d4',
                          'Petrol/Fuel': '#f59e0b',
                          'Food': '#10b981',
                          'Supplies': '#3b82f6',
                          'Maintenance': '#ef4444',
                          'Salary': '#8b5cf6',
                          'Rent': '#6366f1',
                          'Others': '#64748b'
                        };
                        const color = colors[item.name] || '#64748b';
                        const totalExp = stats.expenseDistribution.reduce((sum, i) => sum + i.value, 0);
                        const percentage = totalExp > 0 ? Math.round((item.value / totalExp) * 100) : 0;
                        return (
                          <div key={item.name} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 truncate mr-2">
                               <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                               <span className={`${isDark ? 'text-slate-300' : 'text-slate-850 font-extrabold'} truncate`}>{item.name.split('/')[0]}</span>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                               <span className={`${isDark ? 'text-white' : 'text-slate-950 font-black'}`}>{formatCurrency(item.value)}</span>
                               <span className={`${isDark ? 'text-slate-400' : 'text-slate-600 font-black'} text-[8px]`}>({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </motion.div>

      {stats.chartData.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardHeader className="p-5 pb-2">
              <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
                <BarChart3 className="w-4 h-4 text-cyan-500" /> Last 7 Days Quantity Sold
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        color: isDark ? '#ffffff' : '#0f172a'
                      }}
                      labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="stickSold" name="Stick" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="potSold" name="Pot" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {nextDaySuggestion.hasData && (
        <motion.div variants={itemVariants}>
          <Card className={`overflow-hidden border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' 
              : 'bg-white text-slate-800 border-slate-200/80 shadow-md shadow-slate-100'
          }`}>
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-pink-500 animate-pulse" /> Next Day Estimated Load Suggestion
              </CardTitle>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                isDark ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
              }`}>
                Predictive Insights
              </span>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Based on recent average sales from the last 5 operational days, we recommend preparing and loading the following quantities for the next shift to minimize stockout risk:
              </p>

              {/* Prediction Modifiers */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsWeekend(!isWeekend)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    isWeekend 
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20' 
                      : isDark ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-cyan-500/50 hover:text-cyan-600'
                  }`}
                >
                  <Calendar className="w-3 h-3" /> Weekend
                </button>
                <button
                  onClick={() => setIsHoliday(!isHoliday)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    isHoliday 
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/20' 
                      : isDark ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-pink-500/50 hover:text-pink-400' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-pink-500/50 hover:text-pink-600'
                  }`}
                >
                  <PartyPopper className="w-3 h-3" /> Holiday
                </button>
                
                <div className={`flex rounded-full border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    onClick={() => { setWeatherCondition('normal'); setUserOverrodeWeather(true); }}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      weatherCondition === 'normal'
                        ? 'bg-slate-700 text-white dark:bg-slate-600' 
                        : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('hot'); setUserOverrodeWeather(true); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-l ${
                      isDark ? 'border-slate-700' : 'border-slate-200'
                    } ${
                      weatherCondition === 'hot'
                        ? 'bg-amber-500 text-white' 
                        : isDark ? 'bg-slate-900 text-slate-400 hover:text-amber-400' : 'bg-slate-50 text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Hot
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('rain'); setUserOverrodeWeather(true); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-l ${
                      isDark ? 'border-slate-700' : 'border-slate-200'
                    } ${
                      weatherCondition === 'rain'
                        ? 'bg-blue-500 text-white' 
                        : isDark ? 'bg-slate-900 text-slate-400 hover:text-blue-400' : 'bg-slate-50 text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    <CloudRain className="w-3 h-3" /> Rain
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 ${settings?.enablePlate ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Stick Kulfi Suggestion</span>
                  <span className="text-3xl font-black text-cyan-500 leading-none mt-1 relative z-10">{nextDaySuggestion.stick} <span className="text-xs font-bold text-slate-400">pcs</span></span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Avg Sales: {nextDaySuggestion.avgStick} pcs</span>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-500/5 rounded-full blur-xl"></div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Pot Kulfi Suggestion</span>
                  <span className="text-3xl font-black text-pink-500 leading-none mt-1 relative z-10">{nextDaySuggestion.pot} <span className="text-xs font-bold text-slate-400">pcs</span></span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Avg Sales: {nextDaySuggestion.avgPot} pcs</span>
                </div>

                {settings?.enablePlate && (
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center relative overflow-hidden col-span-2 md:col-span-1`}>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Plate Kulfi Suggestion</span>
                    <span className="text-3xl font-black text-amber-500 leading-none mt-1 relative z-10">{nextDaySuggestion.plate} <span className="text-xs font-bold text-slate-400">pcs</span></span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Avg Sales: {nextDaySuggestion.avgPlate} pcs</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                <span className="font-black whitespace-nowrap">💡 Multiplier:</span>
                <span>Adjusted to {nextDaySuggestion.multiplier}% of base average due to current conditions (includes 15% safety buffer, rounded up to nearest 5).</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {latest ? (
        <motion.div variants={itemVariants}>
          <Card className={`border transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
              : 'bg-white text-slate-800 border-slate-100 shadow-lg shadow-slate-100'
          }`}>
            <CardHeader className={`p-6 border-b rounded-t-3xl ${
              isDark ? 'border-slate-800/60' : 'border-slate-100'
            }`}>
              <div className="flex justify-between items-center">
                <CardTitle className={`text-xl font-black tracking-tighter uppercase flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Package className="w-5 h-5 text-cyan-500" /> Latest Inventory
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shadow-sm"
                    title="Share daily closing summary on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Share</span>
                  </button>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                    isDark 
                      ? 'text-cyan-100 bg-cyan-900/30 border border-cyan-800' 
                      : 'text-cyan-700 bg-cyan-50 border border-cyan-100'
                  }`}>
                    {format(parseISO(latest.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                <InventoryRow label="Stick Kulfi" loaded={latest.stickLoaded} balance={latest.stickBalance} sold={latest.stickSold} color="cyan" isDark={isDark} />
                <InventoryRow label="Pot Kulfi" loaded={latest.potLoaded} balance={latest.potBalance} sold={latest.potSold} color="pink" isDark={isDark} />
                {settings?.enablePlate && (
                  <InventoryRow label="Plate Kulfi" loaded={latest.plateLoaded} balance={latest.plateBalance} sold={latest.plateSold} color="amber" isDark={isDark} />
                )}
              </div>
              
              <div className={`p-6 rounded-b-3xl border-t grid grid-cols-2 gap-4 ${
                isDark ? 'bg-slate-950/50 border-slate-800/60' : 'bg-slate-50 border-slate-100'
              }`}>
                 <div>
                   <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${labelColor}`}>Net Sales</p>
                   <p className="font-black text-lg text-cyan-500">{formatCurrency(latest.actualAmount - (latest.cashBagLoaded || 0) + (latest.expenses || 0) + (latest.additionalExpenses || 0) + (latest.bonus || 0))}</p>
                 </div>
                 <div>
                   <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${labelColor}`}>PhonePe Amount</p>
                   <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(latest.phonePe)}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className={cardBg}>
            <CardContent className="p-8 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
              No entries found. Add an entry to see inventory stats.
            </CardContent>
          </Card>
        </motion.div>
      )}
      {latest && (
        <WhatsAppSummaryModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          entry={latest}
          inventory={inventory}
          settings={settings}
        />
      )}
    </motion.div>
  );
}

function InventoryRow({ 
  label, 
  loaded, 
  balance, 
  sold, 
  color, 
  isDark 
}: { 
  label: string, 
  loaded: number, 
  balance: number, 
  sold: number, 
  color: string, 
  isDark: boolean 
}) {
  const colorClass = color === 'cyan' ? 'text-cyan-500' : 'text-pink-500';
  return (
    <div className="flex justify-between items-center p-5">
      <span className={`font-black text-sm uppercase tracking-wider ${
        isDark ? 'text-slate-200' : 'text-slate-800'
      }`}>{label}</span>
      <div className="flex gap-6 text-right">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loaded</span>
          <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{loaded || 0}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bal</span>
          <span className={`font-black text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{balance || 0}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sold</span>
          <span className={`font-black text-sm ${colorClass}`}>{sold || 0}</span>
        </div>
      </div>
    </div>
  );
}

