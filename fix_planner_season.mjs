import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

// Add season state
content = content.replace(
  /const \[isHoliday, setIsHoliday\] = useState\(false\);/,
  "const [isHoliday, setIsHoliday] = useState(false);\n  const [season, setSeason] = useState<'summer' | 'winter' | 'monsoon' | 'spring' | 'normal'>('normal');"
);

// Update calculation call
content = content.replace(
  /const result = calculatePrediction\(entries, isWeekend, isHoliday, weatherCondition, targetDate\);/,
  "const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition, season, targetDate);"
);

fs.writeFileSync('src/pages/Planner.tsx', content);
