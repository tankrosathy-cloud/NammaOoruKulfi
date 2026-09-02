const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

// Replace all instances outside of StoreProvider as well
code = code.replace(/currentFranchiseId \? query\(collection\(db, '([a-zA-Z_]+)'\), where\('franchiseId', '==', currentFranchiseId\)\) : query\(collection\(db, '\1'\)\)/g, 
  "query(collection(db, '$1'), where('franchiseId', '==', currentFranchiseId || 'NONE'))");

code = code.replace(/currentFranchiseId \? query\(collection\(db, '([a-zA-Z_]+)'\), where\('franchiseId', '==', currentFranchiseId\)\) : collection\(db, '\1'\)/g, 
  "query(collection(db, '$1'), where('franchiseId', '==', currentFranchiseId || 'NONE'))");

fs.writeFileSync('src/store.tsx', code);
