import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const regex = /\{\/\* Center\/Right Column: Analytical Summary & checklist \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/s;

const replacement = `{/* Center/Right Column: Analytical Summary */}
        <div className="space-y-6 lg:col-span-2">
          <Card className={\`overflow-hidden border transition-all duration-300 \${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-100 shadow-lg shadow-slate-100'}\`}>
            <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> Preparation Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Item</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Predicted</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Available</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Target to Prepare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Stick Kulfi Row */}
                    <tr className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-cyan-500" />
                          <span className="font-black text-slate-800 dark:text-slate-200">Stick Kulfi</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-cyan-500">{calculations.predictedStick}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-slate-500">{calculations.availableStick}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={\`inline-flex items-center justify-end gap-2 px-3 py-1.5 rounded-lg border \${
                          calculations.shortageStick > 0 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        }\`}>
                          {calculations.shortageStick > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Prepare</span>
                              <span className="text-lg font-black">+{calculations.shortageStick}</span>
                            </>
                          ) : (
                            <span className="text-xs font-black uppercase tracking-wider">Sufficient</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Pot Kulfi Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-pink-500" />
                          <span className="font-black text-slate-800 dark:text-slate-200">Pot Kulfi</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-pink-500">{calculations.predictedPot}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-slate-500">{calculations.availablePot}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={\`inline-flex items-center justify-end gap-2 px-3 py-1.5 rounded-lg border \${
                          calculations.shortagePot > 0 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        }\`}>
                          {calculations.shortagePot > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Prepare</span>
                              <span className="text-lg font-black">+{calculations.shortagePot}</span>
                            </>
                          ) : (
                            <span className="text-xs font-black uppercase tracking-wider">Sufficient</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Advanced Intelligence Details */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Underlying Intelligence metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">7-Day Avg</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.recent7DayAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.recent7DayAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{targetDayName.substring(0,3)} Avg</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.dayOfWeekAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.dayOfWeekAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historical</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.histAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.histAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Modifier</p>
                    <div className="flex items-center">
                      <span className={\`text-sm font-black \${calculations.multiplier > 1 ? 'text-amber-500' : calculations.multiplier < 1 ? 'text-blue-500' : 'text-slate-500'}\`}>
                        {calculations.multiplier > 1 ? '+' : calculations.multiplier < 1 ? '' : ''}{Math.round((calculations.multiplier - 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/pages/Planner.tsx', content);
  console.log("Successfully replaced Center/Right column UI");
} else {
  console.log("Regex did not match");
}
