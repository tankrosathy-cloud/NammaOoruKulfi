import React, { useState, useEffect } from 'react';
import { useSettings, saveSettings } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { importJulyData } from '../lib/importJulyData';

export default function SettingsPage() {
  const { settings, loading, reload } = useSettings();
  const [formData, setFormData] = useState({
    stickPrice: '',
    platePrice: '',
    potPrice: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFormData({
        stickPrice: settings.stickPrice.toString(),
        platePrice: settings.platePrice.toString(),
        potPrice: settings.potPrice.toString(),
      });
    }
  }, [settings, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSettings({
      stickPrice: parseFloat(formData.stickPrice) || 0,
      platePrice: parseFloat(formData.platePrice) || 0,
      potPrice: parseFloat(formData.potPrice) || 0,
    });
    setSaving(false);
    reload();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleImport = async () => {
    if (!confirmImport) {
      setConfirmImport(true);
      setTimeout(() => setConfirmImport(false), 3000); // Reset after 3 seconds
      return;
    }

    setImporting(true);
    try {
      await importJulyData();
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setImporting(false);
      setConfirmImport(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading settings...</div>;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">Settings</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Configure app preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-800 bg-slate-900/80">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-800/60 pb-4 text-cyan-400 flex justify-between items-center">
              Kulfi Prices
              {successMsg && <span className="text-emerald-400 text-[10px]">SAVED!</span>}
            </h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stick Kulfi Price (₹)</Label>
              <Input name="stickPrice" type="number" value={formData.stickPrice} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plate Kulfi Price (₹)</Label>
              <Input name="platePrice" type="number" value={formData.platePrice} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pot Kulfi Price (₹)</Label>
              <Input name="potPrice" type="number" value={formData.potPrice} onChange={handleChange} required />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14" disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </Button>
      </form>
      
      <div className="pt-8">
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-800/60 pb-4 text-pink-500">Data Management</h3>
            <p className="text-xs text-slate-400 font-medium">Load the historical July 2026 data from the image reference. This will add 30 entries.</p>
            <Button 
              type="button" 
              variant={confirmImport ? "destructive" : "outline"} 
              className="w-full h-12 transition-all duration-300" 
              onClick={handleImport} 
              disabled={importing || importSuccess}
            >
              {importing ? 'LOADING DATA...' : 
               importSuccess ? 'DATA LOADED!' : 
               confirmImport ? 'CLICK AGAIN TO CONFIRM' : 
               'LOAD JULY DATA'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
