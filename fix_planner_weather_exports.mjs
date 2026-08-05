import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

content = content.replace(
  "const { getWeatherForDate, weatherLoading } = useWeather();",
  "const { getWeatherForDate, weatherLoading, weatherError, forecasts } = useWeather();"
);

fs.writeFileSync('src/pages/Planner.tsx', content);
