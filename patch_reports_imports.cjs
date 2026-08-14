const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /useProfitWithdrawals, saveProfitWithdrawal, deleteProfitWithdrawal \} from '\.\.\/store';/,
  "useProfitWithdrawals, saveProfitWithdrawal, deleteProfitWithdrawal, useSpecialOrders, saveSpecialOrder, deleteSpecialOrder, useInventory } from '../store';"
);

code = code.replace(
  /import \{ ExpenseEntry, ProfitWithdrawal \} from '\.\.\/types';/,
  "import { ExpenseEntry, ProfitWithdrawal, SpecialOrder } from '../types';"
);

fs.writeFileSync('src/pages/Reports.tsx', code);
