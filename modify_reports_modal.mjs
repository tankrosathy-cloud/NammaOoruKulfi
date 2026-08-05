import fs from 'fs';
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

const modalCode = `
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewEntry(null)}>
          <div className={\`w-full max-w-md p-6 rounded-3xl shadow-xl overflow-hidden \${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}\`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={\`text-lg font-black uppercase tracking-wider \${isDark ? 'text-white' : 'text-slate-900'}\`}>
                {viewEntry.category ? 'Expense Details' : 'Entry Details'}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setViewEntry(null)}>
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {viewEntry.category ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                      <p className={\`font-black text-sm text-pink-500\`}>{viewEntry.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid By</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.paidBy}</p>
                    </div>
                  </div>
                  {viewEntry.notes && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes</p>
                      <p className={\`text-sm font-medium \${isDark ? 'text-slate-300' : 'text-slate-700'}\`}>{viewEntry.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Sales</p>
                      <p className={\`font-black text-sm text-cyan-500\`}>{formatCurrency(viewEntry.actualAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Sold</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.stickSold} pcs</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Sold</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.potSold} pcs</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PhonePe</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.phonePe)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shortage</p>
                      <p className={\`font-black text-sm \${viewEntry.shortage > 0 ? 'text-pink-500' : isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.shortage)}</p>
                    </div>
                  </div>
                  {viewEntry.expenseDetails && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Expense Details</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{viewEntry.expenseDetails}</p>
                    </div>
                  )}
                  {viewEntry.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug uppercase">{viewEntry.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/m, "</div>\n" + modalCode + "\n}");

fs.writeFileSync('src/pages/Reports.tsx', content);
