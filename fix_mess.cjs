const fs = require('fs');

// AddEntry.tsx has duplicate Stick Load. Let's fix that.
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

// The chunk 597-606 is a duplicate stick load, replacing plate?
// Let's manually replace the 3 blocks using simple split/join.
const aeBlocks = ae.split('<div className="pt-6 border-t border-slate-100 dark:border-slate-800">');
// aeBlocks[0] contains the product input fields.
// Let's replace the whole product inputs area:
// It starts at `<h3 className="text-xs font-black uppercase tracking-widest mb-5 text-purple-600 dark:text-purple-500">Products</h3>`

let newProducts = `
              <div className="pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-purple-600 dark:text-purple-500">Products</h3>
                
                <div className="space-y-6">
                  {settings.enableStick !== false && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load <span className="text-cyan-700 dark:text-cyan-400 font-black">(Inv Bal: {availableStick})</span></Label>
                        <Input name="stickLoaded" type="text" inputMode="numeric" value={formData.stickLoaded} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Balance</Label>
                        <Input name="stickBalance" type="text" inputMode="numeric" value={formData.stickBalance} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                    </div>
                  )}

                  {settings.enablePot !== false && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePot})</span></Label>
                        <Input name="potLoaded" type="text" inputMode="numeric" value={formData.potLoaded} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Balance</Label>
                        <Input name="potBalance" type="text" inputMode="numeric" value={formData.potBalance} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                    </div>
                  )}

                  {settings.enablePlate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Load <span className="text-amber-700 dark:text-amber-400 font-black">(Inv Bal: {availablePlate})</span></Label>
                        <Input name="plateLoaded" type="text" inputMode="numeric" value={formData.plateLoaded} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Balance</Label>
                        <Input name="plateBalance" type="text" inputMode="numeric" value={formData.plateBalance} onChange={handleChange} onFocus={handleFocus} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
`;

// Replace the old products area.
const productMatch = ae.match(/<div className="pt-4">\s*<h3 className="text-xs font-black uppercase tracking-widest mb-5 text-purple-600 dark:text-purple-500">Products<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
if (productMatch) {
  // It has some nesting. Let's do it safer.
  const beforeProducts = ae.substring(0, ae.indexOf('<div className="pt-4">'));
  const afterProductsStart = ae.substring(ae.indexOf('<div className="pt-6 border-t border-slate-100 dark:border-slate-800">'));
  ae = beforeProducts + newProducts + "\n\n" + afterProductsStart;
  fs.writeFileSync('src/pages/AddEntry.tsx', ae);
}

// Settings.tsx has TS1381 errors: Unexpected token `)}`
let setCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
setCode = setCode.replace(/<\/CardContent>\n\s*<\/Card>\n\s*\)\}\n\s*\)\}/g, "</CardContent>\n                </Card>"); // Clean up duplicate )}'
setCode = setCode.replace(/<\/CardContent>\n\s*<\/Card>\n\s*\)\}/g, "</CardContent>\n                </Card>\n              )}");
// Check what exactly is at 1389 and 1458
fs.writeFileSync('src/pages/Settings.tsx', setCode);
