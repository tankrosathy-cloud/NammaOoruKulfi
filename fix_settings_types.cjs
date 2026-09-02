const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');
code = code.replace(
  "role: 'owner' | 'manager'",
  "role: 'owner' | 'staff'"
);
if (!code.includes("import { useFranchise }")) {
  code = code.replace(
    "import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';",
    "import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';\nimport { useFranchise } from '../context/FranchiseContext';"
  );
}
fs.writeFileSync('src/pages/Settings.tsx', code);
