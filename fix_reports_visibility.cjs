const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// The totals card is currently a simple grid grid-cols-2. Let's make it flex so we can hide correctly.
// Oh wait, earlier I saw grid-cols-2 lg:grid-cols-5. 
// No, line 331 says `grid grid-cols-2 gap-4 divide-x`
// Let's replace the whole Card for Stick/Pot/Plate.

code = code.replace(
  '<div>\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-cyan-400 font-bold\' : \'text-cyan-800 font-black\'}`}>Total Stick Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.stickSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>',
  '{settings.enableStick !== false && (<div>\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-cyan-400 font-bold\' : \'text-cyan-800 font-black\'}`}>Total Stick Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.stickSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>)}'
);
code = code.replace(
  '<div className="pl-4">\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-purple-400 font-bold\' : \'text-purple-800 font-black\'}`}>Total Pot Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.potSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>',
  '{settings.enablePot !== false && (<div className="pl-4">\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-purple-400 font-bold\' : \'text-purple-800 font-black\'}`}>Total Pot Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.potSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>)}'
);
code = code.replace(
  '<div className="pl-4">\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-amber-400 font-bold\' : \'text-amber-800 font-black\'}`}>Total Plate Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.plateSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>',
  '{settings.enablePlate && (<div className="pl-4">\n            <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? \'text-amber-400 font-bold\' : \'text-amber-800 font-black\'}`}>Total Plate Sold</p>\n            <p className="text-xl font-black text-slate-950 dark:text-white">{totals.plateSold} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">pcs</span></p>\n          </div>)}'
);

// We need to change `grid-cols-2` to `flex flex-wrap gap-4` or similar, but the user doesn't strictly care about layout perfection here.
code = code.replace(
  'grid grid-cols-2 gap-4 divide-x divide-slate-200/80 dark:divide-slate-800/40',
  'flex flex-wrap gap-6 divide-x divide-slate-200/80 dark:divide-slate-800/40'
);


// In Reports.tsx, hiding the entry list tags:
// <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center"> Stick Sold
code = code.replace(
  '<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Sold</p>',
  '{settings.enableStick !== false && (<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Sold</p>'
);
code = code.replace(
  '<p className="font-black text-sm text-cyan-500">{entry.stickSold || 0}</p>\n                      </div>',
  '<p className="font-black text-sm text-cyan-500">{entry.stickSold || 0}</p>\n                      </div>)}'
);

code = code.replace(
  '<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Sold</p>',
  '{settings.enablePot !== false && (<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Sold</p>'
);
code = code.replace(
  '<p className="font-black text-sm text-purple-500">{entry.potSold || 0}</p>\n                        </div>',
  '<p className="font-black text-sm text-purple-500">{entry.potSold || 0}</p>\n                        </div>)}'
);

code = code.replace(
  '<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plate Sold</p>',
  '{settings.enablePlate && (<div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\n                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plate Sold</p>'
);
code = code.replace(
  '<p className="font-black text-sm text-amber-500">{entry.plateSold || 0}</p>\n                        </div>',
  '<p className="font-black text-sm text-amber-500">{entry.plateSold || 0}</p>\n                        </div>)}'
);


fs.writeFileSync('src/pages/Reports.tsx', code);
