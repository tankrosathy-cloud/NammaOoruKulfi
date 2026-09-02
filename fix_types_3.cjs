const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  potQuantity: number;\n  amountReceived: number;",
  "  potQuantity: number;\n  plateQuantity?: number;\n  amountReceived: number;"
);

fs.writeFileSync('src/types.ts', code);
