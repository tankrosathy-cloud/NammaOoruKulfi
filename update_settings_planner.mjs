import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Add import
content = content.replace(
  "import { InventoryStock } from '../types';",
  "import { InventoryStock } from '../types';\nimport Planner from './Planner';"
);

// Add planner to state
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'settings' | 'inventory'>(role === 'owner' ? 'settings' : 'inventory');",
  "const [activeTab, setActiveTab] = useState<'settings' | 'inventory' | 'planner'>(role === 'owner' ? 'settings' : 'inventory');"
);

// Add tab button
const buttonsRegex = /<button\s*onClick=\{\(\) => setActiveTab\('settings'\)\}\s*className=\{`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer \$\{activeTab === 'settings' \? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'\}`\}\s*>\s*Settings\s*<\/button>\s*<button\s*onClick=\{\(\) => setActiveTab\('inventory'\)\}\s*className=\{`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer \$\{activeTab === 'inventory' \? 'bg-pink-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'\}`\}\s*>\s*Inventory\s*<\/button>/;

const newButtons = `<button
            onClick={() => setActiveTab('settings')}
            className={\`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer \${activeTab === 'settings' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={\`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer \${activeTab === 'inventory' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={\`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer \${activeTab === 'planner' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            Planner
          </button>`;

content = content.replace(buttonsRegex, newButtons);

// Add planner view block right before the main div closes
const plannerBlock = `
      {activeTab === 'planner' && (
        <Planner />
      )}
`;

content = content.replace(/(?:\s*\{\/\* modals \*\/\})?(\s*\{parsedInvoice && \()/g, plannerBlock + "$1");

fs.writeFileSync('src/pages/Settings.tsx', content);
