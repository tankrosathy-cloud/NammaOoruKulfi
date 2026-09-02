const fs = require('fs');
let code = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

code = code.replace(
  `const platformRent = hasSalesOrCash ? (settings.platformFee || 0) : 0;`,
  `const platformRent = (hasSalesOrCash && settings.enablePlatformFee) ? (settings.platformFee || 0) : 0;`
);

fs.writeFileSync('src/pages/AddEntry.tsx', code);
