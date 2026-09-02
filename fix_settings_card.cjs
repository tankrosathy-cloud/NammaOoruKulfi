const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const regex = /\{\/\* Pot Kulfi Card \*\/\}([\s\S]*?)<\/CardContent>\n\s*<\/Card>/;
const match = code.match(regex);
if (match) {
  let plateCard = match[0]
    .replace(/Pot Kulfi/g, "Plate Kulfi")
    .replace(/pot/g, "plate")
    .replace(/Pot/g, "Plate")
    .replace(/pink/g, "amber");
  
  // Actually we need to make sure we don't break the original.
  code = code.replace(match[0], match[0] + "\n\n              " + plateCard);
}

// Ensure platePrice is added to Settings mapping
// settingsData state mapping
code = code.replace(
  "potPrice: '',",
  "potPrice: '',\n    platePrice: '',"
);

// We should also find where `platePrice` input is added or missing.
// I will just add plate price setting next to Pot price.
const regexPrice = /<Label className="text-\[10px\] font-bold uppercase text-slate-500">Pot Price \(₹\)<\/Label>[\s\S]*?<\/div>/;
const matchPrice = code.match(regexPrice);
if (matchPrice) {
  let platePriceDiv = matchPrice[0]
    .replace(/Pot/g, "Plate")
    .replace(/potPrice/g, "platePrice");
  code = code.replace(matchPrice[0], matchPrice[0] + "\n                " + platePriceDiv);
}

fs.writeFileSync('src/pages/Settings.tsx', code);
