import fs from 'fs';

let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// 1. Update useMemo
code = code.replace(
  /\/\/ Calculate Net Savings: Total Revenue - Total Expenses\s*totals\.finalAmount = totals\.revenue - totals\.expenses;\s*return \{ filteredEntries: filtered, filteredExpenses: filteredExps, chartData, totals \};\s*\}, \[entries, expenses, currentDate\]\);/,
  `// Calculate Net Savings: Total Revenue - Total Expenses
    totals.finalAmount = totals.revenue - totals.expenses;
    
    let profitTaken = 0;
    filteredProfs.forEach(p => {
      profitTaken += p.amount;
    });
    const retainedEarnings = totals.finalAmount - profitTaken;

    return { filteredEntries: filtered, filteredExpenses: filteredExps, filteredProfits: filteredProfs, chartData, totals, profitTaken, retainedEarnings };
  }, [entries, expenses, profitWithdrawals, currentDate]);`
);

// 2. Add handlers
const handlers = `
  const handleProfitSubmit = async () => {
    if (!profitForm.amount) return;
    try {
      await saveProfitWithdrawal({
        id: Date.now().toString(),
        date: profitForm.date,
        amount: Number(profitForm.amount),
        notes: profitForm.notes
      });
      setShowProfitModal(false);
      setProfitForm({ amount: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProfit = async (id: string) => {
    await deleteProfitWithdrawal(id);
    setProfitDeleteConfirmId(null);
  };
`;

code = code.replace(
  /const handleDelete = async \(id: string\) => \{/,
  handlers + "\n  const handleDelete = async (id: string) => {"
);

// 3. Update tabs
const newTabs = `
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-sm mb-6 border border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={() => setActiveListTab('entries')}
            className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${activeListTab === 'entries' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}\`}
          >
            Sales List
          </button>
          <button 
            onClick={() => setActiveListTab('expenses')}
            className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${activeListTab === 'expenses' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}\`}
          >
            Expense List
          </button>
          {isOwner && (
          <button 
            onClick={() => setActiveListTab('profits')}
            className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${activeListTab === 'profits' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}\`}
          >
            Profits
          </button>
          )}
        </div>
`;
code = code.replace(
  /<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-xs mb-6 border border-slate-200\/50 dark:border-slate-700\/50">[\s\S]*?<\/div>/,
  newTabs
);

// 4. Update the summary cards to show Retained Earnings
const newCards = `
        {isOwner && (
          <>
            <Card className={isDark ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-emerald-100/90 border-emerald-300 shadow-sm shadow-emerald-100/30'}>
              <CardContent className="p-5">
                <p className={\`text-[10px] uppercase tracking-widest mb-2 \${isDark ? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black'}\`}>Net Savings</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(totals.finalAmount)}</p>
              </CardContent>
            </Card>
            
            <Card className={isDark ? 'bg-fuchsia-950/40 border-fuchsia-900/50 relative overflow-hidden' : 'bg-fuchsia-100/90 border-fuchsia-300 shadow-sm shadow-fuchsia-100/30 relative overflow-hidden'}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={\`text-[10px] uppercase tracking-widest mb-2 \${isDark ? 'text-fuchsia-400 font-bold' : 'text-fuchsia-800 font-black'}\`}>Profit Taken</p>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(profitTaken)}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={\`h-8 w-8 rounded-full \${isDark ? 'bg-fuchsia-900/50 border-fuchsia-700/50 hover:bg-fuchsia-800/50 text-fuchsia-300' : 'bg-fuchsia-200 border-fuchsia-300 hover:bg-fuchsia-300 text-fuchsia-900'}\`}
                    onClick={() => setShowProfitModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-indigo-100/90 border-indigo-300 shadow-sm shadow-indigo-100/30'}>
              <CardContent className="p-5">
                <p className={\`text-[10px] uppercase tracking-widest mb-2 \${isDark ? 'text-indigo-400 font-bold' : 'text-indigo-800 font-black'}\`}>Retained Earnings</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(retainedEarnings)}</p>
              </CardContent>
            </Card>
          </>
        )}
`;

code = code.replace(
  /\{isOwner && \(\s*<Card className=\{isDark \? 'bg-emerald-950\/40 border-emerald-900\/50' : 'bg-emerald-100\/90 border-emerald-300 shadow-sm shadow-emerald-100\/30'\}>\s*<CardContent className="p-5">\s*<p className=\{`text-\[10px\] uppercase tracking-widest mb-2 \$\{isDark \? 'text-emerald-400 font-bold' : 'text-emerald-800 font-black'\}`\}>Net Savings<\/p>\s*<p className="text-2xl font-black text-slate-950 dark:text-white">\{formatCurrency\(totals\.finalAmount\)\}<\/p>\s*<\/CardContent>\s*<\/Card>\s*\)\}/g,
  newCards
);

// 5. Add profit list 
const newProfitsList = `
        {activeListTab === 'profits' && isOwner && (
          <div className="space-y-4">
            {filteredProfits.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No profit withdrawals logged this month.</p>
            ) : (
              filteredProfits.map((profit) => (
                <div key={profit.id} className={\`p-4 rounded-xl \${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}\`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {formatCurrency(profit.amount)}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {format(parseISO(profit.date), 'dd MMM yyyy')}
                        </span>
                      </p>
                      {profit.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{profit.notes}</p>
                      )}
                    </div>
                    {profitDeleteConfirmId === profit.id ? (
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProfit(profit.id)}>Confirm</Button>
                        <Button variant="ghost" size="sm" onClick={() => setProfitDeleteConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setProfitDeleteConfirmId(profit.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
`;

code = code.replace(
  /(\{activeListTab === 'expenses' && \([\s\S]*?<\/div>\s*\)\s*\})/,
  "$1\n" + newProfitsList
);

// 6. Add modal 
const modalCode = `
      {showProfitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className={\`w-full max-w-md \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}\`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Log Profit Taken</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowProfitModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={profitForm.date} 
                    onChange={(e) => setProfitForm({...profitForm, date: e.target.value})}
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={profitForm.amount} 
                    onChange={(e) => setProfitForm({...profitForm, amount: e.target.value})}
                    placeholder="e.g. 10000"
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input 
                    type="text" 
                    value={profitForm.notes} 
                    onChange={(e) => setProfitForm({...profitForm, notes: e.target.value})}
                    placeholder="e.g. Monthly withdrawal"
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <Button className="w-full mt-4" onClick={handleProfitSubmit}>
                  Save Profit Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
`;

code = code.replace(
  /<\/div>\s*<\/div>\s*$/g,
  modalCode + "\n    </div>\n  </div>\n"
);

fs.writeFileSync('src/pages/Reports.tsx', code);
