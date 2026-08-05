import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

content = content.replace(/type="number"/g, 'type="text" inputMode="numeric"');

fs.writeFileSync('src/pages/Settings.tsx', content);
