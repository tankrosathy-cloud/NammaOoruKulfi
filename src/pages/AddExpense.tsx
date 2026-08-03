import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { saveExpense } from '../store';
import { ExpenseEntry } from '../types';

export default function AddExpense({ onSave, initialExpense }: { onSave: () => void, initialExpense?: ExpenseEntry }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: initialExpense?.date || new Date().toLocaleDateString('en-CA'),
    paidBy: initialExpense?.paidBy || 'Nadeem',
    category: initialExpense?.category || 'Petrol/Fuel',
    amount: initialExpense ? initialExpense.amount.toString() : '',
    notes: initialExpense?.notes || ''
  });

  const allowedUsers = ['Nadeem', 'Yuvaraj'];
  const categories = ['Petrol/Fuel', 'Food', 'Maintenance', 'Salary', 'Supplies', 'Rent', 'Others'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const expense: ExpenseEntry = {
      id: initialExpense?.id || Date.now().toString(),
      date: formData.date,
      paidBy: formData.paidBy,
      category: formData.category,
      amount: parseInt(formData.amount) || 0,
      notes: formData.notes
    };

    await saveExpense(expense);
    setLoading(false);
    onSave();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-red-600 rounded-2xl p-6 shadow-lg shadow-red-600/20 text-white">
        <h2 className="text-2xl font-black tracking-tighter mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          {initialExpense ? 'Edit Expense Entry' : 'New Expense Entry'}
        </h2>
        <p className="text-sm font-medium opacity-90">{initialExpense ? 'Update expense details' : 'Record business costs & supplies purchased'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            
            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Expense Date:
              </Label>
              <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Paid By:
              </Label>
              <select name="paidBy" value={formData.paidBy} onChange={handleChange} className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                {allowedUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-400">Expense Category:</Label>
              <select name="category" value={formData.category} onChange={handleChange} className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-400">Amount (₹):</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <Input name="amount" type="number" placeholder="Enter amount in Rupees" value={formData.amount} onChange={handleChange} required className="pl-8" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                Notes (optional):
              </Label>
              <textarea 
                name="notes" 
                placeholder="Purchased from shop, vehicle service description, tea bill..." 
                value={formData.notes} 
                onChange={handleChange} 
                className="flex w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
            
          </CardContent>
        </Card>
        
        <Button type="submit" className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>
          {loading ? 'SAVING...' : 'SAVE EXPENSE'}
        </Button>
      </form>
    </div>
  );
}
