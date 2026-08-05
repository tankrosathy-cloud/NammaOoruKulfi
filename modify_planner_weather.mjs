import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

if (!content.includes('import { useWeather }')) {
  content = content.replace(
    "import { useTheme } from '../context/ThemeContext';",
    "import { useTheme } from '../context/ThemeContext';\nimport { useWeather } from '../lib/useWeather';\nimport { calculatePrediction } from '../lib/prediction';"
  );
}

// Remove the old weather fetching
const weatherStateStart = content.indexOf('// Live weather sync states');
const weatherStateEnd = content.indexOf('const loading = entriesLoading || inventoryLoading;');

if (weatherStateStart !== -1 && weatherStateEnd !== -1) {
  content = content.substring(0, weatherStateStart) +
    `const { getWeatherForDate, weatherLoading } = useWeather();
  const autoWeather = getWeatherForDate(targetDate);
  
  const [userOverrodeWeather, setUserOverrodeWeather] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'normal' | 'hot' | 'rain'>('normal');
  const [isHoliday, setIsHoliday] = useState(false);
  
  useEffect(() => {
    setUserOverrodeWeather(false);
  }, [targetDate]);

  useEffect(() => {
    if (!userOverrodeWeather && autoWeather) {
      setWeatherCondition(autoWeather === 'rainy' ? 'rain' : autoWeather);
    }
  }, [autoWeather, userOverrodeWeather]);
  
  ` + content.substring(weatherStateEnd);
}

// Update the auto-detect weekend logic (getDay is already used, we can just compute it)
const autoWeekendRegex = /\/\/ Auto-detect weekend if target date is Saturday\/Sunday[\s\S]*?\}, \[targetDayOfWeekIndex\]\);/;
content = content.replace(autoWeekendRegex, `// Auto-detect weekend if target date is Saturday/Sunday
  const targetDayOfWeekIndex = useMemo(() => {
    try {
      return getDay(parseISO(targetDate));
    } catch {
      return 1;
    }
  }, [targetDate]);
  const targetDayName = DAYS_OF_WEEK[targetDayOfWeekIndex];
  const isWeekend = targetDayOfWeekIndex === 0 || targetDayOfWeekIndex === 6;`);

// Find old predictions logic
const calculationsRegex = /\/\/ Calculations[\s\S]*?shortagePot\s*\};\s*\}, \[entries, inventory, targetDate, weather, event, manualBooster, histAvgStick, histAvgPot, dayOfWeekAvgStick, dayOfWeekAvgPot, recent7DayAvgStick, recent7DayAvgPot\]\);/;

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

content = content.replace(calculationsRegex, newCalculations);

// Remove "Comparison Metrics" chart
const chartRegex = /\{\/\* Graphical comparison bar chart \*\/\}.*?<\/Card>/s;
content = content.replace(chartRegex, '');

// Remove "Daily Preparation Task List" chart
const prepRegex = /\{\/\* Action Planner Checklist \*\/\}.*?<\/Card>/s;
content = content.replace(prepRegex, '');

// Also remove `chartData` because it won't be used
const chartDataRegex = /const chartData = \[[\s\S]*?\];/;
content = content.replace(chartDataRegex, '');

// Fix any missing weather state usage (weather -> weatherCondition, event -> isWeekend/isHoliday, manualBooster)
content = content.replace(/weather === 'hot'/g, "weatherCondition === 'hot'");
content = content.replace(/weather === 'rainy'/g, "weatherCondition === 'rain'");
content = content.replace(/setWeather\(/g, "setWeatherCondition(");
content = content.replace(/event === 'weekend'/g, "isWeekend");
content = content.replace(/event === 'festival'/g, "isHoliday");
content = content.replace(/setEvent\('festival'\)/g, "setIsHoliday(true)");
content = content.replace(/setEvent\('normal'\)/g, "setIsHoliday(false)");
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('hot'\)\}/g, "onClick={() => { setWeatherCondition('hot'); setUserOverrodeWeather(true); }}");
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('rain'\)\}/g, "onClick={() => { setWeatherCondition('rain'); setUserOverrodeWeather(true); }}");
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('normal'\)\}/g, "onClick={() => { setWeatherCondition('normal'); setUserOverrodeWeather(true); }}");

fs.writeFileSync('src/pages/Planner.tsx', content);
