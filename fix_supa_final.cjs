const fs = require('fs');
let code = fs.readFileSync('src/lib/supabaseService.ts', 'utf-8');

code = code.replace(/\.eq\('franchise_id', currentFranchiseId \|\| ''\)/g, "");
code = code.replace(/\.eq\('franchise_id', currentFranchiseId \|\| 'global'\)/g, "");
// clean up empty lines
code = code.replace(/\n\s*\n\s*\.order/g, "\n    .order");

fs.writeFileSync('src/lib/supabaseService.ts', code);
