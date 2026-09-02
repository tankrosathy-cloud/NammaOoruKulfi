const fs = require('fs');

let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');

// Replace the start of the interface to include expenses
wa = wa.replace(
  "interface WhatsAppSummaryModalProps {",
  "interface WhatsAppSummaryModalProps {\n  expenses?: ExpenseEntry[];"
);

fs.writeFileSync('src/components/WhatsAppSummaryModal.tsx', wa);

