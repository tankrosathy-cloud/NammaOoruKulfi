const fs = require('fs');

let set = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
set = set.replace(/{settings\.enableStick !== false && \(\n\s*\{\/\* Stick Kulfi Card \*\/\}/g, "{settings.enableStick !== false && (");
set = set.replace(/{settings\.enablePot !== false && \(\n\s*\{\/\* Pot Kulfi Card \*\/\}/g, "{settings.enablePot !== false && (");
set = set.replace(/{settings\.enablePlate && \(\n\s*\{\/\* Plate Kulfi Card \*\/\}/g, "{settings.enablePlate && (");
fs.writeFileSync('src/pages/Settings.tsx', set);

// AddEntry.tsx
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');
ae = ae.replace(/\{\/\* Stick Load \*\/\}/g, "");
ae = ae.replace(/\{\/\* Pot Load \*\/\}/g, "");
ae = ae.replace(/\{\/\* Plate Load \*\/\}/g, "");
fs.writeFileSync('src/pages/AddEntry.tsx', ae);

