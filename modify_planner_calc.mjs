import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const calcRegex = /\/\/ Calculations\s*const calculations = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/g;

const newCalculations = `// Calculations
  const calculations = useMemo(() => {
    const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition);
    
    // Calculate shortage based on current stock
    const availableStick = inventory?.stickQuantity || 0;
    const availablePot = inventory?.potQuantity || 0;
    
    return {
      histAvgStick: result.avgStick,
      histAvgPot: result.avgPot,
      dayOfWeekAvgStick: result.avgStick,
      dayOfWeekAvgPot: result.avgPot,
      recent7DayAvgStick: result.avgStick,
      recent7DayAvgPot: result.avgPot,
      predictedStick: result.stick,
      predictedPot: result.pot,
      availableStick,
      availablePot,
      shortageStick: Math.max(0, result.stick - availableStick),
      shortagePot: Math.max(0, result.pot - availablePot),
      multiplier: result.multiplier,
      hasData: result.hasData
    };
  }, [entries, inventory, isWeekend, isHoliday, weatherCondition]);`;

content = content.replace(calcRegex, newCalculations);

// Remove the manualBooster section
const manualBoosterRegex = /<div className="space-y-3">\s*<Label className="text-\[10px\] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Manual Booster \(\+\/-\)<\/Label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
content = content.replace(manualBoosterRegex, '');

content = content.replace(/const \[manualBooster, setManualBooster\] = useState<number>\(0\);/, '');

fs.writeFileSync('src/pages/Planner.tsx', content);
