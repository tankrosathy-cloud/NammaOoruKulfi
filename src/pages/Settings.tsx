import React, { useState, useEffect, useRef } from 'react';
import { useSettings, saveSettings, useInventory, saveInventoryStock, useEntries } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Package, Edit2, KeyRound, LogOut, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  const [inventoryData, setInventoryData] = useState<{
    stickQuantity: number | '';
    potQuantity: number | '';
    lastUpdatedDate: string;
    stickFlavours: { name: string; quantity: number }[];
    potFlavours: { name: string; quantity: number }[];
  }>({
    stickQuantity: '',
    potQuantity: '',
    lastUpdatedDate: new Date().toISOString().split('T')[0],
    stickFlavours: [],
    potFlavours: []
  });

  const relevantEntries = inventory.lastUpdatedDate
    ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
    : entries;
  const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const availableStick = Math.max(0, (inventory.stickQuantity || 0) - totalStickSold);
  const availablePot = Math.max(0, (inventory.potQuantity || 0) - totalPotSold);

  const latestEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const isStickJobOpen = latestEntry && latestEntry.stickBalance === undefined;
  const isPotJobOpen = latestEntry && latestEntry.potBalance === undefined;

  const currentInJobStick = isStickJobOpen ? (latestEntry.stickLoaded || 0) : 0;
  const currentInJobPot = isPotJobOpen ? (latestEntry.potLoaded || 0) : 0;

  const currentWarehouseStickBalance = availableStick - currentInJobStick;
  const currentWarehousePotBalance = availablePot - currentInJobPot;

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
      lastUpdatedDate: new Date().toISOString().split('T')[0], // Always default to today when editing
      stickFlavours: inventory.stickFlavours || [],
      potFlavours: inventory.potFlavours || []
    });
    setIsEditingInventory(true);
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
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">Current Stock</h3>
              {!isEditingInventory && inventory.lastUpdatedDate && (
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Stock Date: {inventory.lastUpdatedDate}</p>
              )}
            </div>
            {!isEditingInventory && (
              <Button onClick={startInventoryEdit} className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl h-8 px-3 text-xs">
                <Edit2 className="w-3 h-3 mr-2" /> EDIT
              </Button>
            )}
          </div>
          {isEditingInventory ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock Date</Label>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] text-cyan-600 border-cyan-200 bg-cyan-50" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                        {isUploading ? 'UPLOADING...' : 'UPLOAD INVOICE'}
                      </Button>
                    </div>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stick Quantity</Label>
                    <Input 
                      type="text" inputMode="numeric"
                      value={inventoryData.stickQuantity}
                      onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pot Quantity</Label>
                    <Input 
                      type="text" inputMode="numeric"
                      value={inventoryData.potQuantity}
                      onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === '' ? '' : Number(e.target.value)})}
                    />
                  </div>
                  
                  </div>
                  
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleInventorySave} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold h-12">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stick Kulfi Card */}
              <Card className="border border-cyan-200 dark:border-cyan-900/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-700 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none">Product</h4>
                      <p className="text-sm font-black text-slate-950 dark:text-white mt-1 uppercase">Stick Kulfi</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">Available Count (Warehouse)</span>
                    <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{availableStick}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-widest block mb-1">In Job (Loaded)</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentInJobStick}</span>
                    </div>
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-1">Inv Balance</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentWarehouseStickBalance}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pot Kulfi Card */}
              <Card className="border border-pink-200 dark:border-pink-900/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-700 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none">Product</h4>
                      <p className="text-sm font-black text-slate-950 dark:text-white mt-1 uppercase">Pot Kulfi</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-extrabold text-slate-650 dark:text-slate-400 uppercase tracking-widest">Available Count (Warehouse)</span>
                    <p className="text-4xl font-black text-slate-950 dark:text-white mt-1">{availablePot}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-pink-855 dark:text-pink-400 uppercase tracking-widest block mb-1">In Job (Loaded)</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentInJobPot}</span>
                    </div>
                    <div className="bg-slate-100/85 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850/80">
                      <span className="text-[9px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest block mb-1">Inv Balance</span>
                      <span className="text-lg font-black text-slate-950 dark:text-white">{currentWarehousePotBalance}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
