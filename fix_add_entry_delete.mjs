import fs from 'fs';
let content = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');

// 1. Add import for deleteEntry
content = content.replace(/import { saveEntry, useEntries, useInventory } from '\.\.\/store';/, "import { saveEntry, deleteEntry, useEntries, useInventory } from '../store';");

// 2. Add handleDelete function
const handleDelete = `
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    setLoading(true);
    try {
      await deleteEntry(entryId);
      alert('Entry deleted successfully!');
      // Reset form
      setEntryId(uuidv4());
      setFormData({
        stickLoaded: '', stickBalance: '',
        potLoaded: '', potBalance: '',
        cashBagLoaded: '', cashBagTotal: '', phonePe: '',
        discount: '', additionalExpenses: '', expenseDetails: '', bonus: '',
        notes: ''
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {`;
content = content.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{/, handleDelete);

// 3. Add Delete button in UI
const submitButtons = `<Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase h-12 rounded-xl shadow-md transition-all cursor-pointer">
              {loading ? 'SAVING...' : isEditing ? 'UPDATE ENTRY' : 'SAVE ENTRY'}
            </Button>
            {isEditing && (
              <Button type="button" onClick={handleDelete} disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase h-12 rounded-xl shadow-md transition-all cursor-pointer mt-2">
                DELETE ENTRY
              </Button>
            )}`;
content = content.replace(/<Button type="submit".*?>[\s\S]*?<\/Button>/, submitButtons);

fs.writeFileSync('src/pages/AddEntry.tsx', content);
