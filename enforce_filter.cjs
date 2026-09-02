const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf-8');

// Replace all instances of:
// `activeFid ? query(collection(db, 'entries'), where('franchiseId', '==', activeFid)) : query(collection(db, 'entries'))`
// with:
// `query(collection(db, 'entries'), where('franchiseId', '==', activeFid || 'NONE'))`

code = code.replace(/activeFid \? query\(collection\(db, '([a-zA-Z_]+)'\), where\('franchiseId', '==', activeFid\)\) : query\(collection\(db, '\1'\)\)/g, 
  "query(collection(db, '$1'), where('franchiseId', '==', activeFid || 'NONE'))");

// Also replace the getDocsFromServer / getDocs instances:
code = code.replace(/activeFid \? query\(collection\(db, collName\), where\('franchiseId', '==', activeFid\)\) : collection\(db, collName\)/g,
  "query(collection(db, collName), where('franchiseId', '==', activeFid || 'NONE'))");

// Also replace the logs one which has orderBy and limit:
code = code.replace(/activeFid \? query\(collection\(db, 'logs'\), where\('franchiseId', '==', activeFid\), orderBy\('timestamp', 'desc'\), limit\(limitCount\)\) : query\(collection\(db, 'logs'\), orderBy\('timestamp', 'desc'\), limit\(limitCount\)\)/g,
  "query(collection(db, 'logs'), where('franchiseId', '==', activeFid || 'NONE'), orderBy('timestamp', 'desc'), limit(limitCount))");

// And for denoms:
code = code.replace(/activeFid \? query\(collection\(db, 'daily_denominations'\), where\('franchiseId', '==', activeFid\)\) : collection\(db, 'daily_denominations'\)/g,
  "query(collection(db, 'daily_denominations'), where('franchiseId', '==', activeFid || 'NONE'))");

fs.writeFileSync('src/store.tsx', code);
