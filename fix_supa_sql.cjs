const fs = require('fs');
let code = fs.readFileSync('supabase-schema.sql', 'utf8');

code = code.replace(
  `    expense_categories TEXT[]`,
  `    expense_categories TEXT[],\n    enable_stick BOOLEAN DEFAULT TRUE,\n    enable_pot BOOLEAN DEFAULT TRUE,\n    enable_plate BOOLEAN DEFAULT TRUE,\n    enable_platform_fee BOOLEAN DEFAULT FALSE`
);

fs.writeFileSync('supabase-schema.sql', code);
