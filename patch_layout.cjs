const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /<div className="flex gap-3 mb-6">/,
  '<div className="flex flex-wrap gap-3 mb-6">'
);

// Add min-w-[130px] to each button
code = code.replace(
  /className={\`flex-1 p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer/g,
  'className={`flex-1 min-w-[130px] p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer'
);

fs.writeFileSync('src/pages/Reports.tsx', code);
