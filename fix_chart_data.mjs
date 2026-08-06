import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /const chartData = last7DaysEntries\.map\(e => \(\{\s*date: format\(parseISO\(e\.date\), 'dd MMM'\),\s*sales: Math\.max\(0, e\.actualAmount - \(e\.cashBagLoaded \|\| 0\) \+ \(e\.expenses \|\| 0\) \+ \(e\.additionalExpenses \|\| 0\) \+ \(e\.bonus \|\| 0\)\)\s*\}\)\);/;

const newCode = `const chartData = last7DaysEntries.map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      stickSold: e.stickSold || 0,
      potSold: e.potSold || 0
    }));`;

content = content.replace(regex, newCode);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
