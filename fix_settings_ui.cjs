const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Update settingsData state structure
code = code.replace(
  "monthlyGoal: '',",
  "monthlyGoal: '',\n    enableStick: true,\n    enablePot: true,\n    enablePlate: false,\n    stickPrice: '',\n    potPrice: '',\n    platePrice: '',\n    platformFee: '',"
);

// Update effect to populate settingsData
code = code.replace(
  "monthlyGoal: (settings.monthlyGoal || 150000).toString(),",
  "enableStick: settings.enableStick ?? true,\n        enablePot: settings.enablePot ?? true,\n        enablePlate: settings.enablePlate ?? false,\n        stickPrice: (settings.stickPrice || 40).toString(),\n        potPrice: (settings.potPrice || 50).toString(),\n        platePrice: (settings.platePrice || 75).toString(),\n        platformFee: (settings.platformFee ?? 15).toString(),\n        monthlyGoal: (settings.monthlyGoal || 150000).toString(),"
);

// Add to handleSettingsChange for booleans
const handleSettingsChangeBlock = `  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };`;
code = code.replace(
  /const handleSettingsChange[\s\S]*?};/,
  handleSettingsChangeBlock
);

// Update submit handler to save all fields
code = code.replace(
  "monthlyGoal: parseFloat(settingsData.monthlyGoal) || 150000,",
  "enableStick: settingsData.enableStick,\n      enablePot: settingsData.enablePot,\n      enablePlate: settingsData.enablePlate,\n      stickPrice: parseFloat(settingsData.stickPrice) || 40,\n      potPrice: parseFloat(settingsData.potPrice) || 50,\n      platePrice: parseFloat(settingsData.platePrice) || 75,\n      platformFee: parseFloat(settingsData.platformFee) || 0,\n      monthlyGoal: parseFloat(settingsData.monthlyGoal) || 150000,"
);

// Add UI fields
const uiFields = `                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-4 text-pink-600 dark:text-pink-400 mt-6 mb-4">
                  Franchise Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Stick Kulfi</Label>
                      <input type="checkbox" name="enableStick" checked={settingsData.enableStick} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enableStick && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Price (₹)</Label>
                        <Input name="stickPrice" type="text" inputMode="numeric" value={settingsData.stickPrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Pot Kulfi</Label>
                      <input type="checkbox" name="enablePot" checked={settingsData.enablePot} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePot && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Price (₹)</Label>
                        <Input name="potPrice" type="text" inputMode="numeric" value={settingsData.potPrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Plate Kulfi</Label>
                      <input type="checkbox" name="enablePlate" checked={settingsData.enablePlate} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePlate && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plate Price (₹)</Label>
                        <Input name="platePrice" type="text" inputMode="numeric" value={settingsData.platePrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Platform Fee (₹/day)</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Set 0 to disable</Label>
                      <Input name="platformFee" type="text" inputMode="numeric" value={settingsData.platformFee} onChange={handleSettingsChange} className="h-11" />
                    </div>
                  </div>
                </div>`;

code = code.replace(
  '<div className="space-y-2 mt-4">\n                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expense "Paid By" Names (Comma separated)</Label>',
  uiFields + '\n\n                <div className="space-y-2 mt-4">\n                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expense "Paid By" Names (Comma separated)</Label>'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
