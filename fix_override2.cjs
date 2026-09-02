const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldPresets = `                {/* Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSetStockToday}
                    className={\`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer \${
                      inventoryData.lastUpdatedDate === todayStr && inventoryData.stickQuantity === availableStick
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-cyan-300'
                    }\`}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                        Count As of Today ({todayStr})
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Sets current live available: {availableStick} sticks, {availablePot} pots
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">Preset Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToRecordedBase}
                    className={\`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer \${
                      inventoryData.lastUpdatedDate === (inventory.lastUpdatedDate || '2026-08-01')
                        ? 'border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-300 ring-1 ring-pink-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }\`}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
                        Original Baseline
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {inventory.lastUpdatedDate || '2026-08-01'} • {inventory.stickQuantity || 0} sticks
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Original</span>
                  </button>
                </div>`;

const newPresets = `                {/* Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSetStockToday}
                    className={\`flex flex-col p-3 rounded-xl border transition-all cursor-pointer text-left \${
                      inventoryData.lastUpdatedDate === todayStr && inventoryData.stickQuantity === availableStick
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 ring-1 ring-cyan-500 text-cyan-900 dark:text-cyan-100'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }\`}
                  >
                    <div className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      Set to Today ({todayStr})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Live counts: {availableStick} sticks, {availablePot} pots
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToRecordedBase}
                    className={\`flex flex-col p-3 rounded-xl border transition-all cursor-pointer text-left \${
                      inventoryData.lastUpdatedDate === (inventory.lastUpdatedDate || '2026-08-01')
                        ? 'border-slate-800 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-800 dark:ring-slate-600 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }\`}
                  >
                    <div className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      Restore Original
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {inventory.lastUpdatedDate || '2026-08-01'} • {inventory.stickQuantity || 0} sticks
                    </div>
                  </button>
                </div>`;

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

code = code.replace(oldPresets, newPresets);
code = code.replace(oldFormInputs, newFormInputs);
fs.writeFileSync('src/pages/Settings.tsx', code);
