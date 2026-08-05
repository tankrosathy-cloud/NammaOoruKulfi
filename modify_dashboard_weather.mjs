import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

if (!content.includes('import { useWeather }')) {
  content = content.replace(
    "import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';",
    "import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';\nimport { useWeather } from '../lib/useWeather';\nimport { calculatePrediction } from '../lib/prediction';"
  );
}

// Replace the states in Dashboard.tsx
const oldStates = `  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [isWeekend, setIsWeekend] = useState(tomorrow.getDay() === 0 || tomorrow.getDay() === 6);
  const [isHoliday, setIsHoliday] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'normal' | 'hot' | 'rain'>('normal');

  const todayStr = format(new Date(), 'yyyy-MM-dd');`;

const newStates = `  const tomorrow = new Date();
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');`;

content = content.replace(oldStates, newStates);

// Replace nextDaySuggestion useMemo
const oldNextDaySuggestion = /const nextDaySuggestion = useMemo\(\(\) => \{[\s\S]*?hasData: true\s*\};\s*\}, \[entries, isWeekend, isHoliday, weatherCondition\]\);/;

const newNextDaySuggestion = `const nextDaySuggestion = useMemo(() => {
    const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition);
    return { ...result, multiplier: Math.round(result.multiplier * 100) };
  }, [entries, isWeekend, isHoliday, weatherCondition]);`;

content = content.replace(oldNextDaySuggestion, newNextDaySuggestion);

// Find where setWeatherCondition('hot') etc is called and add setUserOverrodeWeather(true)
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('hot'\)\}/g, "onClick={() => { setWeatherCondition('hot'); setUserOverrodeWeather(true); }}");
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('rain'\)\}/g, "onClick={() => { setWeatherCondition('rain'); setUserOverrodeWeather(true); }}");
content = content.replace(/onClick=\{\(\) => setWeatherCondition\('normal'\)\}/g, "onClick={() => { setWeatherCondition('normal'); setUserOverrodeWeather(true); }}");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
