const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Update initial state
code = code.replace(
  `    enablePlate: false,`,
  `    enablePlate: true,\n    enablePlatformFee: false,`
);

// Update setSettingsData in useEffect
code = code.replace(
  `        enablePlate: settings.enablePlate ?? false,`,
  `        enablePlate: settings.enablePlate ?? true,\n        enablePlatformFee: settings.enablePlatformFee ?? false,`
);
code = code.replace(
  `platformFee: (settings.platformFee ?? 15).toString(),`,
  `platformFee: (settings.platformFee ?? 0).toString(),`
);

// Update saveSettings
code = code.replace(
  `      enablePlate: settingsData.enablePlate,`,
  `      enablePlate: settingsData.enablePlate,\n      enablePlatformFee: settingsData.enablePlatformFee,`
);

// Update rendering of Platform Fee
const oldPlatformFeeHTML = `                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Platform Fee (₹/day)</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Set 0 to disable</Label>
                      <Input name="platformFee" type="text" inputMode="numeric" value={settingsData.platformFee} onChange={handleSettingsChange} className="h-11" />
                    </div>
                  </div>`;

const newPlatformFeeHTML = `                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Platform Fee</Label>
                      <input type="checkbox" name="enablePlatformFee" checked={settingsData.enablePlatformFee} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePlatformFee && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fee Amount (₹/day)</Label>
                        <Input name="platformFee" type="text" inputMode="numeric" value={settingsData.platformFee} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>`;

code = code.replace(oldPlatformFeeHTML, newPlatformFeeHTML);

fs.writeFileSync('src/pages/Settings.tsx', code);
