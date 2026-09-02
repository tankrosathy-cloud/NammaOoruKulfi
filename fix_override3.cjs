const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldFormInputs = `<div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Override Baseline Effective Date
                    </Label>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                      className="h-10 text-xs font-bold"
                    />
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Format: YYYY-MM-DD. All sales recorded on or after this date are automatically subtracted.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Stick Opening Stock (pcs)
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.stickQuantity}
                        onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="e.g. 750"
                        className="h-10 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Pot Opening Stock (pcs)
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.potQuantity}
                        onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="e.g. 35"
                        className="h-10 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>`;

const newFormInputs = `<div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Effective Date
                    </Label>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Stick Count
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.stickQuantity}
                        onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pot Count
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.potQuantity}
                        onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>`;

if (code.includes(oldFormInputs)) {
  code = code.replace(oldFormInputs, newFormInputs);
  fs.writeFileSync('src/pages/Settings.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to find substring");
}
