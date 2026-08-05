import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /  const \[isHoliday, setIsHoliday\] = useState\(false\);\s*const \[weatherCondition, setWeatherCondition\] = useState\<'normal' \| 'hot' \| 'rain'\>\('normal'\);\s*const tomorrow = new Date\(\);\s*tomorrow\.setDate\(tomorrow\.getDate\(\) \+ 1\);\s*const \[isWeekend, setIsWeekend\] = useState\(tomorrow\.getDay\(\) === 0 \|\| tomorrow\.getDay\(\) === 6\);/m;

const replacement = `  const tomorrow = new Date();
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
  }, [autoWeather, userOverrodeWeather]);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
