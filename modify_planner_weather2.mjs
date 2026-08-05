import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

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

content = content.replace(/<div className="space-y-3">\s*<Label className="text-\[10px\].*?Manual Booster[\s\S]*?<\/div>/, '');

fs.writeFileSync('src/pages/Planner.tsx', content);
