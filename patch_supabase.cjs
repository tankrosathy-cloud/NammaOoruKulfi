const fs = require('fs');
let content = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

// Replace if (currentFranchiseId) { query = query.eq('franchise_id', currentFranchiseId); }
content = content.replace(
  /if\s*\(\s*currentFranchiseId\s*\)\s*\{\s*query\s*=\s*query\.eq\('franchise_id',\s*currentFranchiseId\);\s*\}/g,
  "if (currentFranchiseId && currentFranchiseId !== 'all') { query = query.eq('franchise_id', currentFranchiseId); }"
);

fs.writeFileSync('src/lib/supabaseService.ts', content);
console.log('Supabase service patched');
