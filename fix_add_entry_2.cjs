const fs = require('fs');
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

ae = ae.replace("            plateLoaded: parseInt(formData.plateLoaded) || 0,\n            plateBalance: formData.plateBalance !== '' ? parseInt(formData.plateBalance) : undefined,\n            plateSold,\n", "");

fs.writeFileSync('src/pages/AddEntry.tsx', ae);
