import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

// The block starts with {/* Floating Action Button for Quick Job - All users */}
// And we need to remove everything up to <nav className
const regex = /\{\/\* Floating Action Button for Quick Job - All users \*\/\}\s*\{activeTab !== 'add' && \(\s*<motion\.button[\s\S]*?<\/motion\.button>\s*/;
content = content.replace(regex, '');

fs.writeFileSync('src/AppShell.tsx', content);
