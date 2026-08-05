import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /<h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">Current Stock<\/h3>/;
const newTitle = `<div>
              <h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">Current Stock</h3>
              {!isEditingInventory && inventory.lastUpdatedDate && (
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Stock Date: {inventory.lastUpdatedDate}</p>
              )}
            </div>`;

content = content.replace(regex, newTitle);
fs.writeFileSync('src/pages/Settings.tsx', content);
