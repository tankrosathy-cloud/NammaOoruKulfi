import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /<div className="space-y-2">\s*<Label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pot Quantity<\/Label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newUI = `<div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pot Quantity</Label>
                    <Input 
                      type="text" inputMode="numeric"
                      value={inventoryData.potQuantity}
                      onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                    />
                  </div>
                  
                  </div>
                  
                  {/* Flavour configuration */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Stick Flavours (Max 15)</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] text-cyan-600" onClick={() => {
                        if (inventoryData.stickFlavours.length < 15) {
                          setInventoryData({
                            ...inventoryData, 
                            stickFlavours: [...inventoryData.stickFlavours, { name: '', quantity: 0 }]
                          });
                        }
                      }}>+ ADD</Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {inventoryData.stickFlavours.map((f, i) => (
                        <div key={'stick-'+i} className="flex gap-2 items-center">
                          <Input className="h-8 text-xs flex-1" placeholder="Flavour name" value={f.name} onChange={e => {
                            const newF = [...inventoryData.stickFlavours];
                            newF[i].name = e.target.value;
                            setInventoryData({...inventoryData, stickFlavours: newF});
                          }} />
                          <Input className="h-8 text-xs w-20" type="number" placeholder="Qty" value={f.quantity} onChange={e => {
                            const newF = [...inventoryData.stickFlavours];
                            newF[i].quantity = Number(e.target.value) || 0;
                            setInventoryData({...inventoryData, stickFlavours: newF});
                          }} />
                          <button type="button" className="text-red-500 w-6 flex justify-center" onClick={() => {
                            const newF = inventoryData.stickFlavours.filter((_, idx) => idx !== i);
                            setInventoryData({...inventoryData, stickFlavours: newF});
                          }}>✕</button>
                        </div>
                      ))}
                      {inventoryData.stickFlavours.length === 0 && <p className="text-[10px] text-slate-400 italic">No flavours added</p>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Pot Flavours (Max 4)</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] text-purple-600" onClick={() => {
                        if (inventoryData.potFlavours.length < 4) {
                          setInventoryData({
                            ...inventoryData, 
                            potFlavours: [...inventoryData.potFlavours, { name: '', quantity: 0 }]
                          });
                        }
                      }}>+ ADD</Button>
                    </div>
                    <div className="space-y-2">
                      {inventoryData.potFlavours.map((f, i) => (
                        <div key={'pot-'+i} className="flex gap-2 items-center">
                          <Input className="h-8 text-xs flex-1" placeholder="Flavour name" value={f.name} onChange={e => {
                            const newF = [...inventoryData.potFlavours];
                            newF[i].name = e.target.value;
                            setInventoryData({...inventoryData, potFlavours: newF});
                          }} />
                          <Input className="h-8 text-xs w-20" type="number" placeholder="Qty" value={f.quantity} onChange={e => {
                            const newF = [...inventoryData.potFlavours];
                            newF[i].quantity = Number(e.target.value) || 0;
                            setInventoryData({...inventoryData, potFlavours: newF});
                          }} />
                          <button type="button" className="text-red-500 w-6 flex justify-center" onClick={() => {
                            const newF = inventoryData.potFlavours.filter((_, idx) => idx !== i);
                            setInventoryData({...inventoryData, potFlavours: newF});
                          }}>✕</button>
                        </div>
                      ))}
                      {inventoryData.potFlavours.length === 0 && <p className="text-[10px] text-slate-400 italic">No flavours added</p>}
                    </div>
                  </div>

                </div>`;

content = content.replace(regex, newUI);
fs.writeFileSync('src/pages/Settings.tsx', content);
