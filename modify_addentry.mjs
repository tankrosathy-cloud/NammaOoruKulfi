import fs from 'fs';
let content = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');

content = content.replace(
  'export default function AddEntry({ onSave, initialDate }: { onSave: () => void, initialDate?: string, key?: string }) {',
  'export default function AddEntry({ onSave, onCancel, initialDate }: { onSave: () => void, onCancel?: () => void, initialDate?: string, key?: string }) {'
);

const saveButtonStr = '<Button type="submit" className="w-full h-14 text-sm" size="lg" disabled={loading}>\n          {loading ? \'SAVING...\' : (isEditing ? \'UPDATE ENTRY\' : \'SAVE ENTRY\')}\n        </Button>';

const newButtons = `<div className="flex gap-4">
          {onCancel && (
            <Button type="button" variant="outline" className="w-1/3 h-14 text-sm border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300" size="lg" disabled={loading} onClick={onCancel}>
              CANCEL
            </Button>
          )}
          <Button type="submit" className="flex-1 h-14 text-sm" size="lg" disabled={loading}>
            {loading ? 'SAVING...' : (isEditing ? 'UPDATE ENTRY' : 'SAVE ENTRY')}
          </Button>
        </div>`;

content = content.replace(saveButtonStr, newButtons);
fs.writeFileSync('src/pages/AddEntry.tsx', content);
