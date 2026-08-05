import fs from 'fs';
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

if (!content.includes('import { Eye }')) {
  content = content.replace("import { Trash2, Edit2, Download } from 'lucide-react';", "import { Trash2, Edit2, Download, Eye, X } from 'lucide-react';");
}

if (!content.includes('viewEntry')) {
  content = content.replace(
    "const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);",
    "const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n  const [viewEntry, setViewEntry] = useState<any | null>(null);"
  );

  const editDeleteOwner = `) : (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(entry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEdit(entry.date)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setDeleteConfirmId(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )`;
                      
  const editDeleteManager = `) : (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEdit(entry.date)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )`;
                    
  content = content.replace(
    /\) : \(\s*<div className="flex items-center gap-1">\s*<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500\/10 rounded-full" onClick=\{\(\) => onEdit\(entry\.date\)\}>\s*<Edit2 className="h-4 w-4" \/>\s*<\/Button>\s*<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500\/10 rounded-full" onClick=\{\(\) => setDeleteConfirmId\(entry\.id\)\}>\s*<Trash2 className="h-4 w-4" \/>\s*<\/Button>\s*<\/div>\s*\)/,
    editDeleteOwner
  );

  content = content.replace(
    /\) : \(\s*<div className="flex items-center gap-1">\s*<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500\/10 rounded-full" onClick=\{\(\) => onEdit\(entry\.date\)\}>\s*<Edit2 className="h-4 w-4" \/>\s*<\/Button>\s*<\/div>\s*\)/,
    editDeleteManager
  );
  
  // Also for expense
  
  const expenseEditDeleteOwner = `) : (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditExpense(expense)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-full" onClick={() => setExpenseDeleteConfirmId(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )`;
  
  // Replace in expense section
  content = content.replace(
    /<\/Button>\s*\{expenseDeleteConfirmId === expense\.id \? \(\s*<div className="flex items-center gap-2">\s*<Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick=\{\(\) => setExpenseDeleteConfirmId\(null\)\}>Cancel<\/Button>\s*<Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick=\{\(\) => handleDeleteExpense\(expense\.id\)\}>Delete<\/Button>\s*<\/div>\s*\) : \(\s*<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500\/10 rounded-full" onClick=\{\(\) => setExpenseDeleteConfirmId\(expense\.id\)\}>\s*<Trash2 className="h-4 w-4" \/>\s*<\/Button>\s*\)\}/,
    `{expenseDeleteConfirmId === expense.id ? (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-800 dark:text-slate-400" onClick={() => setExpenseDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="h-8 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => setViewEntry(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-full" onClick={() => setExpenseDeleteConfirmId(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}`
  );
  
  content = content.replace(
    /<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-500 hover:bg-cyan-500\/10 rounded-full" onClick=\{\(\) => onEditExpense\(expense\)\}>\s*<Edit2 className="h-4 w-4" \/>\s*<\/Button>/,
    `<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full" onClick={() => onEditExpense(expense)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>`
  ); // Wait, this edit button is outside the ternary, let's just replace the whole block carefully.
}

fs.writeFileSync('src/pages/Reports.tsx', content);
