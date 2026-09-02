import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Calendar, User, Fuel, Utensils, Wrench, 
  Package, Home, Receipt, Loader2, Sparkles, Coins, PiggyBank, Boxes
} from 'lucide-react';
import { saveExpense, useSettings } from '../store';
import { ExpenseEntry } from '../types';
import { auth } from '../lib/firebase';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isDark: boolean;
}

const CATEGORIES_WITH_ICONS = [
  { name: 'Petrol/Fuel', icon: Fuel, color: 'text-amber-500 bg-amber-500/10' },
  { name: 'Food', icon: Utensils, color: 'text-emerald-500 bg-emerald-500/10' },
  { name: 'Supplies', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
  { name: 'Maintenance', icon: Wrench, color: 'text-rose-500 bg-rose-500/10' },
  { name: 'Salary', icon: User, color: 'text-purple-500 bg-purple-500/10' },
  { name: 'Rent', icon: Home, color: 'text-indigo-500 bg-indigo-500/10' },
  { name: 'Chit', icon: PiggyBank, color: 'text-pink-500 bg-pink-500/10' },
  { name: 'Inventory', icon: Boxes, color: 'text-teal-500 bg-teal-500/10' },
  { name: 'Others', icon: Receipt, color: 'text-cyan-500 bg-cyan-500/10' }
];

const QUICK_TAGS: Record<string, string[]> = {
  'Petrol/Fuel': ['Bike fuel', 'Auto fuel', 'Delivery fuel', 'Generator petrol'],
  'Food': ['Tea & Snacks', 'Lunch for staff', 'Dinner bill', 'Water bottles'],
  'Supplies': ['Ice pack', 'Salt bag', 'Paper cups', 'Plastic spoons', 'Carry bags'],
  'Maintenance': ['Cart repair', 'Tyre puncture', 'Bulb replacement', 'Cleaning brush'],
  'Salary': ['Daily wage', 'Staff advance', 'Part-time helper'],
  'Rent': ['Daily spot rent', 'Weekly rent', 'Storage room'],
  'Chit': ['Daily chit', 'Monthly chit installment', 'Chit bonus'],
  'Inventory': ['Stock purchase', 'Raw materials', 'Packaging stock'],
  'Others': ['Tea bill', 'Miscellaneous', 'Donation', 'Stationery']
};

export default function QuickExpenseModal({ isOpen, onClose, onSave, isDark }: QuickExpenseModalProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const currentUserEmail = auth.currentUser?.email || '';
  const currentUsername = currentUserEmail.split('@')[0].toLowerCase();
  const currentPayerName = settings?.expensePaidByNames && settings.expensePaidByNames.length > 0 ? settings.expensePaidByNames[0] : 'Owner';
  const [paidBy, setPaidBy] = useState(currentPayerName);

  // Reset form state on open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory('Food');
      setNotes('');
      setDate(new Date().toLocaleDateString('en-CA'));
      setShowSuccess(false);
      setError('');
      setPaidBy(currentPayerName);
    }
  }, [isOpen, currentPayerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseInt(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    const expense: ExpenseEntry = {
      id: Date.now().toString(),
      date,
      paidBy: paidBy || currentPayerName,
      category,
      amount: numericAmount,
      notes: notes.trim()
    };

    try {
      await saveExpense(expense);
      setShowSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setNotes(tag);
  };

  const currentCategoryObj = CATEGORIES_WITH_ICONS.find(c => c.name === category);
  const currentCategoryTags = QUICK_TAGS[category] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] border p-6 overflow-hidden relative shadow-2xl ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {showSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-center">Expense Saved!</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logged by {paidBy || currentPayerName}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg uppercase tracking-tight leading-none">Quick Expense</h3>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">
                          Payer: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{paidBy || currentPayerName}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl uppercase tracking-wider text-center">
                      {error}
                    </div>
                  )}

                  {/* Large Amount Input */}
                  <div className="space-y-1.5 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount in Rupees</span>
                    <div className="relative max-w-[200px] mx-auto">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full text-center text-3xl font-black tracking-tight rounded-2xl border px-8 py-3 outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                          isDark 
                            ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300'
                        }`}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Horizontal Scrollable Categories */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none snap-x">
                      {CATEGORIES_WITH_ICONS.map((cat) => {
                        const IconComponent = cat.icon;
                        const isSelected = category === cat.name;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setCategory(cat.name);
                              setNotes(''); // Clear notes when switching category
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border whitespace-nowrap snap-center transition-all cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                                  : 'bg-pink-50 border-pink-500 text-pink-600 shadow-sm'
                                : isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            {cat.name.split('/')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Tags for common notes */}
                  {currentCategoryTags.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Common Costs</label>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-pink-500" /> TAP TO AUTOFILL
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCategoryTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleQuickTagClick(tag)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                              notes === tag
                                ? isDark
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                  : 'bg-cyan-50 border-cyan-500 text-cyan-600'
                                : isDark
                                  ? 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                                  : 'bg-slate-100 border-slate-200/80 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes & Date Row */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Notes Custom Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Details</label>
                      <input
                        type="text"
                        placeholder="Description (e.g. bought today)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={`w-full h-11 px-4 text-xs font-bold uppercase rounded-xl border outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full h-11 px-4 text-xs font-bold rounded-xl border outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(239,68,68,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Cost...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        Save Quick Expense
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
