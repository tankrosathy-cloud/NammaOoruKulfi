import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf-8');
content = content.replace(/stickBalance: number;/g, 'stickBalance?: number;');
content = content.replace(/potBalance: number;/g, 'potBalance?: number;');
content = content.replace(/stickBalance: (number \| null);/g, 'stickBalance?: number;');
fs.writeFileSync('src/types.ts', content);
