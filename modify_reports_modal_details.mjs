import fs from 'fs';
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

const regex = /<>\s*<div className="grid grid-cols-2 gap-4">\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Date<\/p>\s*<p className=\{`font-black text-sm \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{format\(parseISO\(viewEntry\.date\), 'dd MMM yyyy'\)\}<\/p>\s*<\/div>\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Actual Sales<\/p>\s*<p className=\{`font-black text-sm text-cyan-500`\}>\{formatCurrency\(viewEntry\.actualAmount\)\}<\/p>\s*<\/div>\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Stick Sold<\/p>\s*<p className=\{`font-black text-sm \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{viewEntry\.stickSold\} pcs<\/p>\s*<\/div>\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Pot Sold<\/p>\s*<p className=\{`font-black text-sm \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{viewEntry\.potSold\} pcs<\/p>\s*<\/div>\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">PhonePe<\/p>\s*<p className=\{`font-black text-sm \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{formatCurrency\(viewEntry\.phonePe\)\}<\/p>\s*<\/div>\s*<div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Shortage<\/p>\s*<p className=\{`font-black text-sm \$\{viewEntry\.shortage > 0 \? 'text-pink-500' : isDark \? 'text-white' : 'text-slate-800'\}`\}>\{formatCurrency\(viewEntry\.shortage\)\}<\/p>\s*<\/div>\s*<\/div>/g;

const newDetails = `<>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                      <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{format(parseISO(viewEntry.date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Sales</p>
                      <p className={\`font-black text-sm text-cyan-500\`}>{formatCurrency(viewEntry.actualAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Inventory Details</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Stick Load</p>
                        <p className={\`font-black text-xs \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.stickLoaded}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Stick Bal</p>
                        <p className={\`font-black text-xs \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.stickBalance}</p>
                      </div>
                      <div className="bg-cyan-500/10 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Stick Sold</p>
                        <p className={\`font-black text-xs text-cyan-600 dark:text-cyan-400\`}>{viewEntry.stickSold}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pot Load</p>
                        <p className={\`font-black text-xs \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.potLoaded}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pot Bal</p>
                        <p className={\`font-black text-xs \${isDark ? 'text-white' : 'text-slate-800'}\`}>{viewEntry.potBalance}</p>
                      </div>
                      <div className="bg-pink-500/10 p-2 rounded-lg mt-2">
                        <p className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase">Pot Sold</p>
                        <p className={\`font-black text-xs text-pink-600 dark:text-pink-400\`}>{viewEntry.potSold}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Financial Breakdown</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required Amt</p>
                        <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.requiredAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discount</p>
                        <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.discount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PhonePe</p>
                        <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.phonePe)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shortage</p>
                        <p className={\`font-black text-sm \${viewEntry.shortage > 0 ? 'text-pink-500' : isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.shortage)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Bag Loaded</p>
                        <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.cashBagLoaded)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Bag Total</p>
                        <p className={\`font-black text-sm \${isDark ? 'text-white' : 'text-slate-800'}\`}>{formatCurrency(viewEntry.cashBagTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bonus</p>
                        <p className={\`font-black text-sm text-amber-500\`}>{formatCurrency(viewEntry.bonus)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Handover</p>
                        <p className={\`font-black text-sm text-emerald-500\`}>{formatCurrency(viewEntry.finalAmount)}</p>
                      </div>
                    </div>
                  </div>`;

if (content.match(regex)) {
  content = content.replace(regex, newDetails);
  fs.writeFileSync('src/pages/Reports.tsx', content);
  console.log("Replaced successfully!");
} else {
  console.log("Regex didn't match.");
}
