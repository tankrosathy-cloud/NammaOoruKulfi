import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

// Remove QuickExpenseModal import
const quickExpenseImportRegex = /import QuickExpenseModal from '.\/components\/QuickExpenseModal';\n?/;
content = content.replace(quickExpenseImportRegex, '');

// Remove isQuickExpenseOpen state
const isQuickExpenseStateRegex = /const \[isQuickExpenseOpen, setIsQuickExpenseOpen\] = useState\(false\);\n?/;
content = content.replace(isQuickExpenseStateRegex, '');

// Remove the floating button
const quickExpenseButtonRegex = /\{role === 'owner' && \(\s*<motion\.button[\s\S]*?<\/motion\.button>\s*\)\}\s*\{\/\* Quick Expense Modal \*\/\}\s*<QuickExpenseModal[\s\S]*?\/>/;
content = content.replace(quickExpenseButtonRegex, '');

fs.writeFileSync('src/AppShell.tsx', content);
