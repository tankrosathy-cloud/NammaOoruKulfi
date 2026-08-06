import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const flavourSection = `
              {/* Flavour Wise Distribution */}
              {(calculations.shortageStick > 0 || calculations.shortagePot > 0) && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-pink-500" /> Smart Flavour Distribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {calculations.shortageStick > 0 && (
                      <div>
                        <h5 className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Stick Kulfi Breakdown</h5>
                        <div className="space-y-2">
                          {inventory?.stickFlavours && inventory.stickFlavours.length > 0 ? (
                            inventory.stickFlavours.map((f, i) => {
                              const share = Math.round(calculations.shortageStick / inventory.stickFlavours!.length);
                              return (
                                <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs">
                                  <span className="dark:text-slate-300 font-medium">{f.name || 'Unnamed'}</span>
                                  <span className="font-black text-cyan-600 dark:text-cyan-400">+{i === inventory.stickFlavours!.length - 1 ? calculations.shortageStick - (share * i) : share}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic">No stick flavours configured.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {calculations.shortagePot > 0 && (
                      <div>
                        <h5 className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-3">Pot Kulfi Breakdown</h5>
                        <div className="space-y-2">
                          {inventory?.potFlavours && inventory.potFlavours.length > 0 ? (
                            inventory.potFlavours.map((f, i) => {
                              const share = Math.round(calculations.shortagePot / inventory.potFlavours!.length);
                              return (
                                <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs">
                                  <span className="dark:text-slate-300 font-medium">{f.name || 'Unnamed'}</span>
                                  <span className="font-black text-pink-600 dark:text-pink-400">+{i === inventory.potFlavours!.length - 1 ? calculations.shortagePot - (share * i) : share}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic">No pot flavours configured.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
`;

content = content.replace(
  /\{\/\* Advanced Intelligence Details \*\/\}/,
  flavourSection + '\n              {/* Advanced Intelligence Details */}'
);

fs.writeFileSync('src/pages/Planner.tsx', content);
