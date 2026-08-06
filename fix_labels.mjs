import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace("<Package className=\"w-3 h-3\" /> Stick Sold", "<Package className=\"w-3 h-3\" /> Stick Sold (Month)");
content = content.replace("<Package className=\"w-3 h-3\" /> Pot Sold", "<Package className=\"w-3 h-3\" /> Pot Sold (Month)");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
