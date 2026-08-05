import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Find the index of "import React"
const importIndex = content.indexOf('import React');
if (importIndex > 0) {
  content = content.substring(importIndex);
}

fs.writeFileSync('src/pages/Settings.tsx', content);
