const fs = require('fs');
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

// Fix missing `)}` in AddEntry
ae = ae.replace(
  '                  </div>\n\n                  {settings.enablePot !== false && (<div className="grid grid-cols-2 gap-4">',
  '                  </div>\n                  )}\n\n                  {settings.enablePot !== false && (<div className="grid grid-cols-2 gap-4">'
);
ae = ae.replace(
  '                  </div>\n                  {settings.enableStick !== false && (<div className="grid grid-cols-2 gap-4">',
  '                  </div>\n                  )}\n                  {settings.enableStick !== false && (<div className="grid grid-cols-2 gap-4">'
);
ae = ae.replace(
  '                  </div>\n\n                  {settings.enablePlate && (<div className="grid grid-cols-2 gap-4">',
  '                  </div>\n                  )}\n\n                  {settings.enablePlate && (<div className="grid grid-cols-2 gap-4">'
);
ae = ae.replace(
  '                  </div>\n                </div>\n              </div>\n\n              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">',
  '                  </div>\n                  )}\n                </div>\n              </div>\n\n              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">'
);
fs.writeFileSync('src/pages/AddEntry.tsx', ae);

let setCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Fix the overzealous replacement at 951
setCode = setCode.replace(
  '{settings.enableStick !== false && (\n                <Card className="border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-sm">',
  '<Card className="border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-sm">'
);

// We need to fix the stray closing brackets in Settings.
setCode = setCode.replace(
  '                <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">\n                  <div className="flex items-center justify-between">\n                    <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Stick Kulfi</Label>',
  '                <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">\n                  <div className="flex items-center justify-between">\n                    <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Stick Kulfi</Label>'
);

// Where did the syntax errors at 1808 and 991 come from?
fs.writeFileSync('src/pages/Settings.tsx', setCode);
