import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

content = content.replace(
  /<div>\s*<h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">\{role === 'owner' \? 'Admin' : 'Inventory'\}<\/h2>\s*<p className="text-slate-750 dark:text-slate-400 text-\[10px\] font-extrabold uppercase tracking-widest">\{role === 'owner' \? 'Manage App & Stock' : 'Global Stock Levels'\}<\/p>\s*<\/div>/,
  `{activeTab !== 'planner' && (
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">{role === 'owner' ? 'Admin' : 'Inventory'}</h2>
          <p className="text-slate-750 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">{role === 'owner' ? 'Manage App & Stock' : 'Global Stock Levels'}</p>
        </div>
      )}`
);

fs.writeFileSync('src/pages/Settings.tsx', content);
