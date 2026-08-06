import fs from 'fs';
let content = fs.readFileSync('src/lib/prediction.ts', 'utf-8');

const regex = /export function calculatePrediction\(\s*entries: DailyEntry\[\],\s*isWeekend: boolean,\s*isHoliday: boolean,\s*weatherCondition: 'normal' \| 'hot' \| 'rain' \| 'rainy',\s*targetDateStr\?: string\s*\) \{/;

const newCode = `export function calculatePrediction(
  entries: DailyEntry[], 
  isWeekend: boolean, 
  isHoliday: boolean, 
  weatherCondition: 'normal' | 'hot' | 'rain' | 'rainy',
  season: 'summer' | 'winter' | 'monsoon' | 'spring' | 'normal' = 'normal',
  targetDateStr?: string
) {`;

content = content.replace(regex, newCode);

const multiplierRegex = /let multiplier = 1\.0;\s*if \(isWeekend\) multiplier \+= 0\.20; \/\/ 20% increase on weekends\s*if \(isHoliday\) multiplier \+= 0\.30; \/\/ 30% increase on holidays\s*if \(weatherCondition === 'hot'\) multiplier \+= 0\.15; \/\/ 15% increase on hot days\s*if \(weatherCondition === 'rain' \|\| weatherCondition === 'rainy'\) multiplier -= 0\.30; \/\/ 30% decrease on rainy days/;

const newMultiplierCode = `let multiplier = 1.0;
  if (isWeekend) multiplier += 0.20; // 20% increase on weekends
  if (isHoliday) multiplier += 0.30; // 30% increase on holidays
  if (weatherCondition === 'hot') multiplier += 0.15; // 15% increase on hot days
  if (weatherCondition === 'rain' || weatherCondition === 'rainy') multiplier -= 0.30; // 30% decrease on rainy days
  
  if (season === 'summer') multiplier += 0.25;
  if (season === 'winter') multiplier -= 0.15;
  if (season === 'monsoon') multiplier -= 0.10;
  if (season === 'spring') multiplier += 0.05;
`;

content = content.replace(multiplierRegex, newMultiplierCode);

fs.writeFileSync('src/lib/prediction.ts', content);
