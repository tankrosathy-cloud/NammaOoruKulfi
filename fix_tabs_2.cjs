const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldSubTabs = `<div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStockSubView('history')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 \${
                stockSubView === 'history'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }\`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>10-Day Availability (11:59 PM)</span>
            </button>
            <button
              onClick={() => setStockSubView('inspector')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 \${
                stockSubView === 'inspector'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }\`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Daily Inspector</span>
            </button>
          </div>`;

const newSubTabs = `<div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStockSubView('history')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 \${
                stockSubView === 'history'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }\`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>10-Day Availability</span>
            </button>
            <button
              onClick={() => setStockSubView('inspector')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 \${
                stockSubView === 'inspector'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }\`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Daily Logs</span>
            </button>
          </div>`;

code = code.replace(oldSubTabs, newSubTabs);
fs.writeFileSync('src/pages/Settings.tsx', code);
