import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DailyEntry } from '../types';
import { saveEntry, useSettings, getEntries } from '../store';
import { format } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AddEntry({ onSave, initialDate }: { onSave: () => void, initialDate?: string }) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [entryId, setEntryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Pre-fill previous balances if any
  const [prevBalances, setPrevBalances] = useState({ stick: 0, plate: 0, pot: 0 });

  const [formData, setFormData] = useState({
    stickLoaded: '', stickBalance: '',
    plateLoaded: '', plateBalance: '',
    potLoaded: '', potBalance: '',
    cashBagLoaded: '', cashBagTotal: '', phonePe: '',
    discount: '', expenses: '', bonus: '',
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
          plateLoaded: (existingEntry.plateLoaded || '').toString(),
          plateBalance: (existingEntry.plateBalance || '').toString(),
          potLoaded: (existingEntry.potLoaded || '').toString(),
          potBalance: (existingEntry.potBalance || '').toString(),
          cashBagLoaded: (existingEntry.cashBagLoaded || '').toString(),
          cashBagTotal: (existingEntry.cashBagTotal || '').toString(),
          phonePe: (existingEntry.phonePe || '').toString(),
          discount: (existingEntry.discount || '').toString(),
          expenses: (existingEntry.expenses || '').toString(),
          bonus: (existingEntry.bonus || '').toString(),
          notes: existingEntry.notes || ''
        });
      } else {
        setIsEditing(false);
        setEntryId(uuidv4());
        setFormData({
          stickLoaded: '', stickBalance: '',
          plateLoaded: '', plateBalance: '',
          potLoaded: '', potBalance: '',
          cashBagLoaded: '', cashBagTotal: '', phonePe: '',
          discount: '', expenses: '15', bonus: '',
          notes: 'PLATFORM RENT'
        });
      }

      // Find previous balances (the entry with the largest date that is strictly less than current date)
      const prevEntry = [...entries]
        .filter(e => e.date < date)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (prevEntry) {
        setPrevBalances({
          stick: prevEntry.stickBalance || 0,
          plate: prevEntry.plateBalance || 0,
          pot: prevEntry.potBalance || 0
        });
      } else {
        setPrevBalances({ stick: 0, plate: 0, pot: 0 });
      }
    });
  }, [date]);

  // Calculate sold values
  const stickSold = Math.max(0, (parseInt(formData.stickLoaded) || 0) + prevBalances.stick - (parseInt(formData.stickBalance) || 0));
  const plateSold = Math.max(0, (parseInt(formData.plateLoaded) || 0) + prevBalances.plate - (parseInt(formData.plateBalance) || 0));
  const potSold = Math.max(0, (parseInt(formData.potLoaded) || 0) + prevBalances.pot - (parseInt(formData.potBalance) || 0));

  // Auto calculate finances
  const discount = parseInt(formData.discount) || 0;
  const cashBagLoaded = parseInt(formData.cashBagLoaded) || 0;
  
  // Required amount: Sales - Discount + Cash Bag Loaded
  // (Because they expect Required Amount to include the loaded cash)
  const expectedSales = (stickSold * settings.stickPrice) + (plateSold * settings.platePrice) + (potSold * settings.potPrice);
  const requiredAmount = expectedSales - discount + cashBagLoaded;

  const actualAmount = (parseInt(formData.cashBagTotal) || 0) + (parseInt(formData.phonePe) || 0);
  const shortage = requiredAmount - actualAmount;
  const finalAmount = actualAmount - (parseInt(formData.bonus) || 0);

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
      plateLoaded: parseInt(formData.plateLoaded) || 0,
      plateBalance: parseInt(formData.plateBalance) || 0,
      plateSold,
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
      expenses: parseInt(formData.expenses) || 0,
      notes: formData.notes
    };

    await saveEntry(entry);
    setLoading(false);
    onSave();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">{isEditing ? 'Edit Entry' : 'Add Entry'}</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{isEditing ? `Editing metrics for ${date}` : "Enter today's closing metrics"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-cyan-400">Inventory</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stick Load <span className="text-purple-400">(Bal: {prevBalances.stick})</span></Label>
                    <Input name="stickLoaded" type="number" value={formData.stickLoaded} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stick Balance</Label>
                    <Input name="stickBalance" type="number" value={formData.stickBalance} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plate Load <span className="text-purple-400">(Bal: {prevBalances.plate})</span></Label>
                    <Input name="plateLoaded" type="number" value={formData.plateLoaded} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plate Balance</Label>
                    <Input name="plateBalance" type="number" value={formData.plateBalance} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-400">(Bal: {prevBalances.pot})</span></Label>
                    <Input name="potLoaded" type="number" value={formData.potLoaded} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pot Balance</Label>
                    <Input name="potBalance" type="number" value={formData.potBalance} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-pink-500">Financials</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash Bag Loaded <span className="text-cyan-400">(START)</span></Label>
                  <Input name="cashBagLoaded" type="number" value={formData.cashBagLoaded} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash Bag Total <span className="text-pink-500">(END)</span></Label>
                  <Input name="cashBagTotal" type="number" value={formData.cashBagTotal} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PhonePe Amount</Label>
                  <Input name="phonePe" type="number" value={formData.phonePe} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offer/Discount</Label>
                  <Input name="discount" type="number" value={formData.discount} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenses</Label>
                  <Input name="expenses" type="number" value={formData.expenses} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bonus</Label>
                  <Input name="bonus" type="number" value={formData.bonus} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</Label>
                <Input name="notes" type="text" placeholder="EXPENSE DETAILS, ETC." value={formData.notes} onChange={handleChange} className="uppercase placeholder:uppercase" />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-800 space-y-4 bg-slate-900/80 border-x-0 border-b-0 -mx-6 px-6 pb-6 rounded-b-3xl mt-6">
               <div className="flex justify-between text-sm items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Sales</span>
                 <span className="font-black text-lg text-white">₹{expectedSales - discount}</span>
               </div>
               <div className="flex justify-between text-sm items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual Sales <span className="text-slate-500">(Excl. Loaded Cash)</span></span>
                 <span className="font-black text-lg text-white">₹{actualAmount - cashBagLoaded}</span>
               </div>
               <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-800/60">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shortage</span>
                 <span className={`font-black text-xl drop-shadow-md ${shortage > 0 ? 'text-pink-500' : 'text-emerald-400'}`}>₹{shortage}</span>
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
