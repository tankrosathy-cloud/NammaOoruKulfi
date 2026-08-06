import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
  /calculatePrediction\(entries, isWeekend, isHoliday, weatherCondition, tomorrowStr\)/,
  "calculatePrediction(entries, isWeekend, isHoliday, weatherCondition, 'normal', tomorrowStr)"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
