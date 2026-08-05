import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

const targetExpenseFAB = `{/* Floating Action Button for Quick Expense - Owner only */}
      {activeTab !== 'expense' && role === 'owner' && (
        <motion.button
          onClick={() => setIsQuickExpenseOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(239,68,68,0.35)] dark:shadow-[0_8px_30px_rgba(239,68,68,0.5)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          title="Quick Expense Entry"
        >
          <Coins className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">⚡</span>
        </motion.button>
      )}`;

const newFABs = `{/* Floating Action Button for Quick Job - All users */}
      {activeTab !== 'add' && (
        <motion.button
          onClick={() => navigateTab('add')}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={\`fixed \${activeTab !== 'expense' && role === 'owner' ? 'bottom-40' : 'bottom-24'} right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(6,182,212,0.35)] dark:shadow-[0_8px_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50\`}
          title="Quick Job Entry"
        >
          <PlusCircle className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">⚡</span>
        </motion.button>
      )}

      {/* Floating Action Button for Quick Expense - Owner only */}
      {activeTab !== 'expense' && role === 'owner' && (
        <motion.button
          onClick={() => setIsQuickExpenseOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(239,68,68,0.35)] dark:shadow-[0_8px_30px_rgba(239,68,68,0.5)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          title="Quick Expense Entry"
        >
          <Coins className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">⚡</span>
        </motion.button>
      )}`;

content = content.replace(targetExpenseFAB, newFABs);
fs.writeFileSync('src/AppShell.tsx', content);
