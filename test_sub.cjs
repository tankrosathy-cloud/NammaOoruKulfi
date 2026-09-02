const fs = require('fs');
const content = fs.readFileSync('src/lib/supabaseService.ts', 'utf-8');
console.log(content.includes('currentFranchiseId'));
