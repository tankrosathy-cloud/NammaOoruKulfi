const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  '{settings.enablePot !== false && (\n                <Card className="border border-pink-200 dark:border-pink-900/50">\n            <CardContent className="p-6 space-y-6">',
  '<Card className="border border-pink-200 dark:border-pink-900/50">\n            <CardContent className="p-6 space-y-6">'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
