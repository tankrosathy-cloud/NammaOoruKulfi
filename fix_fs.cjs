const fs = require('fs');

// MonthlyFinancialStatement
let mfs = fs.readFileSync('src/components/MonthlyFinancialStatement.tsx', 'utf-8');
mfs = mfs.replace(
  "export default function MonthlyFinancialStatement({ month, onBack }: MonthlyFinancialStatementProps) {",
  "export function MonthlyFinancialStatement({ isOpen, onClose, entries, expenses, profitWithdrawals, specialOrders, settings, initialDate }: MonthlyFinancialStatementProps) {"
);
mfs = mfs.replace(
  "import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder } from '../types';",
  "import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, Settings } from '../types';\nimport { useFranchise } from '../context/FranchiseContext';"
);
fs.writeFileSync('src/components/MonthlyFinancialStatement.tsx', mfs);

// WhatsAppSummaryModal
let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');
wa = wa.replace(
  "export default function WhatsAppSummaryModal({ isOpen, onClose, entry, settings, inventory, expenses = [] }: WhatsAppSummaryModalProps) {",
  "export function WhatsAppSummaryModal({ isOpen, onClose, entry, settings, inventory, expenses }: WhatsAppSummaryModalProps) {"
);
wa = wa.replace(
  "import { DailyEntry, Settings, InventoryStock } from '../types';",
  "import { DailyEntry, Settings, InventoryStock, ExpenseEntry } from '../types';\nimport { useFranchise } from '../context/FranchiseContext';"
);
fs.writeFileSync('src/components/WhatsAppSummaryModal.tsx', wa);

