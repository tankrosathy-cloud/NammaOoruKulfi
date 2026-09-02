const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldHeader = `      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">
          {role === 'owner' ? 'Admin & Stock' : 'Inventory Management'}
        </h2>
        <p className="text-slate-550 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
          {role === 'owner' ? 'Manage Inventory, Stock History & App Configurations' : 'Live Stock Availability & Daily Deductions'}
        </p>
      </div>`;

const newHeader = `      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-slate-900 dark:text-white">
          {role === 'owner' ? 'Admin & Stock' : 'Inventory Management'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {role === 'owner' ? 'Manage inventory, stock history, and app configurations' : 'Live stock availability and daily deductions'}
        </p>
      </div>`;

const oldTabs = `<div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('settings')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap \${activeTab === 'settings' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap \${activeTab === 'inventory' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap \${activeTab === 'planner' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Planner</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap \${activeTab === 'export' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export</span>
          </button>
          {isAdminUser && (
            <button
              onClick={() => setActiveTab('database')}
              className={\`flex-1 min-w-[78px] sm:min-w-0 h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap \${activeTab === 'database' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}\`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Database</span>
            </button>
          )}
        </div>`;

const newTabs = `<div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('settings')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-10 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap \${activeTab === 'settings' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}\`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-10 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap \${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}\`}
          >
            <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-10 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap \${activeTab === 'planner' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}\`}
          >
            <Calendar className="w-4 h-4" />
            <span>Planner</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={\`flex-1 min-w-[78px] sm:min-w-0 h-10 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap \${activeTab === 'export' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}\`}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {isAdminUser && (
            <button
              onClick={() => setActiveTab('database')}
              className={\`flex-1 min-w-[78px] sm:min-w-0 h-10 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap \${activeTab === 'database' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}\`}
            >
              <Database className="w-4 h-4" />
              <span>Database</span>
            </button>
          )}
        </div>`;

code = code.replace(oldHeader, newHeader);
code = code.replace(oldTabs, newTabs);
fs.writeFileSync('src/pages/Settings.tsx', code);
