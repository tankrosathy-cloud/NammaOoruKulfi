const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Update state & special order
code = code.replace(
  "potQuantity: ''",
  "potQuantity: '', plateQuantity: ''"
);
code = code.replace(
  "potQuantity: ''",
  "potQuantity: '', plateQuantity: ''"
);
code = code.replace(
  "potQuantity: ''",
  "potQuantity: '', plateQuantity: ''"
);

// Totals obj
code = code.replace(
  "potSold: 0",
  "potSold: 0, plateSold: 0"
);
code = code.replace(
  "acc.potSold += (e.potSold || 0);",
  "acc.potSold += (e.potSold || 0);\n        acc.plateSold += (e.plateSold || 0);"
);
code = code.replace(
  "totals.potSold += order.potQuantity;",
  "totals.potSold += order.potQuantity;\n      totals.plateSold += order.plateQuantity || 0;"
);

// Save order
code = code.replace(
  "potQuantity: Number(specialForm.potQuantity) || 0,",
  "potQuantity: Number(specialForm.potQuantity) || 0,\n          plateQuantity: Number(specialForm.plateQuantity) || 0,"
);
code = code.replace(
  "potQuantity: Number(specialForm.potQuantity) || 0,",
  "potQuantity: Number(specialForm.potQuantity) || 0,\n          plateQuantity: Number(specialForm.plateQuantity) || 0,"
);
code = code.replace(
  "potQuantity: order.potQuantity.toString(),",
  "potQuantity: order.potQuantity.toString(),\n      plateQuantity: (order.plateQuantity || 0).toString(),"
);


// UI
// Totals Card
const potTotalsRegex = /<div className="bg-purple-500\/10 p-3 rounded-2xl border border-purple-500\/20">[\s\S]*?<\/div>/;
const matchTotals = code.match(potTotalsRegex);
if (matchTotals) {
  let plateTotals = matchTotals[0]
    .replace(/pot/g, "plate")
    .replace(/Pot/g, "Plate")
    .replace(/purple/g, "amber");
  code = code.replace(matchTotals[0], matchTotals[0] + "\n          " + plateTotals);
}
// wait, the grid is grid-cols-2 lg:grid-cols-4 for totals.
code = code.replace("grid-cols-2 lg:grid-cols-4", "grid-cols-2 lg:grid-cols-5");
code = code.replace("grid-cols-3 sm:grid-cols-6 gap-2", "grid-cols-4 sm:grid-cols-7 gap-2"); // for the entry item
code = code.replace("grid-cols-3 sm:grid-cols-4 gap-2", "grid-cols-4 sm:grid-cols-5 gap-2"); // for special order item

// Entry Item
const potItemRegex = /<div className="bg-slate-50 dark:bg-slate-800\/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Pot Sold<\/p>\s*<p className="font-black text-sm text-purple-500">\{entry\.potSold \|\| 0\}<\/p>\s*<\/div>/;
const matchItem = code.match(potItemRegex);
if (matchItem) {
  let plateItem = matchItem[0]
    .replace(/pot/g, "plate")
    .replace(/Pot/g, "Plate")
    .replace(/purple/g, "amber");
  code = code.replace(matchItem[0], matchItem[0] + "\n                        " + plateItem);
}

// Special Item
const specialPotItemRegex = /<div className="bg-slate-50 dark:bg-slate-800\/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest">Pots<\/p>\s*<p className="font-black text-sm text-purple-500">\{order\.potQuantity \|\| 0\}<\/p>\s*<\/div>/;
const matchSpecialItem = code.match(specialPotItemRegex);
if (matchSpecialItem) {
  let specialPlateItem = matchSpecialItem[0]
    .replace(/pot/g, "plate")
    .replace(/Pots/g, "Plates")
    .replace(/purple/g, "amber");
  code = code.replace(matchSpecialItem[0], matchSpecialItem[0] + "\n                          " + specialPlateItem);
}

// Modal entry detail
const modalPotRegex = /<div className="flex-1 min-w-\[120px\]">\s*<div className="flex items-center gap-1.5 mb-2">\s*<Package className="w-4 h-4 text-pink-500" \/>\s*<h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Pot Kulfi<\/h4>\s*<\/div>\s*<div className="bg-slate-50 dark:bg-slate-800\/50 p-2 rounded-lg">\s*<p className="text-\[9px\] font-bold text-slate-500 uppercase">Pot Load<\/p>\s*<p className=\{`font-black text-xs \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{viewEntry\.potLoaded\}<\/p>\s*<\/div>\s*<div className="bg-slate-50 dark:bg-slate-800\/50 p-2 rounded-lg mt-2">\s*<p className="text-\[9px\] font-bold text-slate-500 uppercase">Pot Bal<\/p>\s*<p className=\{`font-black text-xs \$\{isDark \? 'text-white' : 'text-slate-800'\}`\}>\{viewEntry\.potBalance\}<\/p>\s*<\/div>\s*<div className="bg-pink-500\/10 p-2 rounded-lg mt-2">\s*<p className="text-\[9px\] font-bold text-pink-600 dark:text-pink-400 uppercase">Pot Sold<\/p>\s*<p className=\{`font-black text-xs text-pink-600 dark:text-pink-400`\}>\{viewEntry\.potSold\}<\/p>\s*<\/div>\s*<\/div>/;
const matchModalPot = code.match(modalPotRegex);
if (matchModalPot) {
  let modalPlate = matchModalPot[0]
    .replace(/pot/g, "plate")
    .replace(/Pot/g, "Plate")
    .replace(/pink/g, "amber");
  code = code.replace(matchModalPot[0], matchModalPot[0] + "\n                    " + modalPlate);
}

// Modal special detail
const modalSpecialPotRegex = /<div className="bg-purple-50 dark:bg-purple-900\/20 p-2 rounded-xl border border-purple-100 dark:border-purple-800\/50 text-center">\s*<p className="text-\[9px\] font-bold text-purple-600 dark:text-purple-400 uppercase">Pots<\/p>\s*<p className=\{`font-black text-xs text-purple-600 dark:text-purple-400`\}>\{viewEntry\.potQuantity\}<\/p>\s*<\/div>/;
const matchModalSpecialPot = code.match(modalSpecialPotRegex);
if (matchModalSpecialPot) {
  let modalSpecialPlate = matchModalSpecialPot[0]
    .replace(/pot/g, "plate")
    .replace(/Pots/g, "Plates")
    .replace(/purple/g, "amber");
  code = code.replace(matchModalSpecialPot[0], matchModalSpecialPot[0] + "\n                      " + modalSpecialPlate);
}

// Special Order form
const specialFormPotRegex = /<div>\s*<Label>Pots Taken<\/Label>\s*<Input \s*type="number" \s*value=\{specialForm\.potQuantity\} \s*onChange=\{\(e\) => setSpecialForm\(\{\.\.\.specialForm, potQuantity: e\.target\.value\}\)\}\s*placeholder="e\.g\. 20"\s*className=\{`mt-1 \$\{isDark \? 'bg-slate-800 border-slate-700' : ''\}`\}\s*\/>\s*<\/div>/;
const matchSpecialFormPot = code.match(specialFormPotRegex);
if (matchSpecialFormPot) {
  let specialFormPlate = matchSpecialFormPot[0]
    .replace(/pot/g, "plate")
    .replace(/Pots/g, "Plates");
  code = code.replace(matchSpecialFormPot[0], matchSpecialFormPot[0] + "\n                  " + specialFormPlate);
}

fs.writeFileSync('src/pages/Reports.tsx', code);
