const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// 1. Add "Special Orders" tab
const newTabs = `
          {isOwner && (
          <button 
            onClick={() => setActiveListTab('specials')}
            className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-all \${activeListTab === 'specials' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}\`}
          >
            Special Orders
          </button>
          )}
`;
code = code.replace(
  /\{\s*isOwner && \(\s*<button\s*onClick=\{.*?\}\s*className=\{.*?\}>\s*Profits\s*<\/button>\s*\)\s*\}/,
  (match) => match + "\n" + newTabs
);

// Add a button below tabs to "Log Special Order" when viewing the tab
const tabWrapper = `
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-2xl border border-slate-200/50 dark:border-slate-700/50">
`;
code = code.replace(
  /<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-sm mb-6 border border-slate-200\/50 dark:border-slate-700\/50">/,
  tabWrapper
);

code = code.replace(
  /<\/div>\s*<div className="space-y-4">/,
  `        </div>
        {activeListTab === 'specials' && isOwner && (
          <Button onClick={() => setShowSpecialModal(true)} className="ml-4 gap-2">
            <Plus className="w-4 h-4" /> Log Event Order
          </Button>
        )}
      </div>
      <div className="space-y-4">`
);


// 2. Add special orders list
const newSpecialList = `
        {activeListTab === 'specials' && isOwner && (
          <div className="space-y-4">
            {filteredSpecials.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No special orders logged this month.</p>
            ) : (
              filteredSpecials.map((order) => (
                <div key={order.id} className={\`p-4 rounded-xl \${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}\`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {order.eventType} - {formatCurrency(order.amountReceived)}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {format(parseISO(order.date), 'dd MMM yyyy')}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Sold: {order.stickQuantity} Stick, {order.potQuantity} Pot
                      </p>
                      {order.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">{order.notes}</p>
                      )}
                    </div>
                    {specialDeleteConfirmId === order.id ? (
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSpecial(order)}>Confirm</Button>
                        <Button variant="ghost" size="sm" onClick={() => setSpecialDeleteConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setSpecialDeleteConfirmId(order.id)}>
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
  /(\{activeListTab === 'profits' && isOwner && \([\s\S]*?<\/div>\s*\)\s*\})/,
  "$1\n" + newSpecialList
);


// 3. Add modal UI
const newModal = `
      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className={\`w-full max-w-md max-h-[90vh] overflow-y-auto \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}\`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Log Event / Bulk Order</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowSpecialModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={specialForm.date} 
                    onChange={(e) => setSpecialForm({...specialForm, date: e.target.value})}
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Input 
                    type="text" 
                    value={specialForm.eventType} 
                    onChange={(e) => setSpecialForm({...specialForm, eventType: e.target.value})}
                    placeholder="e.g. Birthday, Marriage"
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sticks Taken</Label>
                    <Input 
                      type="number" 
                      value={specialForm.stickQuantity} 
                      onChange={(e) => setSpecialForm({...specialForm, stickQuantity: e.target.value})}
                      placeholder="e.g. 50"
                      className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                    />
                  </div>
                  <div>
                    <Label>Pots Taken</Label>
                    <Input 
                      type="number" 
                      value={specialForm.potQuantity} 
                      onChange={(e) => setSpecialForm({...specialForm, potQuantity: e.target.value})}
                      placeholder="e.g. 20"
                      className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                    />
                  </div>
                </div>
                <div>
                  <Label>Amount Received (₹)</Label>
                  <Input 
                    type="number" 
                    value={specialForm.amountReceived} 
                    onChange={(e) => setSpecialForm({...specialForm, amountReceived: e.target.value})}
                    placeholder="e.g. 5000"
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input 
                    type="text" 
                    value={specialForm.notes} 
                    onChange={(e) => setSpecialForm({...specialForm, notes: e.target.value})}
                    placeholder="Any specific details"
                    className={\`mt-1 \${isDark ? 'bg-slate-800 border-slate-700' : ''}\`}
                  />
                </div>
                <Button className="w-full mt-4" onClick={handleSpecialSubmit}>
                  Save Event Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
`;

code = code.replace(
  /<\/div>\n  \);\n\}\s*$/,
  (match) => newModal + match
);

fs.writeFileSync('src/pages/Reports.tsx', code);
