import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DailyEntry } from '../types';
import { saveEntry, useSettings, getEntries, useEntries, useInventory } from '../store';
import { format } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AddEntry({ onSave, initialDate }: { onSave: () => void, initialDate?: string, key?: string }) {
  const { settings } = useSettings();
  const { entries } = useEntries();
  const { inventory } = useInventory();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [entryId, setEntryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Pre-fill previous balances if any
  const [prevBalances, setPrevBalances] = useState({ stick: 0, pot: 0 });

  const [formData, setFormData] = useState({
    stickLoaded: '', stickBalance: '',
    potLoaded: '', potBalance: '',
    cashBagLoaded: '', cashBagTotal: '', phonePe: '',
    discount: '', additionalExpenses: '', expenseDetails: '', bonus: '',
    notes: ''
  });

  useEffect(() => {
    getEntries().then(entries => {
      // Find if entry for this date exists
      const existingEntry = entries.find(e => e.date === date);
      
      if (existingEntry) {
        setIsEditing(true);
        setEntryId(existingEntry.id);
        setFormData({
          stickLoaded: (existingEntry.stickLoaded || '').toString(),
          stickBalance: (existingEntry.stickBalance || '').toString(),
          potLoaded: (existingEntry.potLoaded || '').toString(),
          potBalance: (existingEntry.potBalance || '').toString(),
          cashBagLoaded: (existingEntry.cashBagLoaded || '').toString(),
          cashBagTotal: (existingEntry.cashBagTotal || '').toString(),
          phonePe: (existingEntry.phonePe || '').toString(),
          discount: (existingEntry.discount || '').toString(),
          additionalExpenses: (existingEntry.additionalExpenses || '').toString(),
          expenseDetails: existingEntry.expenseDetails || '',
          bonus: (existingEntry.bonus || '').toString(),
          notes: existingEntry.notes || ''
        });
      } else {
        setIsEditing(false);
        setEntryId(uuidv4());
        setFormData({
          stickLoaded: '', stickBalance: '',
          potLoaded: '', potBalance: '',
          cashBagLoaded: '', cashBagTotal: '', phonePe: '',
          discount: '', additionalExpenses: '', expenseDetails: '', bonus: '',
          notes: ''
        });
      }

      // Find previous balances (the entry with the largest date that is strictly less than current date)
      const prevEntry = [...entries]
        .filter(e => e.date < date)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (prevEntry) {
        setPrevBalances({
          stick: prevEntry.stickBalance || 0,
          pot: prevEntry.potBalance || 0
        });
      } else {
        setPrevBalances({ stick: 0, pot: 0 });
      }
    });
  }, [date]);

  // Find previous balances (the entry with the largest date that is strictly less than current date)
  const totalStickSold = entries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSold = entries.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const availableStick = Math.max(0, (inventory.stickQuantity || 0) - totalStickSold);
  const availablePot = Math.max(0, (inventory.potQuantity || 0) - totalPotSold);

  // Calculate sold values
  const stickLoadedVal = parseInt(formData.stickLoaded) || 0;
  const stickBalanceVal = formData.stickBalance === '' ? stickLoadedVal : (parseInt(formData.stickBalance) || 0);
  const stickSold = Math.max(0, stickLoadedVal - stickBalanceVal);

  const potLoadedVal = parseInt(formData.potLoaded) || 0;
  const potBalanceVal = formData.potBalance === '' ? potLoadedVal : (parseInt(formData.potBalance) || 0);
  const potSold = Math.max(0, potLoadedVal - potBalanceVal);

  // Auto calculate finances
  const discount = parseInt(formData.discount) || 0;
  const cashBagLoaded = parseInt(formData.cashBagLoaded) || 0;
  
  const hasSalesOrCash = stickSold > 0 || potSold > 0 || parseInt(formData.cashBagTotal) > 0 || parseInt(formData.phonePe) > 0;
  const platformRent = hasSalesOrCash ? 15 : 0; // Hardcoded platform rent, only applied if there's activity
  
  const additionalExpenses = parseInt(formData.additionalExpenses) || 0;
  const bonus = parseInt(formData.bonus) || 0;
  
  // Required amount: Sales - Discount + Cash Bag Loaded - Platform Rent - Additional Expenses - Bonus
  const expectedSales = (stickSold * settings.stickPrice) + (potSold * settings.potPrice);
  const requiredAmount = expectedSales - discount + cashBagLoaded - platformRent - additionalExpenses - bonus;

  const actualAmount = (parseInt(formData.cashBagTotal) || 0) + (parseInt(formData.phonePe) || 0);
  const shortage = requiredAmount - actualAmount;
  const finalAmount = actualAmount - bonus;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const entry: DailyEntry = {
      id: entryId,
      date,
      stickLoaded: parseInt(formData.stickLoaded) || 0,
      stickBalance: parseInt(formData.stickBalance) || 0,
      stickSold,
      potLoaded: parseInt(formData.potLoaded) || 0,
      potBalance: parseInt(formData.potBalance) || 0,
      potSold,
      cashBagLoaded: parseInt(formData.cashBagLoaded) || 0,
      cashBagTotal: parseInt(formData.cashBagTotal) || 0,
      phonePe: parseInt(formData.phonePe) || 0,
      discount,
      requiredAmount,
      actualAmount,
      shortage,
      bonus: parseInt(formData.bonus) || 0,
      finalAmount,
      expenses: platformRent,
      additionalExpenses: parseInt(formData.additionalExpenses) || 0,
      expenseDetails: formData.expenseDetails,
      notes: formData.notes
    };

    await saveEntry(entry);
    setLoading(false);
    onSave();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">{isEditing ? 'Edit Entry' : 'Add Entry'}</h2>
        <p className="text-slate-700 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">{isEditing ? `Editing metrics for ${date}` : "Enter today's closing metrics"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-cyan-600 dark:text-cyan-400">Inventory</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availableStick})</span></Label>
                      <Input name="stickLoaded" type="number" value={formData.stickLoaded} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Balance</Label>
                      <Input name="stickBalance" type="number" value={formData.stickBalance} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePot})</span></Label>
                      <Input name="potLoaded" type="number" value={formData.potLoaded} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Balance</Label>
                      <Input name="potBalance" type="number" value={formData.potBalance} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-pink-600 dark:text-pink-500">Financials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Cash Bag Loaded <span className="text-cyan-700 dark:text-cyan-400 font-black">(START)</span></Label>
                    <Input name="cashBagLoaded" type="number" value={formData.cashBagLoaded} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Cash Bag Total <span className="text-pink-700 dark:text-pink-400 font-black">(END)</span></Label>
                    <Input name="cashBagTotal" type="number" value={formData.cashBagTotal} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">PhonePe Amount</Label>
                    <Input name="phonePe" type="number" value={formData.phonePe} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Offer/Discount</Label>
                    <Input name="discount" type="number" value={formData.discount} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Bonus</Label>
                    <Input name="bonus" type="number" value={formData.bonus} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Notes</Label>
                <Input name="notes" type="text" placeholder="EXPENSE DETAILS, ETC." value={formData.notes} onChange={handleChange} className="uppercase placeholder:uppercase" />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/60 space-y-4 bg-slate-100/70 dark:bg-slate-900/80 border-x-0 border-b-0 -mx-6 px-6 pb-6 rounded-b-3xl mt-6">
               <div className="flex justify-between text-sm items-center">
                 <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Expected Sales</span>
                 <span className="font-black text-lg text-slate-900 dark:text-white">₹{expectedSales - discount}</span>
               </div>
               <div className="flex justify-between text-sm items-center">
                 <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Actual Sales <span className="text-slate-500 dark:text-slate-500 font-extrabold">(Excl. Loaded Cash)</span></span>
                 <span className="font-black text-lg text-slate-900 dark:text-white">₹{actualAmount - cashBagLoaded + platformRent + additionalExpenses + bonus}</span>
               </div>
               <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-200 dark:border-slate-800/60">
                 <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Shortage</span>
                 <span className={`font-black text-xl ${shortage > 0 ? 'text-pink-600' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{shortage}</span>
               </div>
               <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/40">
                 <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stick Kulfi Sold</span>
                 <span className="font-black text-sm text-cyan-600 dark:text-cyan-400">{stickSold} pcs</span>
               </div>
               <div className="flex justify-between text-sm items-center">
                 <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pot Kulfi Sold</span>
                 <span className="font-black text-sm text-purple-600 dark:text-purple-400">{potSold} pcs</span>
               </div>
            </div>

          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14 text-sm" size="lg" disabled={loading}>
          {loading ? 'SAVING...' : (isEditing ? 'UPDATE ENTRY' : 'SAVE ENTRY')}
        </Button>
      </form>
    </div>
  );
}
