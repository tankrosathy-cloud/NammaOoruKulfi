import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const regex = /<CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">\s*<Package className="w-5 h-5 text-indigo-500" \/> Preparation Targets\s*<\/CardTitle>/;
const newHeader = `<CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> Preparation Targets
              </CardTitle>
              {inventory?.lastUpdatedDate && (
                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                  Stock Date: {inventory.lastUpdatedDate}
                </div>
              )}`;
              
content = content.replace(regex, newHeader);
fs.writeFileSync('src/pages/Planner.tsx', content);
