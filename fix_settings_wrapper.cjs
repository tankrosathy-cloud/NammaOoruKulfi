const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  '              )}\n                \n                <Card className="border border-pink-200',
  '              )}\n              {settings.enablePot !== false && (\n                <Card className="border border-pink-200'
);

code = code.replace(
  '              )}\n                \n                <Card className="border border-amber-200',
  '              )}\n              {settings.enablePlate && (\n                <Card className="border border-amber-200'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
