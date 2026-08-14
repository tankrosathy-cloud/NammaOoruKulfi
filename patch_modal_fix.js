import fs from 'fs';
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

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
  /    <\/div>\n  \);\n\}\s*$/,
  modalCode + "\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/Reports.tsx', code);
