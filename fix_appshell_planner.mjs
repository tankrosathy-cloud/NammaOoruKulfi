import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

// Remove Planner import
content = content.replace("import Planner from './pages/Planner';\n", "");

// Remove planner from activeTab type
content = content.replace(/const \[activeTab, setActiveTab\] = useState\<'dashboard' \| 'add' \| 'expense' \| 'reports' \| 'planner' \| 'settings' \| 'logs'\>\(role === 'owner' \? 'dashboard' : 'add'\);/, 
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs'>(role === 'owner' ? 'dashboard' : 'add');");
  
content = content.replace(/const navigateTab = \(tab: 'dashboard' \| 'add' \| 'expense' \| 'reports' \| 'planner' \| 'settings' \| 'logs'\) => \{/,
  "const navigateTab = (tab: 'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs') => {");

// Remove planner from the nav menu array
const navItemsRegex = /\{\s*id: 'planner',\s*icon: <Sparkles className="w-5 h-5" \/>,\s*label: 'Planner'\s*\},\n\s*/;
content = content.replace(navItemsRegex, "");

// Remove Planner view case
const plannerViewRegex = /\{activeTab === 'planner' && <Planner \/>\}\s*\n\s*/;
content = content.replace(plannerViewRegex, "");

fs.writeFileSync('src/AppShell.tsx', content);
