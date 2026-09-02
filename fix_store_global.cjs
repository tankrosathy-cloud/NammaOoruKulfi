const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

// Replace activeFid with currentFranchiseId everywhere EXCEPT inside StoreProvider
// Actually, it's easier to just replace all `activeFid` with `currentFranchiseId`,
// then ONLY replace it inside StoreProvider by splitting the string.

code = code.replace(/activeFid/g, "currentFranchiseId");

// Let's remove the duplicated const currentFranchiseId = ... I accidentally inserted
code = code.replace(
  "export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {\n  const currentFranchiseId = franchiseId || currentFranchiseId;\n  // Fallback to currentFranchiseId for safety\n  const currentFranchiseId = franchiseId || currentFranchiseId;",
  "export function StoreProvider({ franchiseId, children }: { franchiseId?: string | null; children: ReactNode }) {\n  const activeFid = franchiseId || currentFranchiseId;\n"
);
// Wait, I messed up the regex, let's just restore from git and do it properly.

