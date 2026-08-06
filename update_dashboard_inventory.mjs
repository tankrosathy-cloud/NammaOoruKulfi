import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
  "const { expenses, loading: expensesLoading } = useExpenses();\n  const loading = entriesLoading || expensesLoading;",
  "const { expenses, loading: expensesLoading } = useExpenses();\n  const { inventory, loading: inventoryLoading } = useInventory();\n  const loading = entriesLoading || expensesLoading || inventoryLoading;"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
