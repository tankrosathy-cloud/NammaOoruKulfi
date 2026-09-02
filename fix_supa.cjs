const fs = require('fs');
let code = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

code = code.replace(
  `    updated_at: new Date().toISOString()`,
  `    updated_at: new Date().toISOString(),\n    enable_stick: s.enableStick ?? true,\n    enable_pot: s.enablePot ?? true,\n    enable_plate: s.enablePlate ?? true,\n    enable_platform_fee: s.enablePlatformFee ?? false`
);

code = code.replace(
  `    expenseCategories: Array.isArray(r.expense_categories) ? r.expense_categories : undefined`,
  `    expenseCategories: Array.isArray(r.expense_categories) ? r.expense_categories : undefined,\n    enableStick: r.enable_stick ?? true,\n    enablePot: r.enable_pot ?? true,\n    enablePlate: r.enable_plate ?? true,\n    enablePlatformFee: r.enable_platform_fee ?? false`
);

fs.writeFileSync('src/lib/supabaseService.ts', code);
