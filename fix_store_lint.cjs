const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

// Remove the incorrect block around 883
code = code.replace(/if \(currentFranchiseId\) \{ [a-zA-Z]+WithUser\.franchiseId = currentFranchiseId; \}\n\s+/g, '');
code = code.replace(/if \(currentFranchiseId\) \{ log\.franchiseId = currentFranchiseId; \}\n\s+/g, '');

fs.writeFileSync('src/store.tsx', code);
