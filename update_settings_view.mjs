import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Update Stick Kulfi Card
const stickCardRegex = /<div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">[\s\S]*?<\/div>\s*<\/CardContent>\s*<\/Card>/;

const newStickCard = `<div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-widest block mb-1">In Job (Loaded)</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentInJobStick}</span>
                    </div>
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-1">Inv Balance</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentWarehouseStickBalance}</span>
                    </div>
                  </div>
                  
                  {inventory.stickFlavours && inventory.stickFlavours.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Flavours</h5>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                        {inventory.stickFlavours.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-slate-900 rounded-md">
                            <span className="truncate mr-2 dark:text-slate-300">{f.name || 'Unnamed'}</span>
                            <span className="font-bold dark:text-white">{f.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>`;

content = content.replace(stickCardRegex, newStickCard);

// Update Pot Kulfi Card
const potCardRegex = /<div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">[\s\S]*?<\/div>\s*<\/CardContent>\s*<\/Card>/g;

let count = 0;
content = content.replace(potCardRegex, (match) => {
    count++;
    if (count === 1) return match; // skip the first one if the regex matched it incorrectly, wait pot regex should only match after pot card
    return match;
});

// Since the regex could match the first one again if not careful, let's do a more targeted replace for Pot
const potSpecificRegex = /(<Card className="border border-pink-200 dark:border-pink-900\/50">[\s\S]*?<div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">[\s\S]*?<\/div>)\s*(<\/CardContent>\s*<\/Card>)/;

const newPotCard = `$1
                  
                  {inventory.potFlavours && inventory.potFlavours.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Flavours</h5>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                        {inventory.potFlavours.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-slate-900 rounded-md">
                            <span className="truncate mr-2 dark:text-slate-300">{f.name || 'Unnamed'}</span>
                            <span className="font-bold dark:text-white">{f.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                $2`;
content = content.replace(potSpecificRegex, newPotCard);

fs.writeFileSync('src/pages/Settings.tsx', content);
