const fs = require('fs');

let content = fs.readFileSync('src/store.tsx', 'utf8');

const helperFunction = `
export function buildFranchiseQuery(dbRef: any, collName: string, fid?: string | null, ...extraClauses: any[]) {
  if (fid && fid !== 'all' && fid !== 'NONE') {
    return query(collection(dbRef, collName), where('franchiseId', '==', fid), ...extraClauses);
  }
  return query(collection(dbRef, collName), ...extraClauses);
}
`;

content = content.replace(
  'export function setCurrentFranchiseId(id: string | null) {\n  currentFranchiseId = id;\n}',
  'export function setCurrentFranchiseId(id: string | null) {\n  currentFranchiseId = id;\n}\n' + helperFunction
);

// Replace query patterns
content = content.replace(/query\(collection\(db,\s*'([^']+)'\),\s*where\('franchiseId',\s*'==',\s*currentFranchiseId\s*\|\|\s*'NONE'\)\)/g, "buildFranchiseQuery(db, '$1', currentFranchiseId)");
content = content.replace(/query\(collection\(db,\s*'([^']+)'\),\s*where\('franchiseId',\s*'==',\s*activeFid\s*\|\|\s*'NONE'\)\)/g, "buildFranchiseQuery(db, '$1', activeFid)");
content = content.replace(/query\(collection\(db,\s*'logs'\),\s*where\('franchiseId',\s*'==',\s*currentFranchiseId\s*\|\|\s*'NONE'\),\s*orderBy\('timestamp',\s*'desc'\),\s*limit\(limitCount\)\)/g, "buildFranchiseQuery(db, 'logs', currentFranchiseId, orderBy('timestamp', 'desc'), limit(limitCount))");

fs.writeFileSync('src/store.tsx', content);
console.log('Store patched');
