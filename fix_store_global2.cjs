const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

// Undo the activeFid replacement globally
code = code.replace(/activeFid/g, "currentFranchiseId");

// Remove the double declaration I made at the top of StoreProvider
code = code.replace(
  "export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {\n  const currentFranchiseId = franchiseId || currentFranchiseId;\n  // Fallback to currentFranchiseId for safety\n  const currentFranchiseId = franchiseId || currentFranchiseId;",
  "export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {\n  const activeFid = franchiseId || currentFranchiseId;"
);

// Now ONLY replace inside StoreProvider.
// StoreProvider starts with `export function StoreProvider`
// We can find the index and only replace after that.
const startIndex = code.indexOf('export function StoreProvider');
const before = code.substring(0, startIndex);
let after = code.substring(startIndex);

after = after.replace(/currentFranchiseId \? query/g, "activeFid ? query");
after = after.replace(/where\('franchiseId', '==', currentFranchiseId\)/g, "where('franchiseId', '==', activeFid)");
after = after.replace(/currentFranchiseId \|\| 'global'/g, "activeFid || 'global'");

fs.writeFileSync('src/store.tsx', before + after);

