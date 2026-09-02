const fs = require('fs');
let code = fs.readFileSync('src/components/MonthlyFinancialStatement.tsx', 'utf8');

// Add platePrice
code = code.replace(
  'const stickPrice = settings?.stickPrice || 40;',
  'const stickPrice = settings?.stickPrice || 40;\n  const platePrice = settings?.platePrice || 75;'
);

// Add to statement data
code = code.replace(
  'dailyPotSold: 0,',
  'dailyPotSold: 0,\n      dailyPlateSold: 0,'
);
code = code.replace(
  'specialPotSold: 0,',
  'specialPotSold: 0,\n      specialPlateSold: 0,'
);
code = code.replace(
  'totalPotSold: 0,',
  'totalPotSold: 0,\n      totalPlateSold: 0,'
);
code = code.replace(
  'potRevenue: 0,',
  'potRevenue: 0,\n      plateRevenue: 0,'
);

// Variables in useMemo
code = code.replace(
  'let dailyPotSold = 0;',
  'let dailyPotSold = 0;\n    let dailyPlateSold = 0;'
);
code = code.replace(
  'dailyPotSold += e.potSold || 0;',
  'dailyPotSold += e.potSold || 0;\n      dailyPlateSold += e.plateSold || 0;'
);
code = code.replace(
  'let specialPotSold = 0;',
  'let specialPotSold = 0;\n    let specialPlateSold = 0;'
);
code = code.replace(
  'specialPotSold += order.potQuantity || 0;',
  'specialPotSold += order.potQuantity || 0;\n      specialPlateSold += order.plateQuantity || 0;'
);

code = code.replace(
  'const totalPotSold = dailyPotSold + specialPotSold;',
  'const totalPotSold = dailyPotSold + specialPotSold;\n    const totalPlateSold = dailyPlateSold + specialPlateSold;'
);

// Return object
code = code.replace(
  'dailyPotSold,',
  'dailyPotSold,\n      dailyPlateSold,'
);
code = code.replace(
  'specialPotSold,',
  'specialPotSold,\n      specialPlateSold,'
);
code = code.replace(
  'totalPotSold,',
  'totalPotSold,\n      totalPlateSold,'
);
code = code.replace(
  'potRevenue: totalPotSold * potPrice,',
  'potRevenue: totalPotSold * potPrice,\n      plateRevenue: totalPlateSold * platePrice,'
);

// Deps array
code = code.replace(
  'stickPrice, potPrice]);',
  'stickPrice, potPrice, platePrice]);'
);

// UI Updates
code = code.replace(
  'Stick Rate: ₹{stickPrice} • Pot Rate: ₹{potPrice}',
  'Stick Rate: ₹{stickPrice} • Pot Rate: ₹{potPrice} • Plate Rate: ₹{platePrice}'
);

const trStickRegex = /<tr className="border-b border-slate-100">\s*<td className="p-2\.5 font-black text-slate-900">Stick Kulfi<\/td>\s*<td className="p-2\.5 text-center text-slate-600">\{statementData\.dailyStickSold\} pcs<\/td>\s*<td className="p-2\.5 text-center text-slate-600">\{statementData\.specialStickSold\} pcs<\/td>\s*<td className="p-2\.5 text-center font-black text-cyan-600">\{statementData\.totalStickSold\} pcs<\/td>\s*<td className="p-2\.5 text-right text-slate-600">₹\{stickPrice\}<\/td>\s*<td className="p-2\.5 text-right font-black text-slate-900">\{formatCurrency\(statementData\.stickRevenue\)\}<\/td>\s*<\/tr>/;
const matchTrStick = code.match(trStickRegex);
if (matchTrStick) {
  let stickRow = matchTrStick[0];
  let potRow = stickRow.replace(/Stick/g, 'Pot').replace(/stick/g, 'pot').replace(/cyan/g, 'pink');
  let plateRow = stickRow.replace(/Stick/g, 'Plate').replace(/stick/g, 'plate').replace(/cyan/g, 'amber');
  code = code.replace(
    matchTrStick[0],
    `{settings?.enableStick !== false && (${stickRow})}`
  );
  const trPotRegex = /<tr className="border-b border-slate-100">\s*<td className="p-2\.5 font-black text-slate-900">Pot Kulfi<\/td>\s*<td className="p-2\.5 text-center text-slate-600">\{statementData\.dailyPotSold\} pcs<\/td>\s*<td className="p-2\.5 text-center text-slate-600">\{statementData\.specialPotSold\} pcs<\/td>\s*<td className="p-2\.5 text-center font-black text-pink-600">\{statementData\.totalPotSold\} pcs<\/td>\s*<td className="p-2\.5 text-right text-slate-600">₹\{potPrice\}<\/td>\s*<td className="p-2\.5 text-right font-black text-slate-900">\{formatCurrency\(statementData\.potRevenue\)\}<\/td>\s*<\/tr>/;
  code = code.replace(
    trPotRegex,
    `{settings?.enablePot !== false && (${potRow})}\n                {settings?.enablePlate && (${plateRow})}`
  );
}

// Subtotal calculations: (statementData.specialStickSold * stickPrice + statementData.specialPotSold * potPrice)
code = code.replace(
  /statementData\.specialStickSold \* stickPrice \+ statementData\.specialPotSold \* potPrice/g,
  '(statementData.specialStickSold * stickPrice + statementData.specialPotSold * potPrice + statementData.specialPlateSold * platePrice)'
);

code = code.replace(
  'statementData.dailyStickSold + statementData.dailyPotSold',
  'statementData.dailyStickSold + statementData.dailyPotSold + statementData.dailyPlateSold'
);
code = code.replace(
  'statementData.specialStickSold + statementData.specialPotSold',
  'statementData.specialStickSold + statementData.specialPotSold + statementData.specialPlateSold'
);
code = code.replace(
  'statementData.totalStickSold + statementData.totalPotSold',
  'statementData.totalStickSold + statementData.totalPotSold + statementData.totalPlateSold'
);

fs.writeFileSync('src/components/MonthlyFinancialStatement.tsx', code);
