import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DailyEntry, Denominations } from '../types';
import { saveEntry, deleteEntry, useSettings, getEntries, useEntries, useInventory, useSpecialOrders, useDailyDenominations, getDenomsStorageKey } from '../store';
import { useFranchise } from '../context/FranchiseContext';
import { format, subDays, parseISO } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Sparkles, MessageCircle, Share2, CheckCircle2 } from 'lucide-react';
import CashReconciliationCard from '../components/CashReconciliationCard';
import { WhatsAppSummaryModal } from '../components/WhatsAppSummaryModal';
import { calculateAvailableStock } from '../lib/inventoryUtils';

const DEFAULT_DENOMS: Denominations = {
  n500: 0,
  n200: 0,
  n100: 0,
  n50: 0,
  n20: 0,
  n10: 0,
  coins: 0
};

// Helper to keep undefined/null values completely blank in inputs
const numToInputStr = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') {
    return '';
  }
  return val.toString();
};

export default function AddEntry({ onSave, onCancel, initialDate }: { onSave: () => void, onCancel?: () => void, initialDate?: string, key?: string }) {
  const { profile } = useFranchise();
  const activeFid = profile?.franchiseId;
  const { settings } = useSettings();
  const { entries } = useEntries();
  const { inventory } = useInventory();
  const { specialOrders } = useSpecialOrders();
  const { dailyDenominationsMap } = useDailyDenominations();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [entryId, setEntryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [appliedFromDenomsFeedback, setAppliedFromDenomsFeedback] = useState<string | null>(null);

  const isDirtyRef = React.useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Date-wise Denominations State
  const [denominations, setDenominations] = useState<Denominations>(DEFAULT_DENOMS);
  const isDenomsDirtyRef = React.useRef(false);

  // Pre-fill previous balances if any
  const [prevBalances, setPrevBalances] = useState({ stick: 0, pot: 0 });
  const [formData, setFormData] = useState({
    stickLoaded: '', stickBalance: '',
    potLoaded: '', potBalance: '',
        plateLoaded: '', plateBalance: '',
    cashBagLoaded: '', cashBagTotal: '', phonePe: '',
    discount: '', additionalExpenses: '', expenseDetails: '', bonus: '',
    notes: ''
  });

  const lastLoadedDateRef = React.useRef<string | null>(null);

  useEffect(() => {
    isDenomsDirtyRef.current = false;
    isDirtyRef.current = false;
    lastLoadedDateRef.current = null;
    setAutoSaveStatus('idle');
  }, [date, activeFid]);

  useEffect(() => {
    if (!entries) return;
    
    const existingEntry = entries.find(e => e.date === date);

    if (existingEntry) {
      setIsEditing(true);
      setEntryId(existingEntry.id);

      if (lastLoadedDateRef.current !== date && !isDirtyRef.current) {
        lastLoadedDateRef.current = date;
        setFormData({
          stickLoaded: numToInputStr(existingEntry.stickLoaded),
          stickBalance: numToInputStr(existingEntry.stickBalance),
          potLoaded: numToInputStr(existingEntry.potLoaded),
          potBalance: numToInputStr(existingEntry.potBalance),
          plateLoaded: numToInputStr(existingEntry.plateLoaded),
          plateBalance: numToInputStr(existingEntry.plateBalance),
          cashBagLoaded: numToInputStr(existingEntry.cashBagLoaded),
          cashBagTotal: numToInputStr(existingEntry.cashBagTotal),
          phonePe: numToInputStr(existingEntry.phonePe),
          discount: numToInputStr(existingEntry.discount),
          additionalExpenses: numToInputStr(existingEntry.additionalExpenses),
          expenseDetails: existingEntry.expenseDetails ?? '',
          bonus: numToInputStr(existingEntry.bonus),
          notes: existingEntry.notes ?? ''
        });

        // 1. Check global real-time cloud denominations map first (synced across all devices/users for this franchise)
        const cloudRecord = dailyDenominationsMap[date];
        const isMatchingFranchise = !cloudRecord?.franchiseId || cloudRecord.franchiseId === activeFid;
        const cloudDenoms = isMatchingFranchise ? cloudRecord?.denominations : undefined;
        let loadedDenoms: Denominations = { ...DEFAULT_DENOMS };

        if (cloudDenoms) {
          loadedDenoms = {
            n500: Number(cloudDenoms.n500) || 0,
            n200: Number(cloudDenoms.n200) || 0,
            n100: Number(cloudDenoms.n100) || 0,
            n50: Number(cloudDenoms.n50) || 0,
            n20: Number(cloudDenoms.n20) || 0,
            n10: Number(cloudDenoms.n10) || 0,
            coins: Number(cloudDenoms.coins) || 0
          };
        } else if (existingEntry.denominations) {
          loadedDenoms = {
            n500: Number(existingEntry.denominations.n500) || 0,
            n200: Number(existingEntry.denominations.n200) || 0,
            n100: Number(existingEntry.denominations.n100) || 0,
            n50: Number(existingEntry.denominations.n50) || 0,
            n20: Number(existingEntry.denominations.n20) || 0,
            n10: Number(existingEntry.denominations.n10) || 0,
            coins: Number(existingEntry.denominations.coins) || 0
          };
        } else {
          // Fallback to local draft cache for this date & franchise
          try {
            const cached = localStorage.getItem(getDenomsStorageKey(date, activeFid));
            if (cached) {
              const parsed = JSON.parse(cached);
              loadedDenoms = {
                n500: Number(parsed.n500) || 0,
                n200: Number(parsed.n200) || 0,
                n100: Number(parsed.n100) || 0,
                n50: Number(parsed.n50) || 0,
                n20: Number(parsed.n20) || 0,
                n10: Number(parsed.n10) || 0,
                coins: Number(parsed.coins) || 0
              };
            }
          } catch {}
        }

        if (!isDenomsDirtyRef.current) {
          setDenominations(loadedDenoms);
        }
      }
    } else {
      if (lastLoadedDateRef.current !== date) {
        lastLoadedDateRef.current = date;
        setIsEditing(false);
        setEntryId(uuidv4());

        if (!isDirtyRef.current) {
          setFormData({
            stickLoaded: '', stickBalance: '',
            potLoaded: '', potBalance: '',
            plateLoaded: '', plateBalance: '',
            cashBagLoaded: '', cashBagTotal: '', phonePe: '',
            discount: '', additionalExpenses: '', expenseDetails: '', bonus: '',
            notes: ''
          });

          let loadedDenoms: Denominations = { ...DEFAULT_DENOMS };

          if (!isDenomsDirtyRef.current) {
            setDenominations(loadedDenoms);
          }
        }
      }
    }

    setAppliedFromDenomsFeedback(null);

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
  }, [date, entries, dailyDenominationsMap, activeFid]);

  const handleDenominationsChange = (newDenoms: Denominations) => {
    isDenomsDirtyRef.current = true;
    isDirtyRef.current = true;
    setDenominations(newDenoms);
    try {
      localStorage.setItem(getDenomsStorageKey(date, activeFid), JSON.stringify(newDenoms));
    } catch (e) {
      console.warn('Failed to save draft denominations to localStorage', e);
    }
  };

  const handleApplyCashBagTotal = (total: number) => {
    isDirtyRef.current = true;
    setFormData(prev => ({ ...prev, cashBagTotal: String(total) }));
    setAppliedFromDenomsFeedback(`Applied ₹${total.toLocaleString('en-IN')} from Currency Denominations`);
    setTimeout(() => setAppliedFromDenomsFeedback(null), 6000);
  };

  const { availableStick, availablePot, availablePlate } = useMemo(() => {
    return calculateAvailableStock(inventory, entries, specialOrders);
  }, [inventory, entries, specialOrders]);

  // Suggested load calculation based on recent average sales
  const suggestedLoad = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { stick: 40, pot: 25, avgStick: 35, avgPot: 20, hasData: false };
    }
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    // Filter previous days relative to selected date to make it robust
    const priorEntries = sorted.filter(e => e.date < date);
    const referenceEntries = priorEntries.length > 0 ? priorEntries.slice(0, 5) : sorted.slice(0, 5);

    if (referenceEntries.length === 0) {
      return { stick: 40, pot: 25, avgStick: 35, avgPot: 20, hasData: false };
    }

    const totalStick = referenceEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPot = referenceEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);

    const avgStick = Math.round(totalStick / referenceEntries.length);
    const avgPot = Math.round(totalPot / referenceEntries.length);

    // Recommend slightly higher load to prevent running out of stock (with 15% buffer), rounded up to nearest 5
    const suggestStickVal = Math.max(10, Math.ceil((avgStick * 1.15) / 5) * 5);
    const suggestPotVal = Math.max(10, Math.ceil((avgPot * 1.15) / 5) * 5);

    return {
      stick: suggestStickVal,
      pot: suggestPotVal,
      avgStick,
      avgPot,
      hasData: true
    };
  }, [entries, date]);

  // Calculate sold values
  const stickLoadedVal = parseInt(formData.stickLoaded) || 0;
  const stickBalanceVal = formData.stickBalance === '' ? stickLoadedVal : (parseInt(formData.stickBalance) || 0);
  const stickSold = Math.max(0, stickLoadedVal - stickBalanceVal);

  const potLoadedVal = parseInt(formData.potLoaded) || 0;
  const potBalanceVal = formData.potBalance === '' ? potLoadedVal : (parseInt(formData.potBalance) || 0);
  const potSold = Math.max(0, potLoadedVal - potBalanceVal);
  const plateLoadedVal = parseInt(formData.plateLoaded) || 0;
  const plateBalanceVal = formData.plateBalance === '' ? plateLoadedVal : (parseInt(formData.plateBalance) || 0);
  const plateSold = Math.max(0, plateLoadedVal - plateBalanceVal);

  // Auto calculate finances
  const discount = parseInt(formData.discount) || 0;
  const cashBagLoaded = parseInt(formData.cashBagLoaded) || 0;
  
  const hasSalesOrCash = stickSold > 0 || potSold > 0 || plateSold > 0 || parseInt(formData.cashBagTotal) > 0 || parseInt(formData.phonePe) > 0;
  const platformRent = (hasSalesOrCash && settings.enablePlatformFee) ? (settings.platformFee || 0) : 0;
  
  const additionalExpenses = parseInt(formData.additionalExpenses) || 0;
  const bonus = parseInt(formData.bonus) || 0;
  
  // Required amount: Sales - Discount + Cash Bag Loaded - Platform Rent - Additional Expenses - Bonus
  const expectedSales = (stickSold * (settings.stickPrice || 40)) + (potSold * (settings.potPrice || 50)) + (plateSold * (settings.platePrice || 75));
  const requiredAmount = expectedSales - discount + cashBagLoaded - platformRent - additionalExpenses - bonus;

  const actualAmount = (parseInt(formData.cashBagTotal) || 0) + (parseInt(formData.phonePe) || 0);
  const shortage = requiredAmount - actualAmount;
  const finalAmount = actualAmount - bonus;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDirtyRef.current = true;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      const { name } = e.target;
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else if (e.target.select) {
      e.target.select();
    }
  };

  
  

  useEffect(() => {
    if (!isDirtyRef.current) return;

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      const matchingEntry = entries?.find(e => e.date === date);
      const safeId = (matchingEntry && matchingEntry.id) ? matchingEntry.id : (entryId && entryId.trim() !== '' ? entryId : uuidv4());
      if (entryId !== safeId) setEntryId(safeId);

      const entry: DailyEntry = {
        id: safeId,
        date,
        stickLoaded: parseInt(formData.stickLoaded) || 0,
        ...(formData.stickBalance !== '' ? { stickBalance: parseInt(formData.stickBalance) } : {}),
        stickSold,
        potLoaded: parseInt(formData.potLoaded) || 0,
        ...(formData.potBalance !== '' ? { potBalance: parseInt(formData.potBalance) } : {}),
        potSold,
        plateLoaded: parseInt(formData.plateLoaded) || 0,
        ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),
        plateSold,
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
        notes: formData.notes,
        denominations,
        franchiseId: activeFid
      };

      try {
        await saveEntry(entry);
        try {
          localStorage.setItem(getDenomsStorageKey(date, activeFid), JSON.stringify(denominations));
        } catch {}
        setAutoSaveStatus('saved');
        setIsEditing(true);
        isDirtyRef.current = false;
      } catch (err) {
        console.error('Auto-save failed:', err);
        setAutoSaveStatus('error');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData, denominations, date, stickSold, potSold, plateSold, discount, requiredAmount, actualAmount, shortage, finalAmount, platformRent, entries, entryId, activeFid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const matchingEntry = entries?.find(e => e.date === date);
    const safeId = (matchingEntry && matchingEntry.id) ? matchingEntry.id : (entryId && entryId.trim() !== '' ? entryId : uuidv4());
    if (entryId !== safeId) setEntryId(safeId);
    const entry: DailyEntry = {
      id: safeId,
      date,
      stickLoaded: parseInt(formData.stickLoaded) || 0,
      ...(formData.stickBalance !== '' ? { stickBalance: parseInt(formData.stickBalance) } : {}),
      stickSold,
      potLoaded: parseInt(formData.potLoaded) || 0,
      ...(formData.potBalance !== '' ? { potBalance: parseInt(formData.potBalance) } : {}),
      potSold,
      plateLoaded: parseInt(formData.plateLoaded) || 0,
      ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),
      plateSold,
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
      notes: formData.notes,
      denominations,
      franchiseId: activeFid
    };

    try {
      await saveEntry(entry);
      try {
        localStorage.setItem(getDenomsStorageKey(date, activeFid), JSON.stringify(denominations));
      } catch {}
      setLoading(false);
      isDirtyRef.current = false;
      setAutoSaveStatus('saved');
      onSave();
    } catch (err: any) {
      setLoading(false);
      alert('Failed to save entry: ' + (err.message || err));
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);
  const latestLoggedEntry = sortedEntries[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              {isEditing ? 'Job Entry' : 'New Job Entry'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isEditing ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
            }`}>
              {isEditing ? 'Saved Record' : 'Draft'}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mt-0.5">
            {isEditing ? `Viewing & Editing metrics for ${format(parseISO(date), 'dd MMM yyyy')}` : `Entering closing metrics for ${format(parseISO(date), 'dd MMM yyyy')}`}
          </p>
        </div>

        {/* Quick Date Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide transition-all ${
              date === todayStr
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today ({format(parseISO(todayStr), 'dd MMM')}) {entries.some(e => e.date === todayStr) ? '✓' : ''}
          </button>

          <button
            type="button"
            onClick={() => setDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide transition-all ${
              date === yesterdayStr
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Yesterday ({format(parseISO(yesterdayStr), 'dd MMM')}) {entries.some(e => e.date === yesterdayStr) ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Status banner when viewing today but previous day has data */}
      {date === todayStr && !isEditing && latestLoggedEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Latest Saved Entry: {format(parseISO(latestLoggedEntry.date), 'dd MMM yyyy')}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              Stick: <span className="font-black text-cyan-600 dark:text-cyan-400">{latestLoggedEntry.stickSold || 0} pcs</span> | Pot: <span className="font-black text-pink-600 dark:text-pink-400">{latestLoggedEntry.potSold || 0} pcs</span> | Cash: <span className="font-black text-emerald-600 dark:text-emerald-400">₹{latestLoggedEntry.actualAmount || 0}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDate(latestLoggedEntry.date)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
          >
            View / Edit {format(parseISO(latestLoggedEntry.date), 'dd MMM')}
          </button>
        </div>
      )}

      {/* Status banner when editing an existing saved record */}
      {isEditing && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
            <div>
              <p className="text-xs font-black text-purple-700 dark:text-purple-300">
                Editing Record for {format(parseISO(date), 'dd MMMM yyyy')}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Previously saved: Stick Sold ({formData.stickLoaded ? parseInt(formData.stickLoaded) - (parseInt(formData.stickBalance) || 0) : 0}), Cash Total (₹{formData.cashBagTotal || '0'}), UPI (₹{formData.phonePe || '0'})
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Date</Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                      date === format(new Date(), 'yyyy-MM-dd')
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                      date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-cyan-600 dark:text-cyan-400">Inventory</h3>
                
                {suggestedLoad.hasData && (
                  <div className="mb-6 p-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 dark:bg-cyan-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Next Day Load Suggestion</span>
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Stick: <span className="text-cyan-600 dark:text-cyan-400">{suggestedLoad.stick} pcs</span> (avg: {suggestedLoad.avgStick}) | Pot: <span className="text-purple-600 dark:text-purple-400">{suggestedLoad.pot} pcs</span> (avg: {suggestedLoad.avgPot})
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Based on recent average sales with 15% safety buffer
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          stickLoaded: suggestedLoad.stick.toString(),
                          potLoaded: suggestedLoad.pot.toString(),
                          plateLoaded: (suggestedLoad.plate || 0).toString()
                        }));
                      }}
                      className="h-8 rounded-xl text-[10px] font-extrabold uppercase px-3 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 shrink-0 self-start sm:self-center"
                    >
                      Use Suggestion
                    </Button>
                  </div>
                )}
                
                <div className="space-y-6">
                  {settings.enableStick !== false && (<div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availableStick})</span></Label>
                      <Input name="stickLoaded" type="text" inputMode="numeric" value={formData.stickLoaded} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Stick Balance</Label>
                      <Input name="stickBalance" type="text" inputMode="numeric" value={formData.stickBalance} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                  </div>
                  )}

                  {settings.enablePot !== false && (<div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePot})</span></Label>
                      <Input name="potLoaded" type="text" inputMode="numeric" value={formData.potLoaded} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Pot Balance</Label>
                      <Input name="potBalance" type="text" inputMode="numeric" value={formData.potBalance} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                  </div>
                  )}

                  {settings.enablePlate && (<div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Load <span className="text-purple-700 dark:text-purple-400 font-black">(Inv Bal: {availablePlate})</span></Label>
                      <Input name="plateLoaded" type="text" inputMode="numeric" value={formData.plateLoaded} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Plate Balance</Label>
                      <Input name="plateBalance" type="text" inputMode="numeric" value={formData.plateBalance} onChange={handleChange} onFocus={handleFocus} />
                    </div>
                  </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-widest mb-5 text-pink-600 dark:text-pink-500">Financials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Cash Bag Loaded <span className="text-cyan-700 dark:text-cyan-400 font-black">(START)</span></Label>
                    <Input name="cashBagLoaded" type="text" inputMode="numeric" value={formData.cashBagLoaded} onChange={handleChange} onFocus={handleFocus} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Cash Bag Total <span className="text-pink-700 dark:text-pink-400 font-black">(END)</span></Label>
                      {appliedFromDenomsFeedback && (
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3" /> Set from counter
                        </span>
                      )}
                    </div>
                    <Input 
                      name="cashBagTotal" 
                      type="text" 
                      inputMode="numeric" 
                      value={formData.cashBagTotal} 
                      onChange={handleChange}
                      onFocus={handleFocus}
                      className={appliedFromDenomsFeedback ? 'ring-2 ring-emerald-500/50 border-emerald-500 transition-all' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">PhonePe Amount</Label>
                    <Input name="phonePe" type="text" inputMode="numeric" value={formData.phonePe} onChange={handleChange} onFocus={handleFocus} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Offer/Discount</Label>
                    <Input name="discount" type="text" inputMode="numeric" value={formData.discount} onChange={handleChange} onFocus={handleFocus} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Bonus</Label>
                    <Input name="bonus" type="text" inputMode="numeric" value={formData.bonus} onChange={handleChange} onFocus={handleFocus} />
                  </div>
                </div>
              </div>

              {/* End-of-Day Cash Bag Reconciliation & Denomination Counter */}
              <div className="pt-2">
                <CashReconciliationCard
                  date={date}
                  franchiseId={activeFid}
                  cashBagLoaded={cashBagLoaded}
                  expectedSales={expectedSales}
                  discount={discount}
                  phonePe={parseInt(formData.phonePe) || 0}
                  platformRent={platformRent}
                  additionalExpenses={additionalExpenses}
                  bonus={bonus}
                  cashBagTotal={parseInt(formData.cashBagTotal) || 0}
                  denominations={denominations}
                  cloudRecord={dailyDenominationsMap[date]}
                  onDenominationsChange={handleDenominationsChange}
                  onApplyCashBagTotal={handleApplyCashBagTotal}
                />
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
               {settings.enableStick !== false && (
                 <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/40">
                   <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stick Kulfi Sold</span>
                   <span className="font-black text-sm text-cyan-600 dark:text-cyan-400">{stickSold} pcs</span>
                 </div>
               )}
               {settings.enablePot !== false && (
                 <div className={`flex justify-between text-sm items-center ${settings.enableStick === false ? 'pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/40' : ''}`}>
                   <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pot Kulfi Sold</span>
                   <span className="font-black text-sm text-purple-600 dark:text-purple-400">{potSold} pcs</span>
                 </div>
               )}
               {settings.enablePlate !== false && (
                 <div className={`flex justify-between text-sm items-center ${settings.enableStick === false && settings.enablePot === false ? 'pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/40' : ''}`}>
                   <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Plate Kulfi Sold</span>
                   <span className="font-black text-sm text-amber-600 dark:text-amber-500">{plateSold} pcs</span>
                 </div>
               )}
            </div>

          </CardContent>
        </Card>

        <div className="flex gap-2 sm:gap-3">
          {onCancel && (
            <Button type="button" variant="outline" className="w-20 sm:w-28 flex-none h-12 text-[10px] sm:text-xs font-black uppercase tracking-wider border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300" size="lg" disabled={loading} onClick={onCancel}>
              CANCEL
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            title="Share on WhatsApp"
            onClick={() => setShowWhatsAppModal(true)}
            className="w-12 sm:w-auto px-0 sm:px-4 flex-none h-12 text-xs font-black uppercase tracking-wider border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button type="submit" disabled={loading || autoSaveStatus === 'saving'} className={`flex-1 font-black text-sm sm:text-base uppercase h-12 rounded-xl shadow-md transition-all cursor-pointer ${
            autoSaveStatus === 'saved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}>
            {loading || autoSaveStatus === 'saving' ? 'SAVING...' : autoSaveStatus === 'saved' ? 'DONE (SAVED)' : isEditing ? 'UPDATE ENTRY' : 'SAVE ENTRY'}
          </Button>
        </div>
      </form>

      {/* WhatsApp Daily Closing Summary Modal */}
      {showWhatsAppModal && (
        <WhatsAppSummaryModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          entry={{
            id: entryId || 'draft',
            date,
            stickLoaded: parseInt(formData.stickLoaded) || 0,
            stickBalance: formData.stickBalance !== '' ? parseInt(formData.stickBalance) : undefined,
            stickSold,
            potLoaded: parseInt(formData.potLoaded) || 0,
            potBalance: formData.potBalance !== '' ? parseInt(formData.potBalance) : undefined,
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
            notes: formData.notes,
            denominations
          }}
          inventory={inventory}
          settings={settings}
        />
      )}
    </div>
  );
}
