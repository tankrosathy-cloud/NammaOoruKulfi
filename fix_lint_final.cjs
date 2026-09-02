const fs = require('fs');

// MonthlyFinancialStatement.tsx
let mfs = fs.readFileSync('src/components/MonthlyFinancialStatement.tsx', 'utf-8');
if (!mfs.includes("import { useFranchise }")) {
  mfs = mfs.replace(
    "import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, Settings } from '../types';",
    "import { DailyEntry, ExpenseEntry, ProfitWithdrawal, SpecialOrder, Settings } from '../types';\nimport { useFranchise } from '../context/FranchiseContext';"
  );
}
fs.writeFileSync('src/components/MonthlyFinancialStatement.tsx', mfs);

// WhatsAppSummaryModal.tsx
let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');
if (!wa.includes("import { useFranchise }")) {
  wa = wa.replace(
    "import { DailyEntry, Settings, InventoryStock, ExpenseEntry } from '../types';",
    "import { DailyEntry, Settings, InventoryStock, ExpenseEntry } from '../types';\nimport { useFranchise } from '../context/FranchiseContext';"
  );
}
// Add expenses to interface
wa = wa.replace(
  "export interface WhatsAppSummaryModalProps {",
  "export interface WhatsAppSummaryModalProps {\n  expenses?: ExpenseEntry[];"
);
fs.writeFileSync('src/components/WhatsAppSummaryModal.tsx', wa);

// ExportData.tsx
let ed = fs.readFileSync('src/components/ExportData.tsx', 'utf-8');
ed = ed.replace(
  "import MonthlyFinancialStatement from './MonthlyFinancialStatement';",
  "import { MonthlyFinancialStatement } from './MonthlyFinancialStatement';"
);
fs.writeFileSync('src/components/ExportData.tsx', ed);

// AddEntry.tsx
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');
ae = ae.replace(
  "import WhatsAppSummaryModal from '../components/WhatsAppSummaryModal';",
  "import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';"
);
fs.writeFileSync('src/pages/AddEntry.tsx', ae);

// Dashboard.tsx
let db = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
db = db.replace(
  "import WhatsAppSummaryModal from '../components/WhatsAppSummaryModal';",
  "import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';"
);
fs.writeFileSync('src/pages/Dashboard.tsx', db);

// Reports.tsx
let rp = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');
rp = rp.replace(
  "import MonthlyFinancialStatement from '../components/MonthlyFinancialStatement';",
  "import { MonthlyFinancialStatement } from '../components/MonthlyFinancialStatement';"
);
rp = rp.replace(
  "import WhatsAppSummaryModal from '../components/WhatsAppSummaryModal';",
  "import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';"
);
fs.writeFileSync('src/pages/Reports.tsx', rp);

