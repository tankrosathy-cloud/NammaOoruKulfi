import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const regex = /  const handleCopySummary = \(\) => \{[\s\S]*?\}\s*catch \(err\) \{[\s\S]*?\}\s*\};/;
// Wait, that regex failed because I had already removed parts of it.
// Let's remove everything between `  }, [entries, inventory, isWeekend, isHoliday, weatherCondition]);` and `  if (loading) {`

const startStr = '  }, [entries, inventory, isWeekend, isHoliday, weatherCondition]);';
const endStr = '  if (loading) {';

const start = content.indexOf(startStr);
const end = content.indexOf(endStr);

if (start !== -1 && end !== -1) {
  content = content.substring(0, start + startStr.length) + '\n\n' + content.substring(end);
}

fs.writeFileSync('src/pages/Planner.tsx', content);
