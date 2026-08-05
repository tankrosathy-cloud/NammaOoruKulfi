import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

const regex = /\{role === 'owner' && \(\s*<motion\.button[\s\S]*?<\/motion\.button>\s*\)\}\s*\{\/\* Quick Expense Modal \*\/\}\s*<QuickExpenseModal[\s\S]*?\/>/;
content = content.replace(regex, '');

fs.writeFileSync('src/AppShell.tsx', content);
