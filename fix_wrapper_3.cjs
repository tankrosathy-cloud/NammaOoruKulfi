const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(/<Card className="border border-cyan-200/g, "{settings.enableStick !== false && (\n                <Card className=\"border border-cyan-200");
code = code.replace(/<\/CardContent>\n\s*<\/Card>\n\s*<\/div>\n\s*<\/div>\n\s*\{\/\* Add Base Stock Modal \*\/\}/g, "</CardContent>\n                </Card>\n              )}\n              </div>\n            </div>\n\n            {/* Add Base Stock Modal */}");

// Also check AddEntry.tsx
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');
ae = ae.replace(/<div className="grid grid-cols-2 gap-4">\n\s*<div className="space-y-2">\n\s*<Label className="text-\[10px\] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load/g, "{settings.enableStick !== false && (<div className=\"grid grid-cols-2 gap-4\">\n                    <div className=\"space-y-2\">\n                      <Label className=\"text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest\">Stick Load");

ae = ae.replace(/<div className="grid grid-cols-2 gap-4">\n\s*<div className="space-y-2">\n\s*<Label className="text-\[10px\] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load/g, "{settings.enablePot !== false && (<div className=\"grid grid-cols-2 gap-4\">\n                    <div className=\"space-y-2\">\n                      <Label className=\"text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest\">Pot Load");

ae = ae.replace(/<div className="grid grid-cols-2 gap-4">\n\s*<div className="space-y-2">\n\s*<Label className="text-\[10px\] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Load/g, "{settings.enablePlate && (<div className=\"grid grid-cols-2 gap-4\">\n                    <div className=\"space-y-2\">\n                      <Label className=\"text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest\">Plate Load");

fs.writeFileSync('src/pages/AddEntry.tsx', ae);
fs.writeFileSync('src/pages/Settings.tsx', code);
