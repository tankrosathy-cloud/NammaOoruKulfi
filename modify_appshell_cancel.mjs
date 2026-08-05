import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

content = content.replace(
  '<AddEntry onSave={() => navigateTab(\'reports\')} initialDate={editDate} key={editDate || \'new\'} />',
  '<AddEntry onSave={() => navigateTab(\'reports\')} onCancel={() => navigateTab(\'reports\')} initialDate={editDate} key={editDate || \'new\'} />'
);

content = content.replace(
  '<AddExpense onSave={() => { setEditExpense(undefined); navigateTab(role === \'owner\' ? \'dashboard\' : \'add\'); }} initialExpense={editExpense} />',
  '<AddExpense onSave={() => { setEditExpense(undefined); navigateTab(role === \'owner\' ? \'dashboard\' : \'add\'); }} onCancel={() => { setEditExpense(undefined); navigateTab(role === \'owner\' ? \'dashboard\' : \'add\'); }} initialExpense={editExpense} />'
);

fs.writeFileSync('src/AppShell.tsx', content);
