import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /<div className="grid grid-cols-2 gap-4">([\s\S]*?)<\/div>\s*<div className="flex gap-3 pt-2">/;

const newUI = `<div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock Date</Label>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
$1
                  </div>
                </div>

                <div className="flex gap-3 pt-2">`;

content = content.replace(regex, newUI);
fs.writeFileSync('src/pages/Settings.tsx', content);
