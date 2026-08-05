import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

// Find the calculations block end
const calcEnd = content.indexOf('}, [entries, inventory, isWeekend, isHoliday, weatherCondition]);');
if (calcEnd !== -1) {
  const calcEndFull = calcEnd + '}, [entries, inventory, isWeekend, isHoliday, weatherCondition]);'.length;
  // Let's just fix everything after calculations until the return statement
  
  // Remove any leftover chartData or stray brackets
  content = content.replace(/\}, \[calculations\]\);\s*\}, \[entries, inventory, isWeekend, isHoliday, weatherCondition\]\);/, '  }, [entries, inventory, isWeekend, isHoliday, weatherCondition]);');
  content = content.replace(/\s*\/\/ Chart data formatting[\s\S]*?\}, \[calculations\]\);/, '');
}

fs.writeFileSync('src/pages/Planner.tsx', content);
