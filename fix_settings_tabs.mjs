import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

content = content.replace(
  /\{activeTab === 'settings' && role === 'owner' \? \(/g,
  "{activeTab === 'settings' && role === 'owner' && ("
);

content = content.replace(
  /\s*\) : \(\s*<div className="space-y-6">/g,
  "\n      )}\n      {activeTab === 'inventory' && (\n        <div className=\"space-y-6\">"
);

fs.writeFileSync('src/pages/Settings.tsx', content);
