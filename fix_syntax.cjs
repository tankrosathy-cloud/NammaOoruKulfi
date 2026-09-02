const fs = require('fs');

function removeMismatched(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  // AddEntry
  code = code.replace(/<\/div>\)\}/g, "</div>");
  code = code.replace(/\{settings\.enableStick !== false && \(/g, "");
  code = code.replace(/\{settings\.enablePot !== false && \(/g, "");
  code = code.replace(/\{settings\.enablePlate && \(/g, "");
  fs.writeFileSync(filepath, code);
}

removeMismatched('src/pages/AddEntry.tsx');
removeMismatched('src/pages/Reports.tsx');
removeMismatched('src/pages/Settings.tsx');
