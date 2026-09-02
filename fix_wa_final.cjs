const fs = require('fs');

let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');

if (!wa.includes("import { useFranchise }")) {
  wa = wa.replace(
    "import { format, parseISO } from 'date-fns';",
    "import { format, parseISO } from 'date-fns';\nimport { useFranchise } from '../context/FranchiseContext';"
  );
}

// Ensure `expenses?: ExpenseEntry[]` is in WhatsAppSummaryModalProps
if (!wa.includes("expenses?: ExpenseEntry[]")) {
  wa = wa.replace(
    "export interface WhatsAppSummaryModalProps {",
    "export interface WhatsAppSummaryModalProps {\n  expenses?: ExpenseEntry[];"
  );
}

// Add ExpenseEntry to imports if missing
if (!wa.includes("ExpenseEntry")) {
  wa = wa.replace(
    "import { DailyEntry, InventoryStock, Settings } from '../types';",
    "import { DailyEntry, InventoryStock, Settings, ExpenseEntry } from '../types';"
  );
}

fs.writeFileSync('src/components/WhatsAppSummaryModal.tsx', wa);

