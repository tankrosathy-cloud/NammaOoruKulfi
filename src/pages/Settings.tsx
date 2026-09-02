import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, saveSettings, useInventory, saveInventoryStock, useEntries, useSpecialOrders } from '../store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { useFranchise } from '../context/FranchiseContext';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Users,
  Package, 
  Edit2, 
  KeyRound, 
  LogOut, 
  Upload, 
  ImageIcon, 
  Loader2, 
  Calendar, 
  Sparkles, 
  RotateCcw, 
  Info,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Clock,
  Copy,
  Share2,
  CheckCircle2,
  ListFilter,
  Sliders,
  Database,
  Download,
  Plus,
  BarChart3,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Check,
  HelpCircle,
  PhoneCall,
  Mail,
  MessageCircle,
  UserCheck
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isToday as isTodayDate, startOfMonth, endOfMonth } from 'date-fns';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { InventoryStock, UserProfile } from '../types';
import Planner from './Planner';
import ExportData from '../components/ExportData';
import MigrateLocalData from '../components/MigrateLocalData';
import SupabaseManager from '../components/SupabaseManager';
import { calculateAvailableStock, calculateDailyStockLedger, DayStockLedgerRow } from '../lib/inventoryUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

export default function SettingsPage({ role }: { role: 'owner' | 'staff' }) {
  const currentUsername = (auth.currentUser?.email || '').split('@')[0].toLowerCase();
  const isAdminUser = currentUsername === 'admin' || currentUsername === 'tankrosathy';

  
  const handleCopyInvite = async () => {
    if (!franchise?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(franchise.inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareInvite = async () => {
    if (!franchise?.inviteCode) return;
    const shareText = `Join my Namma Ooru Kulfi franchise!\n\nInstructions:\n1. Open the application using https://nammaoorukulfi.ai.studio/\n2. Enter your email address to sign up\n3. Enter the invite code: ${franchise.inviteCode}`;
    const shareData = {
      title: 'Namma Ooru Kulfi Invite',
      text: shareText,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to share', err);
    }
  };

  const [activeTab, setActiveTab] = useState<'franchise' | 'settings' | 'inventory' | 'planner' | 'export' | 'database'>(
    role === 'owner' ? 'inventory' : 'inventory'
  );

  // Settings State
  const { settings, loading: settingsLoading, reload: reloadSettings } = useSettings();
  const { profile, franchise } = useFranchise();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [settingsData, setSettingsData] = useState({
    monthlyGoal: '',
    enableStick: true,
    enablePot: true,
    enablePlate: true,
    enablePlatformFee: false,
    stickPrice: '',
    potPrice: '',
    platePrice: '',
    platformFee: '',
    expensePaidByNames: '',
    expenseCategories: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

    const [profileName, setProfileName] = useState(profile?.name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', profile.uid), {
        name: profileName,
        phone: profilePhone
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
      
      // dispatch custom event to re-fetch profile in FranchiseContext if needed
      window.dispatchEvent(new Event('franchiseChanged'));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function fetchStaff() {
      if (profile?.role === 'owner' || profile?.role === 'manager') {
        if (!franchise?.id) return;
        setLoadingStaff(true);
        try {
          const q = query(collection(db, 'users'), where('franchiseId', '==', franchise.id));
          const snapshot = await getDocs(q);
          const users = snapshot.docs.map(doc => doc.data() as UserProfile);
          setStaffUsers(users.filter(u => u.uid !== franchise?.ownerId));
        } catch (err) {
          console.error("Failed to fetch staff:", err);
        } finally {
          setLoadingStaff(false);
        }
      }
    }
    if (activeTab === 'franchise') {
      fetchStaff();
    }
  }, [activeTab, franchise?.id, profile?.role, franchise?.ownerId]);

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
        enableStick: settings.enableStick ?? true,
        enablePot: settings.enablePot ?? true,
        enablePlate: settings.enablePlate ?? true,
        enablePlatformFee: settings.enablePlatformFee ?? false,
        stickPrice: (settings.stickPrice || 40).toString(),
        potPrice: (settings.potPrice || 50).toString(),
        platePrice: (settings.platePrice || 75).toString(),
        platformFee: (settings.platformFee ?? 0).toString(),
        monthlyGoal: (settings.monthlyGoal || 150000).toString(),
        expensePaidByNames: (settings.expensePaidByNames || ['Owner', 'Manager', 'Staff']).join(', '),
        expenseCategories: (settings.expenseCategories || ['Petrol/Fuel', 'Food', 'Maintenance', 'Salary', 'Supplies', 'Rent', 'Chit', 'Inventory', 'Others']).join(', '),
      });
    }
  }, [settings, settingsLoading]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await saveSettings({
      ...settings,
      enableStick: settingsData.enableStick,
      enablePot: settingsData.enablePot,
      enablePlate: settingsData.enablePlate,
      enablePlatformFee: settingsData.enablePlatformFee,
      stickPrice: parseFloat(settingsData.stickPrice) || 40,
      potPrice: parseFloat(settingsData.potPrice) || 50,
      platePrice: parseFloat(settingsData.platePrice) || 75,
      platformFee: parseFloat(settingsData.platformFee) || 0,
      monthlyGoal: parseFloat(settingsData.monthlyGoal) || 150000,
      expensePaidByNames: settingsData.expensePaidByNames.split(',').map(s => s.trim()).filter(Boolean),
      expenseCategories: settingsData.expenseCategories.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSavingSettings(false);
    reloadSettings();
    
    // Scroll to top to show success message
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Inventory State
  const { inventory, loading: inventoryLoading, reload: reloadInventory } = useInventory();
  const { entries } = useEntries();
  const { specialOrders } = useSpecialOrders();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedInventoryDate, setSelectedInventoryDate] = useState<string>(todayStr);
  const [stockSubView, setStockSubView] = useState<'10day' | 'inspector'>('10day');
  const [historyRangeDays, setHistoryRangeDays] = useState<number>(10);
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedInvoice, setParsedInvoice] = useState<any>(null);
  const [deliveryAddQuantity, setDeliveryAddQuantity] = useState<{ stick: string; pot: string; plate: string }>({ stick: '', pot: '', plate: '' });
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inventoryData, setInventoryData] = useState<{
    stickQuantity: number | '';
    potQuantity: number | '';
    plateQuantity: number | '';
    lastUpdatedDate: string;
    stickFlavours: { name: string; quantity: number }[];
    potFlavours: { name: string; quantity: number }[];
    plateFlavours: { name: string; quantity: number }[];
  }>({
    stickQuantity: '',
    potQuantity: '',
    plateQuantity: '',
    lastUpdatedDate: todayStr,
    stickFlavours: [],
    potFlavours: []
  });

  // Calculate live available stock and stats via centralized utility
  const availableStats = useMemo(() => {
    return calculateAvailableStock(inventory, entries, specialOrders);
  }, [inventory, entries, specialOrders]);

  const baseStockDate = availableStats.baseStockDate;
  const baseStickQty = availableStats.baseStickQty;
  const basePotQty = availableStats.basePotQty;
  const availableStick = availableStats.availableStick;
  const availablePot = availableStats.availablePot;
  const availablePlate = availableStats.availablePlate;

  // Calculate complete continuous daily stock ledger (including 11:59 PM closing stock)
  const { ledgerRows, last10DaysRows, selectedDateRow } = useMemo(() => {
    return calculateDailyStockLedger(inventory, entries, specialOrders, historyRangeDays);
  }, [inventory, entries, specialOrders, historyRangeDays]);

  // Selected Day Information
  const currentDayRow: DayStockLedgerRow = useMemo(() => {
    const found = selectedDateRow(selectedInventoryDate);
    if (found) return found;

    return {
      date: selectedInventoryDate,
      displayDate: selectedInventoryDate,
      fullDisplayDate: selectedInventoryDate,
      dayName: '',
      isToday: selectedInventoryDate === todayStr,
      isBaseline: selectedInventoryDate === baseStockDate,
      openingStick: availableStick,
      loadedStick: 0,
      soldStick: 0,
      specialOrderStick: 0,
      totalStickDeducted: 0,
      cartBalanceStick: 0,
      closingStick: availableStick,
      openingPot: availablePot,
      loadedPot: 0,
      soldPot: 0,
      specialOrderPot: 0,
      totalPotDeducted: 0,
      cartBalancePot: 0,
      closingPot: availablePot,
      hasEntry: false,
      hasSpecialOrder: false,
      stockStatusStick: 'healthy',
      stockStatusPot: 'healthy'
    };
  }, [selectedDateRow, selectedInventoryDate, todayStr, baseStockDate, availableStick, availablePot]);

  const isSelectedDateToday = selectedInventoryDate === todayStr;
  const isSelectedDateBaseline = selectedInventoryDate === baseStockDate;

  // Check if today has an open cart job
  const latestEntry = [...entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const isStickJobOpen = isSelectedDateToday && latestEntry && latestEntry.stickBalance === undefined && latestEntry.date === selectedInventoryDate;
  const isPotJobOpen = isSelectedDateToday && latestEntry && latestEntry.potBalance === undefined && latestEntry.date === selectedInventoryDate;
  const isPlateJobOpen = isSelectedDateToday && latestEntry && latestEntry.plateBalance === undefined && latestEntry.date === selectedInventoryDate;
  const currentInJobStick = isStickJobOpen ? (latestEntry?.stickLoaded || 0) : 0;
  const currentInJobPot = isPotJobOpen ? (latestEntry?.potLoaded || 0) : 0;
  const currentWarehouseStickBalance = Math.max(0, currentDayRow.closingStick - currentInJobStick);
  const currentWarehousePotBalance = Math.max(0, currentDayRow.closingPot - currentInJobPot);
  const currentInJobPlate = isPlateJobOpen ? (latestEntry?.plateLoaded || 0) : 0;
  const currentWarehousePlateBalance = Math.max(0, currentDayRow.closingPlate - currentInJobPlate);

  // Stepper handlers
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

  // Recent activity dates for fast jump
  const recordedRecentDates = useMemo(() => {
    const set = new Set<string>();
    set.add(todayStr);
    if (baseStockDate) set.add(baseStockDate);
    entries.forEach(e => {
      if (e.date) set.add(e.date);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries, baseStockDate, todayStr]);

  // Edit stock baseline handlers
  const startInventoryEdit = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity ?? 0,
      potQuantity: inventory.potQuantity ?? 0,
      plateQuantity: inventory.plateQuantity ?? 0,
      lastUpdatedDate: (inventory.lastUpdatedDate || todayStr).split('T')[0],
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });
    setIsEditingInventory(true);
  };

  const handleSetStockToday = () => {
    setInventoryData(prev => ({
      ...prev,
      stickQuantity: availableStick,
      potQuantity: availablePot,
      plateQuantity: availablePlate,
      lastUpdatedDate: todayStr,
    }));
  };

  const handleResetToRecordedBase = () => {
    setInventoryData({
      stickQuantity: inventory.stickQuantity ?? 0,
      potQuantity: inventory.potQuantity ?? 0,
      plateQuantity: inventory.plateQuantity ?? 0,
      lastUpdatedDate: (inventory.lastUpdatedDate || '2026-08-01').split('T')[0],
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || [],
      plateFlavours: inventory.plateFlavours || []
    });
  };

  const handleInventorySave = async () => {
    // Ensure clean YYYY-MM-DD date format
    const cleanDate = (inventoryData.lastUpdatedDate || todayStr).split('T')[0];
    const item: InventoryStock = {
      id: 'global',
      stickQuantity: Math.max(0, Number(inventoryData.stickQuantity) || 0),
      potQuantity: Math.max(0, Number(inventoryData.potQuantity) || 0),
      plateQuantity: Math.max(0, Number(inventoryData.plateQuantity) || 0),
      lastUpdatedDate: cleanDate,
      stickFlavours: inventoryData.stickFlavours,
      potFlavours: inventoryData.potFlavours,
      plateFlavours: inventoryData.plateFlavours
    };
    await saveInventoryStock(item);
    setIsEditingInventory(false);
    reloadInventory();
  };

  const handleResetInventory = async () => {
    const item: InventoryStock = {
      id: 'global',
      stickQuantity: 0,
      potQuantity: 0,
      plateQuantity: 0,
      lastUpdatedDate: todayStr,
      stickFlavours: [],
      potFlavours: [],
      plateFlavours: []
    };
    
    await saveInventoryStock(item);
    setIsEditingInventory(false);
    setShowResetModal(false);
    reloadInventory();
  };

  // Add stock delivery batch
  const handleAddStockDelivery = async () => {
    const addedStick = Number(deliveryAddQuantity.stick) || 0;
    const addedPot = Number(deliveryAddQuantity.pot) || 0;
    const addedPlate = Number(deliveryAddQuantity.plate) || 0;
    if (addedStick === 0 && addedPot === 0 && addedPlate === 0) return;

    // When new stock arrives, we top up the current available stock and update the baseline for today
    const newStickBaseline = availableStick + addedStick;
    const newPotBaseline = availablePot + addedPot;
    const newPlateBaseline = availablePlate + addedPlate;

    const item: InventoryStock = {
      id: 'global',
      stickQuantity: newStickBaseline,
      potQuantity: newPotBaseline,
      plateQuantity: newPlateBaseline,
      lastUpdatedDate: todayStr,
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || [],
      plateFlavours: inventory.plateFlavours || []
    };
    await saveInventoryStock(item);
    setDeliveryAddQuantity({ stick: '', pot: '', plate: '' });
    setShowDeliveryModal(false);
    reloadInventory();
  };

  // Invoices & flavor uploads
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

  // Export 10-Day Stock Ledger as CSV
  const handleExportStockCSV = () => {
    const headers = [
      'Date',
      'Day',
      'Stick Opening (00:00 AM)',
      'Stick Loaded',
      'Stick Sold (Job)',
      'Special Order Sticks',
      'Total Sticks Deducted',
      'Stick Cart Balance',
      'Stick Closing (11:59 PM)',
      'Pot Opening (00:00 AM)',
      'Pot Loaded',
      'Pot Sold (Job)',
      'Special Order Pots',
      'Total Pots Deducted',
      'Pot Cart Balance',
      'Pot Closing (11:59 PM)'
    ];

    const rows = last10DaysRows.map(r => [
      r.date,
      r.dayName,
      r.openingStick,
      r.loadedStick,
      r.soldStick,
      r.specialOrderStick,
      r.totalStickDeducted,
      r.cartBalanceStick,
      r.closingStick,
      r.openingPot,
      r.loadedPot,
      r.soldPot,
      r.specialOrderPot,
      r.totalPotDeducted,
      r.cartBalancePot,
      r.closingPot
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kulfi_stock_availability_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data for 10-day stock timeline
  const chartData = useMemo(() => {
    return [...last10DaysRows].reverse().map(r => ({
      date: r.displayDate,
      rawDate: r.date,
      stickClosing: r.closingStick,
      potClosing: r.closingPot,
      stickSold: r.totalStickDeducted,
      potSold: r.totalPotDeducted
    }));
  }, [last10DaysRows]);

  // Total sold in the selected period (e.g. 10 days)
  const periodTotals = useMemo(() => {
    const totalStickSold = last10DaysRows.reduce((sum, r) => sum + r.totalStickDeducted, 0);
    const totalPotSold = last10DaysRows.reduce((sum, r) => sum + r.totalPotDeducted, 0);
    const totalPlateSold = last10DaysRows.reduce((sum, r) => sum + r.totalPlateDeducted, 0);
    const startStick = last10DaysRows.length > 0 ? last10DaysRows[last10DaysRows.length - 1].openingStick : availableStick;
    const startPot = last10DaysRows.length > 0 ? last10DaysRows[last10DaysRows.length - 1].openingPot : availablePot;
    const startPlate = last10DaysRows.length > 0 ? last10DaysRows[last10DaysRows.length - 1].openingPlate : availablePlate;
    const avgDailyStick = last10DaysRows.length > 0 ? Math.round(totalStickSold / last10DaysRows.length) : 0;
    return { totalStickSold, totalPotSold, totalPlateSold, startStick, startPot, startPlate, avgDailyStick };
  }, [last10DaysRows, availableStick, availablePot, availablePlate]);

  if (settingsLoading || inventoryLoading) {
    return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-32 max-w-full overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-slate-900 dark:text-white">
          {role === 'owner' ? 'Admin & Stock' : 'Inventory Management'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {role === 'owner' ? 'Manage inventory, stock history, and app configurations' : 'Live stock availability and daily deductions'}
        </p>
      </div>

      {/* Main Top-Level Navigation Tabs */}
      <div className="flex flex-col gap-2">
        {/* Top Row: Settings, Planner, Stock, Export */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-300 dark:border-slate-800">
          {role === 'owner' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'settings' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Settings</span>
            </button>
          )}
          {role === 'owner' && (
            <button
              onClick={() => setActiveTab('planner')}
              className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'planner' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Planner</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'} ${role !== 'owner' ? 'col-span-4' : ''}`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Stock</span>
          </button>
          {role === 'owner' && (
            <button
              onClick={() => setActiveTab('export')}
              className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'export' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export</span>
            </button>
          )}
        </div>

        {/* Bottom Row: Franchise, Help, and Database (if admin) */}
        <div className={`grid ${isAdminUser ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-300 dark:border-slate-800`}>
          <button
            onClick={() => setActiveTab('franchise')}
            className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'franchise' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Franchise</span>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'help' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Help</span>
          </button>
          {isAdminUser && (
            <button
              onClick={() => setActiveTab('database')}
              className={`w-full h-9 sm:h-10 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${activeTab === 'database' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 font-extrabold dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Database</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INVENTORY / STOCK TAB */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Top Overview & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Live Inventory
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Base: {baseStockDate}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{availableStick}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sticks</span>
                
                <span className="text-2xl font-black tracking-tight text-pink-600 dark:text-pink-400 ml-2">{availablePot}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pots</span>

                {settings?.enablePlate && (
                  <>
                    <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 ml-2">{availablePlate}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Plates</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-deducting daily sales
              </p>
            </div>

            {!isEditingInventory && role === 'owner' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={() => setShowDeliveryModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl h-10 px-4 text-sm shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Delivery
                </Button>
                <Button 
                  onClick={startInventoryEdit} 
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl h-10 px-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Override Stock
                </Button>
                {role === 'owner' && (
                  <Button 
                    onClick={() => setShowResetModal(true)} 
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl h-10 px-4 text-sm transition-all"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* EDIT BASELINE MODAL / CARD */}
          {isEditingInventory && (
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-slate-400" /> Manual Stock Override
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Set a physical baseline count. Sales on or after this date are automatically subtracted.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                      {isUploading ? 'Uploading...' : 'Upload Invoice'}
                    </Button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSetStockToday}
                    className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      inventoryData.lastUpdatedDate === todayStr && inventoryData.stickQuantity === availableStick
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 ring-1 ring-cyan-500 text-cyan-900 dark:text-cyan-100'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      Set to Today ({todayStr})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Live counts: {availableStick} sticks, {availablePot} pots{settings?.enablePlate ? `, ${availablePlate} plates` : ''}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToRecordedBase}
                    className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      inventoryData.lastUpdatedDate === (inventory.lastUpdatedDate || '2026-08-01')
                        ? 'border-slate-800 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-800 dark:ring-slate-600 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      Restore Original
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {inventory.lastUpdatedDate || '2026-08-01'} • {inventory.stickQuantity || 0} sticks
                    </div>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Effective Date
                    </Label>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Stick Count
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.stickQuantity}
                        onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pot Count
                      </Label>
                      <Input 
                        type="text" inputMode="numeric"
                        value={inventoryData.potQuantity}
                        onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                        className="h-10 text-sm"
                      />
                    </div>
                    {settings?.enablePlate && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Plate Count
                        </Label>
                        <Input 
                          type="text" inputMode="numeric"
                          value={inventoryData.plateQuantity}
                          onChange={e => setInventoryData({...inventoryData, plateQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0"
                          className="h-10 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Preview */}
                {(() => {
                  const targetDate = (inventoryData.lastUpdatedDate || todayStr).split('T')[0];
                  const previewRelevantEntries = entries.filter(e => e.date >= targetDate);
                  const previewRelevantSpecials = specialOrders.filter(s => s.date >= targetDate);
                  const prevStickSold = previewRelevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
                  const prevPotSold = previewRelevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
                  const prevSpecialStick = previewRelevantSpecials.reduce((sum, s) => sum + (s.stickQuantity || 0), 0);
                  const prevSpecialPot = previewRelevantSpecials.reduce((sum, s) => sum + (s.potQuantity || 0), 0);
                  const totalPrevStickDeducted = prevStickSold + prevSpecialStick;
                  const totalPrevPotDeducted = prevPotSold + prevSpecialPot;
                  const prevPlateSold = previewRelevantEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0);
                  const prevSpecialPlate = previewRelevantSpecials.reduce((sum, s) => sum + (s.plateQuantity || 0), 0);
                  const totalPrevPlateDeducted = prevPlateSold + prevSpecialPlate;

                  const prevAvailStick = Math.max(0, (Number(inventoryData.stickQuantity) || 0) - totalPrevStickDeducted);
                  const prevAvailPot = Math.max(0, (Number(inventoryData.potQuantity) || 0) - totalPrevPotDeducted);
                  const prevAvailPlate = Math.max(0, (Number(inventoryData.plateQuantity) || 0) - totalPrevPlateDeducted);

                  return (
                    <div className="bg-slate-100 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Info className="w-3.5 h-3.5 text-pink-500" />
                        Live Stock Calculation Preview
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase block">Stick Kulfi</span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                            Count: <span className="font-black text-slate-900 dark:text-white">{inventoryData.stickQuantity || 0}</span>
                            <span className="text-red-500 mx-1">− {totalPrevStickDeducted} sold ({prevStickSold} cart + {prevSpecialStick} catering)</span>
                          </div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            = {prevAvailStick} available
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-extrabold text-pink-600 dark:text-pink-400 uppercase block">Pot Kulfi</span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                            Count: <span className="font-black text-slate-900 dark:text-white">{inventoryData.potQuantity || 0}</span>
                            <span className="text-red-500 mx-1">− {totalPrevPotDeducted} sold</span>
                          </div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            = {prevAvailPot} available
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase block">Plate Kulfi</span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                            Count: <span className="font-black text-slate-900 dark:text-white">{inventoryData.plateQuantity || 0}</span>
                            <span className="text-red-500 mx-1">− {totalPrevPlateDeducted} sold</span>
                          </div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            = {prevAvailPlate} available
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleInventorySave} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 shadow-md">
                    SAVE & APPLY STOCK
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
              )}

          {/* Sub Navigation for Stock Views */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStockSubView('10day')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                stockSubView === '10day'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>10-Day Availability (11:59 PM)</span>
            </button>
            <button
              onClick={() => setStockSubView('inspector')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                stockSubView === 'inspector'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Daily Inspector</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 1. VIEW: 10-DAY END-OF-DAY (11:59 PM) STOCK AVAILABILITY */}
          {/* ========================================================================= */}
          {stockSubView === '10day' && (
            <div className="space-y-6">
              {/* Range Selector & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-500" />
                    Last {historyRangeDays} Days Stock Availability (11:59 PM Close)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Continuous physical inventory remaining in shop at 11:59 PM after all daily sales & special catering orders
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Range selector */}
                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {[7, 10, 14, 30].map(days => (
                      <button
                        key={days}
                        onClick={() => setHistoryRangeDays(days)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          historyRangeDays === days
                            ? 'bg-pink-500 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {days}D
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleExportStockCSV}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-black uppercase rounded-lg border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-pink-500" /> Export CSV
                  </Button>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                      Starting Stock ({historyRangeDays}d Ago)
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{periodTotals.startStick} <span className="text-xs font-bold text-slate-500">sticks</span></p>
                    <p className="text-[10px] font-bold text-slate-500">{periodTotals.startPot} pot kulfies</p>
                    {settings?.enablePlate && (
                      <p className="text-[10px] font-bold text-slate-500">{periodTotals.startPlate} plate kulfies</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10 shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                      Total Sold ({historyRangeDays} Days)
                    </span>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">−{periodTotals.totalStickSold} <span className="text-xs font-bold text-slate-500">sticks</span></p>
                    <p className="text-[10px] font-bold text-slate-500">−{periodTotals.totalPotSold} pots deducted</p>
                    {settings?.enablePlate && (
                      <p className="text-[10px] font-bold text-slate-500">−{periodTotals.totalPlateSold} plates deducted</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Live Stock Available Today
                    </span>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableStick} <span className="text-xs font-bold text-slate-500">sticks</span></p>
                    <p className="text-[10px] font-bold text-slate-500">{availablePot} pots remaining</p>
                    {settings?.enablePlate && (
                      <p className="text-[10px] font-bold text-slate-500">{availablePlate} plates remaining</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10 shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                      Avg Daily Depletion
                    </span>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">~{periodTotals.avgDailyStick} <span className="text-xs font-bold text-slate-500">pcs/day</span></p>
                    <p className="text-[10px] font-bold text-slate-500">Rate of consumption</p>
                  </CardContent>
                </Card>
              </div>

              {/* 10-Day Stock Depletion Chart */}
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                        11:59 PM Available Stock Trend (Last {historyRangeDays} Days)
                      </h5>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        Visual inventory depletion curve across dates
                      </p>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
                                  <div className="font-black text-cyan-400">{data.rawDate}</div>
                                  <div>11:59 PM Closing Stock: <span className="font-black text-emerald-400">{data.stickClosing} sticks</span></div>
                                  <div>Sold on Day: <span className="font-bold text-red-400">−{data.stickSold} sticks</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="stickClosing" 
                          stroke="#06b6d4" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#stockGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive 10-Day Table */}
              <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-pink-500" />
                        Daily Stock Ledger Breakdown (Last {historyRangeDays} Days)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        Click on any row to open the full single-day inspector
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900">
                      {last10DaysRows.length} Days Computed
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/60">
                          <th className="py-3 px-3.5">Date & Day</th>
                          <th className="py-3 px-3 text-slate-600 dark:text-slate-400">00:00 AM Open</th>
                          <th className="py-3 px-3 text-cyan-600 dark:text-cyan-400">Cart Loaded</th>
                          <th className="py-3 px-3 text-red-500">Cart Sold</th>
                          <th className="py-3 px-3 text-purple-600 dark:text-purple-400">Special Order</th>
                          <th className="py-3 px-3 text-red-600 font-black">Total Deducted</th>
                          <th className="py-3 px-3 text-slate-600 dark:text-slate-400">Unsold Returned</th>
                          <th className="py-3 px-3.5 text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/5">11:59 PM Stock</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {last10DaysRows.map(row => {
                          const isToday = row.date === todayStr;
                          const isBase = row.date === baseStockDate;

                          return (
                            <tr 
                              key={row.date} 
                              onClick={() => {
                                setSelectedInventoryDate(row.date);
                                setStockSubView('inspector');
                              }}
                              className={`cursor-pointer transition-colors ${
                                isToday 
                                  ? 'bg-pink-500/5 dark:bg-pink-950/20 font-medium' 
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                              }`}
                            >
                              {/* Date Column */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 dark:text-white">
                                    {row.displayDate}
                                  </span>
                                  {isToday && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                                      Today
                                    </span>
                                  )}
                                  {isBase && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300">
                                      Base
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 block">{row.dayName}</span>
                              </td>

                              {/* Morning Open */}
                              <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                                {row.openingStick} <span className="text-[9px] text-slate-400 font-normal">({row.openingPot}pt{settings?.enablePlate ? `, ${row.openingPlate}pl` : ''})</span>
                              </td>

                              {/* Cart Loaded */}
                              <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                                {row.loadedStick > 0 ? row.loadedStick : '—'}
                              </td>

                              {/* Cart Sold */}
                              <td className="py-3 px-3 font-bold text-red-500">
                                {row.soldStick > 0 ? `−${row.soldStick}` : '0'}
                              </td>

                              {/* Special Order */}
                              <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                                {row.specialOrderStick > 0 ? `−${row.specialOrderStick}` : '—'}
                              </td>

                              {/* Total Deducted */}
                              <td className="py-3 px-3 font-black text-red-600 dark:text-red-400">
                                {row.totalStickDeducted > 0 ? `−${row.totalStickDeducted}` : '0'}
                              </td>

                              {/* Cart Balance Returned */}
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                                {row.cartBalanceStick > 0 ? row.cartBalanceStick : '0'}
                              </td>

                              {/* 11:59 PM End-of-Day Available Stock */}
                              <td className="py-3 px-3.5 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-sm">
                                {row.closingStick} <span className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 font-bold">sticks</span>
                                <span className="block text-[9px] text-slate-500 font-medium">{row.closingPot} pots{settings?.enablePlate ? `, ${row.closingPlate} plates` : ''}</span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-3 text-center">
                                {row.closingStick > 150 ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                    Healthy
                                  </span>
                                ) : row.closingStick > 0 ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                    Low
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                                    Empty
                                  </span>
                                )}
                              </td>

                              {/* Action Button */}
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInventoryDate(row.date);
                                    setStockSubView('inspector');
                                  }}
                                  className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-pink-500 hover:text-white transition-all cursor-pointer"
                                >
                                  Inspect Day
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. VIEW: SINGLE DAY INSPECTOR */}
          {/* ========================================================================= */}
          {stockSubView === 'inspector' && (
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
                            {currentDayRow.fullDisplayDate}
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
                          {currentDayRow.hasEntry ? 'Job recorded on this date' : 'No job sales recorded on this date'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {settings.enableStick !== false && (
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
                        {isSelectedDateToday ? 'Current Stock' : 'End of Day Stock (11:59 PM)'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                          {isSelectedDateToday ? 'Available in Warehouse' : `Closing Stock at 11:59 PM (${currentDayRow.displayDate})`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Morning Open (00:00 AM): {currentDayRow.openingStick}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{currentDayRow.closingStick}</p>
                    </div>

                    {/* Step by step day movement */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Open</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.openingStick}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">2. Loaded</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.loadedStick}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">3. Sold</span>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                          {currentDayRow.totalStickDeducted > 0 ? `−${currentDayRow.totalStickDeducted}` : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">4. Close 11:59PM</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{currentDayRow.closingStick}</span>
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
                          <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-0.5">Warehouse Balance</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentWarehouseStickBalance}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
                {settings.enablePot !== false && (
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
                        {isSelectedDateToday ? 'Current Stock' : 'End of Day Stock (11:59 PM)'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                          {isSelectedDateToday ? 'Available in Warehouse' : `Closing Stock at 11:59 PM (${currentDayRow.displayDate})`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Morning Open (00:00 AM): {currentDayRow.openingPot}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{currentDayRow.closingPot}</p>
                    </div>

                    {/* Step by step day movement */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Open</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.openingPot}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider block">2. Loaded</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.loadedPot}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">3. Sold</span>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                          {currentDayRow.totalPotDeducted > 0 ? `−${currentDayRow.totalPotDeducted}` : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">4. Close 11:59PM</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{currentDayRow.closingPot}</span>
                      </div>
                    </div>

                    {/* Active job state if today */}
                    {isSelectedDateToday && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-pink-800 dark:text-pink-400 uppercase tracking-widest block mb-0.5">In Job (Cart)</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentInJobPot}</span>
                        </div>
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-0.5">Warehouse Balance</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentWarehousePotBalance}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
                {settings.enablePlate && (
                <Card className="border border-amber-200 dark:border-amber-900/50 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[10px] text-slate-700 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none">Product</h4>
                          <p className="text-sm font-black text-slate-950 dark:text-white mt-1 uppercase">Plate Kulfi</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {isSelectedDateToday ? 'Current Stock' : 'End of Day Stock (11:59 PM)'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                          {isSelectedDateToday ? 'Available in Warehouse' : `Closing Stock at 11:59 PM (${currentDayRow.displayDate})`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Morning Open (00:00 AM): {currentDayRow.openingPlate}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{currentDayRow.closingPlate}</p>
                    </div>

                    {/* Step by step day movement */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">1. Open</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.openingPlate}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">2. Loaded</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{currentDayRow.loadedPlate}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">3. Sold</span>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                          {currentDayRow.totalPlateDeducted > 0 ? `−${currentDayRow.totalPlateDeducted}` : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">4. Close 11:59PM</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{currentDayRow.closingPlate}</span>
                      </div>
                    </div>

                    {/* Active job state if today */}
                    {isSelectedDateToday && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest block mb-0.5">In Job (Cart)</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentInJobPlate}</span>
                        </div>
                        <div className="bg-slate-100/85 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850/80">
                          <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-0.5">Warehouse Balance</span>
                          <span className="text-base font-black text-slate-950 dark:text-white">{currentWarehousePlateBalance}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          )}

          {/* Delivery Addition Modal */}
          {showDeliveryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-500" /> Log Stock Delivery
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Top-Up
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Add incoming stock received at the warehouse today. This will be added directly to your current available stock.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Add Sticks (pcs)</Label>
                    <Input
                      type="text" inputMode="numeric"
                      value={deliveryAddQuantity.stick}
                      onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, stick: e.target.value })}
                      placeholder="e.g. 500"
                      className="h-10 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Add Pots (pcs)</Label>
                    <Input
                      type="text" inputMode="numeric"
                      value={deliveryAddQuantity.pot}
                      onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, pot: e.target.value })}
                      placeholder="e.g. 50"
                      className="h-10 text-xs font-bold"
                    />
                  </div>
                  {settings.enablePlate && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Plates (pcs)</Label>
                      <Input
                        type="text" inputMode="numeric"
                        value={deliveryAddQuantity.plate}
                        onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, plate: e.target.value })}
                        placeholder="e.g. 20"
                        className="h-10 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Resulting Stock Today:</div>
                  <div className="font-black text-slate-900 dark:text-white">
                    Sticks: {availableStick} + {Number(deliveryAddQuantity.stick) || 0} = <span className="text-emerald-500">{availableStick + (Number(deliveryAddQuantity.stick) || 0)}</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white">
                    Pots: {availablePot} + {Number(deliveryAddQuantity.pot) || 0} = <span className="text-emerald-500">{availablePot + (Number(deliveryAddQuantity.pot) || 0)}</span>
                  </div>
                  {settings.enablePlate && (
                    <div className="font-black text-slate-900 dark:text-white">
                      Plates: {availablePlate} + {Number(deliveryAddQuantity.plate) || 0} = <span className="text-emerald-500">{availablePlate + (Number(deliveryAddQuantity.plate) || 0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDeliveryModal(false)}>
                    CANCEL
                  </Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleAddStockDelivery}>
                    CONFIRM TOP-UP
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FRANCHISE TAB */}
      {activeTab === 'franchise' && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-xl py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-800 dark:text-slate-200">
                Team Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Franchise Location</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{franchise?.name || 'Loading...'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Your Role</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{profile?.role || 'Unknown'}</p>
                </div>
                
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Franchise ID (For DB Sync)</label>
                  <code className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-sm font-mono text-slate-900 dark:text-slate-300 select-all">{franchise?.id || "Loading..."}</code>
                </div>
                <form onSubmit={handleUpdateProfile} className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800 rounded-xl mt-4">
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">My Profile</label>
                    {profileSaved && <span className="text-emerald-500 text-[10px] font-bold">SAVED!</span>}
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Name</Label>
                    <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="E.g. John Doe" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Phone</Label>
                    <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="E.g. 9876543210" className="mt-1" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto h-9 text-xs">
                      {savingProfile ? 'SAVING...' : 'UPDATE PROFILE'}
                    </Button>
                  </div>
                </form>
                {(profile?.role === 'owner' || profile?.role === 'manager') && (
                  <div className="col-span-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                    <label className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest block mb-2">Invite Code (Share with Staff)</label>
                    <div className="flex items-center gap-3">
                      <code className="px-4 py-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 rounded-lg text-xl font-mono tracking-widest font-black text-slate-900 dark:text-white">
                        {franchise?.inviteCode || '...'}
                      </code>
                      <Button variant="outline" size="icon" onClick={handleCopyInvite} className="h-10 w-10 shrink-0 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                        {inviteCopied ? <Check className="w-5 h-5 text-green-600 dark:text-green-500" /> : <Copy className="w-5 h-5" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShareInvite} className="h-10 w-10 shrink-0 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          {(profile?.role === 'owner' || profile?.role === 'manager') && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 text-indigo-500" /> Staff & Team Details
                </CardTitle>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {staffUsers.length} {staffUsers.length === 1 ? 'Member' : 'Members'}
                </span>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {loadingStaff ? (
                  <div className="py-8 text-center text-sm font-bold text-slate-500 animate-pulse flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Loading staff members...</span>
                  </div>
                ) : staffUsers.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No staff members joined yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Share your franchise invite code <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{franchise?.inviteCode || '...'}</code> with your team to display them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffUsers.map(staff => {
                      const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
                      const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : (staff.phone || '');
                      const initials = (staff.name || staff.email || 'S').slice(0, 2).toUpperCase();

                      return (
                        <div 
                          key={staff.uid} 
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                        >
                          {/* Staff Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white capitalize">
                                  {staff.name || 'Staff Member'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                                    {staff.role || 'Staff'}
                                  </span>
                                  {staff.isOnline && (
                                    <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                            {/* Email */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">
                                  {staff.email || 'No email registered'}
                                </span>
                              </div>
                              {staff.email && (
                                <a 
                                  href={`mailto:${staff.email}`}
                                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                                >
                                  Email
                                </a>
                              )}
                            </div>

                            {/* Phone */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">
                                  {formattedPhone || <span className="text-slate-400 italic text-[10px]">No phone number added</span>}
                                </span>
                              </div>
                              {cleanPhone && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a 
                                    href={`tel:${cleanPhone}`}
                                    className="p-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800"
                                    title="Call Staff"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                  </a>
                                  <a 
                                    href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800"
                                    title="WhatsApp Staff"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* GENERAL SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && role === 'owner' && (
        <div className="space-y-6">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-4 text-cyan-600 dark:text-cyan-400 flex justify-between items-center">
                  Business Targets & Goals
                  {successMsg && <span className="text-emerald-500 dark:text-emerald-400 text-[10px]">SAVED!</span>}
                </h3>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Monthly Sales Goal (₹)</Label>
                  <Input name="monthlyGoal" type="text" inputMode="numeric" value={settingsData.monthlyGoal} onChange={handleSettingsChange} required className="border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500 h-11" />
                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-4 text-pink-600 dark:text-pink-400 mt-6 mb-4">
                  Franchise Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Stick Kulfi</Label>
                      <input type="checkbox" name="enableStick" checked={settingsData.enableStick} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enableStick && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stick Price (₹)</Label>
                        <Input name="stickPrice" type="text" inputMode="numeric" value={settingsData.stickPrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Pot Kulfi</Label>
                      <input type="checkbox" name="enablePot" checked={settingsData.enablePot} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePot && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pot Price (₹)</Label>
                        <Input name="potPrice" type="text" inputMode="numeric" value={settingsData.potPrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Plate Kulfi</Label>
                      <input type="checkbox" name="enablePlate" checked={settingsData.enablePlate} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePlate && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plate Price (₹)</Label>
                        <Input name="platePrice" type="text" inputMode="numeric" value={settingsData.platePrice} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enable Platform Fee</Label>
                      <input type="checkbox" name="enablePlatformFee" checked={settingsData.enablePlatformFee} onChange={handleSettingsChange} className="w-4 h-4 rounded border-slate-300" />
                    </div>
                    {settingsData.enablePlatformFee && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fee Amount (₹/day)</Label>
                        <Input name="platformFee" type="text" inputMode="numeric" value={settingsData.platformFee} onChange={handleSettingsChange} className="h-11" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expense "Paid By" Names (Comma separated)</Label>
                  <Input name="expensePaidByNames" type="text" value={settingsData.expensePaidByNames} onChange={handleSettingsChange} required className="border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500 h-11" placeholder="Owner, Manager, Staff" />
                </div>
                <div className="space-y-2 mt-4">
                  <Label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expense Categories (Comma separated)</Label>
                  <Input name="expenseCategories" type="text" value={settingsData.expenseCategories} onChange={handleSettingsChange} required className="border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500 h-11" placeholder="Petrol, Food, Rent..." />
                </div>


              </CardContent>
            </Card>
            <Button type="submit" className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md" disabled={savingSettings}>
              {savingSettings ? 'SAVING...' : 'SAVE SETTINGS'}
            </Button>
          </form>

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
        </div>
      )}

      {/* PLANNER TAB */}
      {activeTab === 'planner' && (
        <Planner />
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <>
          <ExportData />
          <MigrateLocalData />
        </>
      )}

      

      {/* HELP TAB */}
      {activeTab === 'help' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Help & Support</CardTitle>
                  <CardDescription className="font-semibold mt-1">Get in touch for queries and app support</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Support</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">+91 96868 31400</p>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = "tel:9686831400"} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest shadow-md">
                    CALL NOW
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Support</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white break-all">nammaoorukulfisathy@gmail.com</p>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = "mailto:nammaoorukulfisathy@gmail.com"} variant="outline" className="w-full sm:w-auto font-black tracking-widest">
                    SEND EMAIL
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DATABASE TAB */}
      {activeTab === 'database' && isAdminUser && (
        <SupabaseManager />
      )}

      {/* RESET INVENTORY CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Are you sure?</h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              This will wipe all current baseline stock and start fresh from today. All quantities will be set to 0.
            </p>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowResetModal(false)}>CANCEL</Button>
              <Button type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleResetInventory}>CONFIRM RESET</Button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE CONFIRMATION MODAL */}
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
