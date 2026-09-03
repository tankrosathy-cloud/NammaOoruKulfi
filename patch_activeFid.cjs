const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf8');

// Replace d.franchiseId === (activeFid || 'NONE') || !activeFid
content = content.replace(
  /if\s*\(\s*d\s*&&\s*\(\s*d\.franchiseId\s*===\s*\(\s*activeFid\s*\|\|\s*'NONE'\s*\)\s*\|\|\s*!activeFid\s*\)\s*\)\s*\{/g,
  "if (d && (!activeFid || activeFid === 'all' || d.franchiseId === activeFid)) {"
);

fs.writeFileSync('src/store.tsx', content);
console.log('activeFid patched');
