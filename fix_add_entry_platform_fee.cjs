const fs = require('fs');
let code = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

code = code.replace(
  "const platformRent = hasSalesOrCash ? 15 : 0; // Hardcoded platform rent, only applied if there's activity",
  "const platformRent = hasSalesOrCash ? (settings.platformFee || 0) : 0;"
);

// We should also hide stick/pot/plate sections in AddEntry.tsx
// It's a bit harder, let's find the Stick Load block.
code = code.replace(
  '<div className="grid grid-cols-2 gap-4">\n                    <div className="space-y-2">\n                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load <span className="text-cyan-700 dark:text-cyan-400 font-black">(Inv Bal: {availableStick})</span></Label>',
  '{settings.enableStick !== false && (<div className="grid grid-cols-2 gap-4">\n                    <div className="space-y-2">\n                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load <span className="text-cyan-700 dark:text-cyan-400 font-black">(Inv Bal: {availableStick})</span></Label>'
);
code = code.replace(
  'onChange={handleChange} onFocus={handleFocus} />\n                    </div>\n                  </div>',
  'onChange={handleChange} onFocus={handleFocus} />\n                    </div>\n                  </div>)}'
);

code = code.replace(
  '<div className="grid grid-cols-2 gap-4">\n                    <div className="space-y-2">\n                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePot})</span></Label>',
  '{settings.enablePot !== false && (<div className="grid grid-cols-2 gap-4">\n                    <div className="space-y-2">\n                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePot})</span></Label>'
);

code = code.replace(
  '<div className="grid grid-cols-2 gap-4">\n                  <div className="space-y-2">\n                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePlate})</span></Label>',
  '{settings.enablePlate && (<div className="grid grid-cols-2 gap-4">\n                  <div className="space-y-2">\n                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Load <span className="text-amber-700 dark:text-amber-400 font-black">(Inv Bal: {availablePlate})</span></Label>' // fixed purple to amber
);

fs.writeFileSync('src/pages/AddEntry.tsx', code);
