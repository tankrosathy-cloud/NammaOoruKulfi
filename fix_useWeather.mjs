import fs from 'fs';
let content = fs.readFileSync('src/lib/useWeather.ts', 'utf-8');
content = content.replace(/const \[weatherLoading, setWeatherLoading\] = useState\(false\);/, "const [weatherLoading, setWeatherLoading] = useState(false);\n  const [weatherError, setWeatherError] = useState<string | null>(null);");
content = content.replace(/setWeatherLoading\(true\);/, "setWeatherLoading(true);\n    setWeatherError(null);");
content = content.replace(/console\.error\(err\);/, "console.error(err);\n      setWeatherError('Failed to fetch weather');");
content = content.replace(/return \{ forecasts, weatherLoading, getWeatherForDate \};/, "return { forecasts, weatherLoading, weatherError, getWeatherForDate };");
fs.writeFileSync('src/lib/useWeather.ts', content);
