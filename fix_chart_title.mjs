import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace("<BarChart3 className=\"w-4 h-4 text-cyan-500\" /> Last 7 Days Sales", "<BarChart3 className=\"w-4 h-4 text-cyan-500\" /> Last 7 Days Quantity Sold");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
