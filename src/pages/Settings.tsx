import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, saveSettings, useInventory, saveInventoryStock, useEntries } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Package, 
  Edit2, 
  KeyRound, 
  LogOut, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Calendar, 
  Sparkles, 
  RotateCcw, 
  Info,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isToday as isTodayDate } from 'date-fns';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { InventoryStock } from '../types';
import Planner from './Planner';
import ExportData from '../components/ExportData';
import MigrateLocalData from '../components/MigrateLocalData';

export default function SettingsPage({ role }: { role: 'owner' | 'manager' }) {
  const [activeTab, setActiveTab] = useState<'settings' | 'inventory' | 'planner' | 'export'>(role === 'owner' ? 'settings' : 'inventory');

  // Settings State
  const { settings, loading: settingsLoading, reload: reloadSettings } = useSettings();
  const [settingsData, setSettingsData] = useState({
    monthlyGoal: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg('');
    setPasswordErrorMsg('');

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      setPasswordMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordErrorMsg('Incorrect old password.');
      } else {
        setPasswordErrorMsg(err.message || 'Error updating password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (!settingsLoading) {
      setSettingsData({
        monthlyGoal: (settings.monthlyGoal || 150000).toString(),
      });
    }
  }, [settings, settingsLoading]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettingsData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await saveSettings({
      ...settings,
      monthlyGoal: parseFloat(settingsData.monthlyGoal) || 150000,
    });
    setSavingSettings(false);
    reloadSettings();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Inventory State
  const { inventory, loading: inventoryLoading, reload: reloadInventory } = useInventory();
  const { entries } = useEntries();
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedInvoice, setParsedInvoice] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedInventoryDate, setSelectedInventoryDate] = useState<string>(todayStr);
  const [showLedgerHistory, setShowLedgerHistory] = useState<boolean>(false);

  const [inventoryData, setInventoryData] = useState<{
    stickQuantity: number | '';
    potQuantity: number | '';
    lastUpdatedDate: string;
    stickFlavours: { name: string; quantity: number }[];
    potFlavours: { name: string; quantity: number }[];
  }>({
    stickQuantity: '',
    potQuantity: '',
    lastUpdatedDate: todayStr,
    stickFlavours: [],
    potFlavours: []
  });

  const baseStockDate = inventory.lastUpdatedDate || '2026-08-14';
  const baseStickQty = Number(inventory.stickQuantity) || 0;
  const basePotQty = Number(inventory.potQuantity) || 0;

  // Global total sold since base date
  const relevantEntries = inventory.lastUpdatedDate
    ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
    : entries;
  const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const availableStick = Math.max(0, baseStickQty - totalStickSold);
  const availablePot = Math.max(0, basePotQty - totalPotSold);

  // Selected date calculations
  const entriesPriorToSelected = useMemo(() => {
    return entries.filter(e => e.date >= baseStockDate && e.date < selectedInventoryDate);
  }, [entries, baseStockDate, selectedInventoryDate]);

  const stickSoldPriorToSelected = entriesPriorToSelected.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const potSoldPriorToSelected = entriesPriorToSelected.reduce((sum, e) => sum + (e.potSold || 0), 0);

  // Day Opening
  const selectedDayOpeningStick = Math.max(0, baseStickQty - stickSoldPriorToSelected);
  const selectedDayOpeningPot = Math.max(0, basePotQty - potSoldPriorToSelected);

  // Day Activity
  const selectedDayEntry = useMemo(() => {
    return entries.find(e => e.date === selectedInventoryDate);
  }, [entries, selectedInventoryDate]);

  const selectedDayStickLoaded = selectedDayEntry ? (selectedDayEntry.stickLoaded || 0) : 0;
  const selectedDayPotLoaded = selectedDayEntry ? (selectedDayEntry.potLoaded || 0) : 0;
  const selectedDayStickSold = selectedDayEntry ? (selectedDayEntry.stickSold || 0) : 0;
  const selectedDayPotSold = selectedDayEntry ? (selectedDayEntry.potSold || 0) : 0;
  const selectedDayStickCartBal = selectedDayEntry 
    ? (selectedDayEntry.stickBalance !== undefined ? selectedDayEntry.stickBalance : Math.max(0, selectedDayStickLoaded - selectedDayStickSold))
    : 0;
  const selectedDayPotCartBal = selectedDayEntry 
    ? (selectedDayEntry.potBalance !== undefined ? selectedDayEntry.potBalance : Math.max(0, selectedDayPotLoaded - selectedDayPotSold))
    : 0;

  // Day Closing / Available at end of day
  const selectedDayClosingStick = Math.max(0, selectedDayOpeningStick - selectedDayStickSold);
  const selectedDayClosingPot = Math.max(0, selectedDayOpeningPot - selectedDayPotSold);

  const isSelectedDateToday = selectedInventoryDate === todayStr;
  const isSelectedDateBaseline = selectedInventoryDate === baseStockDate;

  const latestEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const isStickJobOpen = isSelectedDateToday && latestEntry && latestEntry.stickBalance === undefined && latestEntry.date === selectedInventoryDate;
  const isPotJobOpen = isSelectedDateToday && latestEntry && latestEntry.potBalance === undefined && latestEntry.date === selectedInventoryDate;

  const currentInJobStick = isStickJobOpen ? (latestEntry?.stickLoaded || 0) : 0;
  const currentInJobPot = isPotJobOpen ? (latestEntry?.potLoaded || 0) : 0;

  const currentWarehouseStickBalance = selectedDayClosingStick - currentInJobStick;
  const currentWarehousePotBalance = selectedDayClosingPot - currentInJobPot;

  // Date step handlers
  const handlePrevDay = () => {
    try {
      const prev = subDays(parseISO(selectedInventoryDate), 1);
      setSelectedInventoryDate(format(prev, 'yyyy-MM-dd'));
    } catch {
      // ignore
    }
  };

  const handleNextDay = () => {
    try {
      const next = addDays(parseISO(selectedInventoryDate), 1);
      setSelectedInventoryDate(format(next, 'yyyy-MM-dd'));
    } catch {
      // ignore
    }
  };

  // List of distinct dates with activity since base date
  const recordedRecentDates = useMemo(() => {
    const set = new Set<string>();
    set.add(todayStr);
    if (baseStockDate) set.add(baseStockDate);
    entries.forEach(e => {
      if (e.date >= baseStockDate) set.add(e.date);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries, baseStockDate, todayStr]);

  // Full daily ledger timeline
  const dailyLedger = useMemo(() => {
    const dateSet = new Set<string>();
    if (baseStockDate) dateSet.add(baseStockDate);
    dateSet.add(todayStr);
    if (selectedInventoryDate) dateSet.add(selectedInventoryDate);
    entries.forEach(e => {
      if (e.date >= baseStockDate) dateSet.add(e.date);
    });

    const chronological = Array.from(dateSet).sort((a, b) => a.localeCompare(b));
    let runningStick = baseStickQty;
    let runningPot = basePotQty;

    const rows: {
      date: string;
      openingStick: number;
      openingPot: number;
      loadedStick: number;
      loadedPot: number;
      soldStick: number;
      soldPot: number;
      balanceStick: number;
      balancePot: number;
      closingStick: number;
      closingPot: number;
      hasEntry: boolean;
    }[] = [];

    chronological.forEach(d => {
      const entry = entries.find(e => e.date === d);
      const soldStick = entry ? (entry.stickSold || 0) : 0;
      const soldPot = entry ? (entry.potSold || 0) : 0;
      const loadedStick = entry ? (entry.stickLoaded || 0) : 0;
      const loadedPot = entry ? (entry.potLoaded || 0) : 0;
      const balanceStick = entry ? (entry.stickBalance ?? Math.max(0, loadedStick - soldStick)) : 0;
      const balancePot = entry ? (entry.potBalance ?? Math.max(0, loadedPot - soldPot)) : 0;

      const openS = runningStick;
      const openP = runningPot;
      const closeS = Math.max(0, openS - soldStick);
      const closeP = Math.max(0, openP - soldPot);

      rows.push({
        date: d,
        openingStick: openS,
        openingPot: openP,
        loadedStick,
        loadedPot,
        soldStick,
        soldPot,
        balanceStick,
        balancePot,
        closingStick: closeS,
        closingPot: closeP,
        hasEntry: Boolean(entry)
      });

      runningStick = closeS;
      runningPot = closeP;
    });

    return rows.reverse(); // Newest date first
  }, [baseStockDate, baseStickQty, basePotQty, todayStr, selectedInventoryDate, entries]);

  // In edit mode: calculated stock for whatever date is picked in the input
  const calculatedStockForEditedDate = useMemo(() => {
    const targetDate = inventoryData.lastUpdatedDate;
    if (!targetDate) return null;
    const baseD = inventory.lastUpdatedDate || '2026-08-14';
    const baseS = Number(inventory.stickQuantity) || 0;
    const baseP = Number(inventory.potQuantity) || 0;

    if (targetDate === baseD) {
      return { stick: baseS, pot: baseP, isBase: true, soldBefore: 0 };
    }

    const prior = entries.filter(e => e.date >= baseD && e.date < targetDate);
    const soldS = prior.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const soldP = prior.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const calculatedStick = Math.max(0, baseS - soldS);
    const calculatedPot = Math.max(0, baseP - soldP);

    return {
      stick: calculatedStick,
      pot: calculatedPot,
      soldBefore: soldS,
      soldBeforePot: soldP,
      isBase: false
    };
  }, [inventoryData.lastUpdatedDate, inventory, entries]);

  const handleApplyCalculatedStockForEditDate = () => {
    if (!calculatedStockForEditedDate) return;
    setInventoryData(prev => ({
      ...prev,
      stickQuantity: calculatedStockForEditedDate.stick,
      potQuantity: calculatedStockForEditedDate.pot
    }));
  };

  useEffect(() => {
    if (inventory) {
      setInventoryData({
        stickQuantity: inventory.stickQuantity,
        potQuantity: inventory.potQuantity,
        lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0],
        stickFlavours: inventory.stickFlavours || [],
        potFlavours: inventory.potFlavours || []
      });
    }
  }, [inventory]);

  const handleInventorySave = async () => {
    const item: InventoryStock = {
      id: 'global',
      stickQuantity: Number(inventoryData.stickQuantity) || 0,
      potQuantity: Number(inventoryData.potQuantity) || 0,
      lastUpdatedDate: inventoryData.lastUpdatedDate || new Date().toISOString().split('T')[0],
      stickFlavours: inventoryData.stickFlavours,
      potFlavours: inventoryData.potFlavours
    };
    await saveInventoryStock(item);
    setIsEditingInventory(false);
    reloadInventory();
  };

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const res = await fetch('/api/upload-invoice', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to parse invoice');
      }

      const data = await res.json();
      setParsedInvoice(data);
    } catch (err: any) {
      alert(err.message || 'Error processing invoice');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmInvoice = () => {
    if (!parsedInvoice) return;

    // We add quantities to existing matching flavours, or add new ones
    // We update stickQuantity and potQuantity totals as well
    const existingSticks = [...inventoryData.stickFlavours];
    let addedSticksTotal = 0;

    parsedInvoice.stickFlavours.forEach((f: any) => {
      addedSticksTotal += f.quantity;
      const existing = existingSticks.find(ef => ef.name.toLowerCase() === f.name.toLowerCase());
      if (existing) {
        existing.quantity += f.quantity;
      } else {
        existingSticks.push({ name: f.name, quantity: f.quantity });
      }
    });

    const existingPots = [...inventoryData.potFlavours];
    let addedPotsTotal = 0;

    parsedInvoice.potFlavours.forEach((f: any) => {
      addedPotsTotal += f.quantity;
      const existing = existingPots.find(ef => ef.name.toLowerCase() === f.name.toLowerCase());
      if (existing) {
        existing.quantity += f.quantity;
      } else {
        existingPots.push({ name: f.name, quantity: f.quantity });
      }
    });

    setInventoryData({
      ...inventoryData,
      lastUpdatedDate: parsedInvoice.date || inventoryData.lastUpdatedDate,
      stickQuantity: Number(inventoryData.stickQuantity || 0) + addedSticksTotal,
      potQuantity: Number(inventoryData.potQuantity || 0) + addedPotsTotal,
      stickFlavours: existingSticks,
      potFlavours: existingPots,
    });
    setParsedInvoice(null);
  };

  const startInventoryEdit = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0],
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });
    setIsEditingInventory(true);
  };

  const handleSetStockToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setInventoryData({
      stickQuantity: availableStick,
      potQuantity: availablePot,
      lastUpdatedDate: today,
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });
  };

  const handleResetToRecordedBase = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity,
      potQuantity: inventory.potQuantity,
      lastUpdatedDate: inventory.lastUpdatedDate || new Date().toISOString().split('T')[0],
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });
  };


  if (settingsLoading || inventoryLoading) return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading...</div>;

  return (
    <div className="p-6 space-y-6 pb-32">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 dark:text-white">{role === 'owner' ? 'Admin' : 'Inventory'}</h2>
        <p className="text-slate-750 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">{role === 'owner' ? 'Manage App & Stock' : 'Global Stock Levels'}</p>
      </div>

      {role === 'owner' && (
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-300 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'planner' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            Planner
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'export' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            Export
          </button>
        </div>
      )}

      {activeTab === 'settings' && role === 'owner' && (
        <div className="space-y-6">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-4 text-cyan-600 dark:text-cyan-400 flex justify-between items-center">
                  Goals
                  {successMsg && <span className="text-emerald-500 dark:text-emerald-400 text-[10px]">SAVED!</span>}
                </h3>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Monthly Sales Goal (₹)</Label>
                  <Input name="monthlyGoal" type="text" inputMode="numeric" value={settingsData.monthlyGoal} onChange={handleSettingsChange} required className="border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full h-14" disabled={savingSettings}>
              {savingSettings ? 'SAVING...' : 'SAVE SETTINGS'}
            </Button>
          </form>
        </div>
      )}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">Inventory Management</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
                  Base: {baseStockDate}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Baseline: {baseStickQty} Sticks, {basePotQty} Pots on {baseStockDate}
              </p>
            </div>
            {!isEditingInventory && (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowLedgerHistory(!showLedgerHistory)} 
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl h-8 px-3 text-xs"
                >
                  <History className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />
                  {showLedgerHistory ? 'HIDE LEDGER' : 'VIEW LEDGER'}
                </Button>
                <Button onClick={startInventoryEdit} className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl h-8 px-3 text-xs">
                  <Edit2 className="w-3 h-3 mr-1.5" /> EDIT BASELINE
                </Button>
              </div>
            )}
          </div>

          {isEditingInventory ? (
            <Card className="border border-pink-300 dark:border-pink-900/60 shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Stock & Baseline Date</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Adjust recorded opening batch or reset fresh count for any day</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-black tracking-wider text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                      {isUploading ? 'UPLOADING...' : 'UPLOAD INVOICE'}
                    </Button>
                  </div>
                </div>

                {/* Fast Preset Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleResetToRecordedBase}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inventoryData.lastUpdatedDate === (inventory.lastUpdatedDate || '2026-08-14') && inventoryData.stickQuantity === (inventory.stickQuantity || 0)
                        ? 'border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-300 ring-1 ring-pink-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-pink-500" />
                        Recorded Baseline
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {inventory.lastUpdatedDate || '2026-08-14'} • {inventory.stickQuantity || 0} sticks
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Original</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSetStockToday}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inventoryData.lastUpdatedDate === todayStr && inventoryData.stickQuantity === availableStick
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                        Reset Count Today
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Today ({todayStr}) • {availableStick} sticks available
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">Set Live</span>
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Stock Baseline Date
                      </Label>
                      {calculatedStockForEditedDate && !calculatedStockForEditedDate.isBase && (
                        <button
                          type="button"
                          onClick={handleApplyCalculatedStockForEditDate}
                          className="text-[10px] font-extrabold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 flex items-center gap-1 cursor-pointer underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          Apply Calculated Stock on {inventoryData.lastUpdatedDate} ({calculatedStockForEditedDate.stick} Sticks)
                        </button>
                      )}
                    </div>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                    />
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      All job sales on or after this date are automatically deducted from the quantity below.
                    </p>
                  </div>

                  {calculatedStockForEditedDate && !calculatedStockForEditedDate.isBase && (
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-cyan-900 dark:text-cyan-200">
                        <span className="font-black">Historical inventory on {inventoryData.lastUpdatedDate}:</span>{' '}
                        <span className="font-black text-cyan-600 dark:text-cyan-400">{calculatedStockForEditedDate.stick} Sticks</span>,{' '}
                        <span className="font-black text-pink-600 dark:text-pink-400">{calculatedStockForEditedDate.pot} Pots</span>
                        <span className="text-[10px] block opacity-80 mt-0.5">
                          ({baseStickQty} baseline sticks − {calculatedStockForEditedDate.soldBefore} sticks sold prior to {inventoryData.lastUpdatedDate})
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyCalculatedStockForEditDate}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-black uppercase h-7 px-2.5 rounded-lg whitespace-nowrap"
                      >
                        Use {calculatedStockForEditedDate.stick} Sticks
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Stick Opening Quantity
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.stickQuantity}
                        onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Pot Opening Quantity
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.potQuantity}
                        onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Preview */}
                {(() => {
                  const previewRelevant = inventoryData.lastUpdatedDate
                    ? entries.filter(e => e.date >= inventoryData.lastUpdatedDate)
                    : entries;
                  const prevStickSold = previewRelevant.reduce((sum, e) => sum + (e.stickSold || 0), 0);
                  const prevPotSold = previewRelevant.reduce((sum, e) => sum + (e.potSold || 0), 0);
                  const prevAvailStick = Math.max(0, (Number(inventoryData.stickQuantity) || 0) - prevStickSold);
                  const prevAvailPot = Math.max(0, (Number(inventoryData.potQuantity) || 0) - prevPotSold);

                  return (
                    <div className="bg-slate-100 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Info className="w-3.5 h-3.5 text-pink-500" />
                        Live Stock Calculation Preview
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase block">Stick Kulfi</span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                            Opening: <span className="font-black text-slate-900 dark:text-white">{inventoryData.stickQuantity || 0}</span>
                            <span className="text-red-500 mx-1">− {prevStickSold} sold</span>
                          </div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            = {prevAvailStick} available
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-extrabold text-pink-600 dark:text-pink-400 uppercase block">Pot Kulfi</span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                            Opening: <span className="font-black text-slate-900 dark:text-white">{inventoryData.potQuantity || 0}</span>
                            <span className="text-red-500 mx-1">− {prevPotSold} sold</span>
                          </div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            = {prevAvailPot} available
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleInventorySave} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold h-12 shadow-md">
                    SAVE STOCK
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingInventory(false)} 
                    className="flex-1 h-12"
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Date Selector Banner */}
              <Card className="border border-slate-300 dark:border-slate-800 shadow-sm bg-gradient-to-r from-slate-50 to-pink-50/20 dark:from-slate-900/90 dark:to-pink-950/20">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Date label & status */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {(() => {
                              try {
                                return format(parseISO(selectedInventoryDate), 'EEEE, d MMMM yyyy');
                              } catch {
                                return selectedInventoryDate;
                              }
                            })()}
                          </h4>
                          {isSelectedDateToday && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live Today
                            </span>
                          )}
                          {isSelectedDateBaseline && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                              Baseline Start
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {selectedDayEntry ? 'Job recorded on this date' : 'No job sales recorded on this date'}
                        </p>
                      </div>
                    </div>

                    {/* Date input & stepper */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlePrevDay}
                        className="h-9 w-9 rounded-lg border-slate-300 dark:border-slate-700 cursor-pointer"
                        title="Previous Day"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Input
                        type="date"
                        value={selectedInventoryDate}
                        onChange={e => setSelectedInventoryDate(e.target.value)}
                        className="h-9 text-xs font-bold w-36 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleNextDay}
                        className="h-9 w-9 rounded-lg border-slate-300 dark:border-slate-700 cursor-pointer"
                        title="Next Day"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Select Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 self-center mr-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Quick Jump:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedInventoryDate(todayStr)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedInventoryDate === todayStr
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-pink-300'
                      }`}
                    >
                      ⚡ Today
                    </button>
                    {recordedRecentDates.filter(d => d !== todayStr).slice(0, 8).map(d => {
                      const isBase = d === baseStockDate;
                      let label = d;
                      try {
                        label = format(parseISO(d), 'd MMM');
                      } catch {
                        // ignore
                      }
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedInventoryDate(d)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            selectedInventoryDate === d
                              ? 'bg-pink-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-pink-300'
                          }`}
                        >
                          {label} {isBase ? '(Base)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Product Stock Cards for Selected Day */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stick Kulfi Card */}
                <Card className="border border-cyan-200 dark:border-cyan-900/50 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[10px] text-slate-700 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none">Product</h4>
                          <p className="text-sm font-black text-slate-950 dark:text-white mt-1 uppercase">Stick Kulfi</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {isSelectedDateToday ? 'Current Stock' : 'End of Day Stock'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                          {isSelectedDateToday ? 'Available in Warehouse' : `Closing Stock (${selectedInventoryDate})`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Morning Open: {selectedDayOpeningStick}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{selectedDayClosingStick}</p>
                    </div>

                    {/* Step by step day movement */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Open</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{selectedDayOpeningStick}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">2. Loaded</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{selectedDayStickLoaded}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">3. Sold</span>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                          {selectedDayStickSold > 0 ? `−${selectedDayStickSold}` : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">4. Close</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{selectedDayClosingStick}</span>
                      </div>
                    </div>

                    {/* Active job state if today */}
                    {isSelectedDateToday && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-widest block mb-0.5">In Job (Cart)</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentInJobStick}</span>
                        </div>
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-0.5">Inv Balance</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentWarehouseStickBalance}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pot Kulfi Card */}
                <Card className="border border-pink-200 dark:border-pink-900/50 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[10px] text-slate-700 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none">Product</h4>
                          <p className="text-sm font-black text-slate-950 dark:text-white mt-1 uppercase">Pot Kulfi</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                        {isSelectedDateToday ? 'Current Stock' : 'End of Day Stock'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                          {isSelectedDateToday ? 'Available in Warehouse' : `Closing Stock (${selectedInventoryDate})`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Morning Open: {selectedDayOpeningPot}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{selectedDayClosingPot}</p>
                    </div>

                    {/* Step by step day movement */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Open</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{selectedDayOpeningPot}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider block">2. Loaded</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{selectedDayPotLoaded}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">3. Sold</span>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                          {selectedDayPotSold > 0 ? `−${selectedDayPotSold}` : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">4. Close</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{selectedDayClosingPot}</span>
                      </div>
                    </div>

                    {/* Active job state if today */}
                    {isSelectedDateToday && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-pink-855 dark:text-pink-400 uppercase tracking-widest block mb-0.5">In Job (Cart)</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentInJobPot}</span>
                        </div>
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-0.5">Inv Balance</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentWarehousePotBalance}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Historical Daily Inventory Ledger */}
              {showLedgerHistory && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                          <History className="w-4 h-4 text-pink-500" />
                          Daily Inventory Movement Ledger
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          Timeline of opening, sales, and closing stock from {baseStockDate} to today
                        </p>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                        {dailyLedger.length} Days Recorded
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Stick Opening</th>
                            <th className="py-2.5 px-3">Stick Loaded</th>
                            <th className="py-2.5 px-3">Stick Sold</th>
                            <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Stick Closing</th>
                            <th className="py-2.5 px-3">Pot Sold</th>
                            <th className="py-2.5 px-3 text-pink-600 dark:text-pink-400">Pot Closing</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {dailyLedger.map(row => {
                            const isSelected = row.date === selectedInventoryDate;
                            const isBase = row.date === baseStockDate;
                            const isToday = row.date === todayStr;

                            return (
                              <tr 
                                key={row.date} 
                                onClick={() => setSelectedInventoryDate(row.date)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-pink-500/10 dark:bg-pink-950/40 font-bold' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                                }`}
                              >
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-black ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-slate-900 dark:text-white'}`}>
                                      {row.date}
                                    </span>
                                    {isToday && (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                                        Today
                                      </span>
                                    )}
                                    {isBase && (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                        Base
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{row.openingStick}</td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{row.loadedStick}</td>
                                <td className="py-2.5 px-3 font-bold text-red-500">
                                  {row.soldStick > 0 ? `−${row.soldStick}` : '0'}
                                </td>
                                <td className="py-2.5 px-3 font-black text-cyan-600 dark:text-cyan-400">{row.closingStick}</td>
                                <td className="py-2.5 px-3 font-bold text-red-500">
                                  {row.soldPot > 0 ? `−${row.soldPot}` : '0'}
                                </td>
                                <td className="py-2.5 px-3 font-black text-pink-600 dark:text-pink-400">{row.closingPot}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInventoryDate(row.date);
                                    }}
                                    className={`text-[9px] font-black uppercase px-2 py-1 rounded transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-pink-900/50'
                                    }`}
                                  >
                                    {isSelected ? 'Viewing' : 'Select'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && role === 'owner' && (
        <>
          {/* Password Reset Section */}

      <Card className="border border-pink-200 dark:border-pink-900/50">
        <CardContent className="p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 flex flex-col gap-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400 flex justify-between items-center">
              Reset Password
              {passwordLoading && <span className="text-slate-400 text-[10px] uppercase font-bold animate-pulse">UPDATING...</span>}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Enter old password and validate new password to complete change.</p>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Old Password</Label>
              <Input 
                type="password" 
                placeholder="Enter current password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-pink-500" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  className="border-pink-200 dark:border-pink-900/50 focus-visible:ring-pink-500" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Confirm New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Re-enter new password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  className="border-pink-200 dark:border-pink-900/50 focus-visible:ring-pink-500" 
                />
              </div>
            </div>

            {passwordMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                {passwordMsg}
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wide">
                {passwordErrorMsg}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword} 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black text-xs uppercase h-12 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {passwordLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </Button>
          </form>
        </CardContent>
      </Card>
          {/* Session Management Section */}

      <Card className="border border-rose-200 dark:border-rose-900/50 bg-rose-50/5 dark:bg-rose-950/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-350 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-500" /> Account Session
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Logged in as <span className="text-pink-600 dark:text-pink-400 font-extrabold">{auth.currentUser?.email || 'N/A'}</span>
            </p>
          </div>
          <Button 
            onClick={async () => {
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
            }} 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase h-12 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> SIGN OUT / LOGOUT
          </Button>
        </CardContent>
      </Card>
        </>
      )}
      {activeTab === 'planner' && (
        <Planner />
      )}

      {activeTab === 'export' && (
        <>
          <ExportData />
          <MigrateLocalData />
        </>
      )}

    
      {parsedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase">Confirm Invoice</h3>
            
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</span>
                <p className="font-bold text-slate-900 dark:text-white">{parsedInvoice.date}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setParsedInvoice(null)}>CANCEL</Button>
              <Button type="button" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white" onClick={confirmInvoice}>CONFIRM</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
