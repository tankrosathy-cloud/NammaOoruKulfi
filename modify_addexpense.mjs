import fs from 'fs';
let content = fs.readFileSync('src/pages/AddExpense.tsx', 'utf-8');

content = content.replace(
  'export default function AddExpense({ onSave, initialExpense }: { onSave: () => void, initialExpense?: ExpenseEntry }) {',
  'export default function AddExpense({ onSave, onCancel, initialExpense }: { onSave: () => void, onCancel?: () => void, initialExpense?: ExpenseEntry }) {'
);

const saveButtonStr = '<Button type="submit" className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>\n          {loading ? \'SAVING...\' : \'SAVE EXPENSE\'}\n        </Button>';

const newButtons = `<div className="flex gap-4">
          {onCancel && (
            <Button type="button" variant="outline" className="w-1/3 h-14 text-sm border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300" size="lg" disabled={loading} onClick={onCancel}>
              CANCEL
            </Button>
          )}
          <Button type="submit" className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>
            {loading ? 'SAVING...' : 'SAVE EXPENSE'}
          </Button>
        </div>`;

content = content.replace(saveButtonStr, newButtons);
fs.writeFileSync('src/pages/AddExpense.tsx', content);
