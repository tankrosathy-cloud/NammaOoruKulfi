import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

const navItemRegex = /\s*<NavItem\s*icon=\{<Sparkles className="w-5 h-5" \/>\}\s*label="Planner"\s*active=\{activeTab === 'planner'\}\s*onClick=\{\(\) => navigateTab\('planner'\)\}\s*isDark=\{isDark\}\s*\/>/g;

content = content.replace(navItemRegex, "");

fs.writeFileSync('src/AppShell.tsx', content);
