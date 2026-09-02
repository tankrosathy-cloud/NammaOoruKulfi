const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  plateQuantity?: number;\n  plateQuantity?: number;",
  "  plateQuantity?: number;"
);

fs.writeFileSync('src/types.ts', code);
