import React, { useMemo } from 'react';
import { useEntries, useSettings, useExpenses } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Package, AlertCircle, BarChart3, PieChart as PieIcon, Activity, Sparkles } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { entries, loading: entriesLoading } = useEntries();
  const { expenses, loading: expensesLoading } = useExpenses();
  const loading = entriesLoading || expensesLoading;
  const { settings } = useSettings();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

    entries.forEach(e => {
      const revenue = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      const expenses = (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0);
      
      lifetimeRevenue += revenue;
      
      if (e.date === todayStr) {
        todayRevenue += revenue;
      }
      
      try {
        const date = parseISO(e.date);
        
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          monthlyRevenue += revenue;
          monthlyExpenses += expenses;
        }
        
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });
    
    const last7DaysEntries = sorted.slice(0, 7).reverse();
    const chartData = last7DaysEntries.map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      sales: Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0))
    }));

    // Current Month Daily Sales Trend
    const currentMonthEntries = entries
      .filter(e => {
        try {
          const date = parseISO(e.date);
          return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthlySalesTrend = currentMonthEntries.map(e => {
      const sales = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      return {
        date: format(parseISO(e.date), 'dd MMM'),
        Sales: sales
      };
    });

    // Current Month Expense Distribution
    const expenseCategoriesMap: Record<string, number> = {};

    expenses.forEach(e => {
      try {
        const date = parseISO(e.date);
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          const category = e.category || 'Others';
          expenseCategoriesMap[category] = (expenseCategoriesMap[category] || 0) + e.amount;
        }
      } catch (err) {}
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
      todayRevenue,
      weekRevenue,
      monthlyRevenue,
      lifetimeRevenue,
      monthlyExpenses,
      monthlyNet: monthlyRevenue - monthlyExpenses,
      chartData,
      monthlySalesTrend,
      expenseDistribution
    };
  }, [entries, expenses]);

  const nextDaySuggestion = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { stick: 40, pot: 25, avgStick: 35, avgPot: 20, hasData: false };
    }
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const recentEntries = sorted.slice(0, 5);

    const totalStick = recentEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPot = recentEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);

    const avgStick = Math.round(totalStick / recentEntries.length);
    const avgPot = Math.round(totalPot / recentEntries.length);

    // 15% safety buffer, rounded up to nearest 5
    const suggestStickVal = Math.max(10, Math.ceil((avgStick * 1.15) / 5) * 5);
    const suggestPotVal = Math.max(10, Math.ceil((avgPot * 1.15) / 5) * 5);

    return {
      stick: suggestStickVal,
      pot: suggestPotVal,
      avgStick,
      avgPot,
      hasData: true
    };
  }, [entries]);

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
    <div className="p-6 space-y-8 pb-32">
      <div>
        <h2 className={`text-3xl font-black tracking-tighter uppercase mb-1 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>Overview</h2>
        <p className={`${labelColor} text-[10px] font-bold uppercase tracking-widest`}>Monthly performance & current inventory</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className={cardBg}>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-600 dark:text-cyan-400`}>Today</p>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{formatCurrency(stats.todayRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card className={cardBg}>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-600 dark:text-pink-400`}>This Week</p>
            <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{formatCurrency(stats.weekRevenue)}</div>
          </CardContent>
        </Card>

        <Card className={cardBg}>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Month
            </p>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card className={cardBg}>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">Lifetime</p>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{formatCurrency(stats.lifetimeRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
              <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-black leading-none text-pink-600 dark:text-pink-400">{formatCurrency(stats.monthlyExpenses)}</div>
            <p className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
      </div>

      {/* Current Month Analytics (Trends & Distribution) */}
      <div className="space-y-6">
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
      </div>

      {stats.chartData.length > 0 && (
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>
              <BarChart3 className="w-4 h-4 text-cyan-500" /> Last 7 Days Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
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
                    tickFormatter={(value) => `₹${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#0f172a'
                    }}
                    itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                    labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 1 ? '#06b6d4' : (isDark ? '#334155' : '#cbd5e1')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {nextDaySuggestion.hasData && (
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

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center`}>
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Stick Kulfi Suggestion</span>
                <span className="text-3xl font-black text-cyan-500 leading-none mt-1">{nextDaySuggestion.stick} <span className="text-xs font-bold text-slate-400">pcs</span></span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Avg Sales: {nextDaySuggestion.avgStick} pcs</span>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center`}>
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Pot Kulfi Suggestion</span>
                <span className="text-3xl font-black text-pink-500 leading-none mt-1">{nextDaySuggestion.pot} <span className="text-xs font-bold text-slate-400">pcs</span></span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Avg Sales: {nextDaySuggestion.avgPot} pcs</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
              <span className="font-black">💡 Recommendation Note:</span>
              <span>A 15% safety stock buffer is auto-included and rounded up to the nearest multiple of 5.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {latest ? (
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
              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                isDark 
                  ? 'text-cyan-100 bg-cyan-900/30 border border-cyan-800' 
                  : 'text-cyan-700 bg-cyan-50 border border-cyan-100'
              }`}>
                {format(parseISO(latest.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              <InventoryRow label="Stick Kulfi" loaded={latest.stickLoaded} balance={latest.stickBalance} sold={latest.stickSold} color="cyan" isDark={isDark} />
              <InventoryRow label="Pot Kulfi" loaded={latest.potLoaded} balance={latest.potBalance} sold={latest.potSold} color="pink" isDark={isDark} />
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
      ) : (
        <Card className={cardBg}>
          <CardContent className="p-8 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
            No entries found. Add an entry to see inventory stats.
          </CardContent>
        </Card>
      )}
    </div>
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

