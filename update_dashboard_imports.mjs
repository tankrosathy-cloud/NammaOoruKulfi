import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
  "import { useEntries, useSettings, useExpenses } from '../store';",
  "import { useEntries, useSettings, useExpenses, useInventory } from '../store';"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
