const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add useSpecialOrders to imports
code = code.replace(
  "import { useEntries, useSettings, useExpenses, useInventory } from '../store';",
  "import { useEntries, useSettings, useExpenses, useInventory, useSpecialOrders } from '../store';"
);

// 2. Destructure specialOrders
code = code.replace(
  "const { expenses, loading: expensesLoading } = useExpenses();",
  "const { expenses, loading: expensesLoading } = useExpenses();\n  const { specialOrders } = useSpecialOrders();"
);

// 3. Update stats useMemo calculation
const targetStats = `    entries.forEach(e => {
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
          monthlyShortage += (e.shortage || 0);
        }
        
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });`;

const newStats = `    entries.forEach(e => {
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
          monthlyShortage += (e.shortage || 0);
        }
        
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });

    // Add special orders profit (event orders)
    specialOrders.forEach(order => {
      const revenue = order.amountReceived || 0;
      lifetimeRevenue += revenue;

      if (order.date === todayStr) {
        todayRevenue += revenue;
      }

      try {
        const date = parseISO(order.date);
        
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          monthlyRevenue += revenue;
        }
        
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          weekRevenue += revenue;
        }
      } catch (err) {}
    });`;

code = code.replace(targetStats, newStats);

// 4. Update monthly sales trend logic
const targetTrend = `    const monthlySalesTrend = currentMonthEntries.map(e => {
      const sales = Math.max(0, e.actualAmount - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      return {
        date: format(parseISO(e.date), 'dd MMM'),
        Sales: sales
      };
    });`;

const newTrend = `    // Combine special orders with current month entries for sales trend
    const currentMonthSpecials = specialOrders.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
      } catch {
        return false;
      }
    });
    
    // Group sales by date
    const salesByDate = {};
    
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
    });`;

code = code.replace(targetTrend, newTrend);

// Need to update dependency array for useMemo stats!
code = code.replace(
  "}, [entries, expenses]);",
  "}, [entries, expenses, specialOrders]);"
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
