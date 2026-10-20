import React, { useState, useEffect, useMemo } from 'react';
import { InventoryStock, Settings } from '../types';
import { MASTER_STICK_FLAVOURS, MASTER_POT_FLAVOURS, arrangeFlavoursInSequence, saveInventoryStock } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Check, Copy, Share2, Save, Plus, Minus, RotateCcw, Sparkles, Package } from 'lucide-react';

interface FlavourStockSheetProps {
  inventory: InventoryStock | null | undefined;
  settings: Settings;
  onSaved?: () => void;
  className?: string;
}

export function generateFlavourStockText(
  stickFlavours: { name: string; quantity: number }[],
  potFlavours: { name: string; quantity: number }[],
  stickPrice: number = 40,
  potPrice: number = 50
): string {
  const orderedSticks = arrangeFlavoursInSequence(stickFlavours, MASTER_STICK_FLAVOURS);
  const orderedPots = arrangeFlavoursInSequence(potFlavours, MASTER_POT_FLAVOURS);

  const stickLines = orderedSticks.map(f => `${f.name} - ${f.quantity > 0 ? f.quantity : ''}`);
  const totalSticks = orderedSticks.reduce((acc, f) => acc + (f.quantity || 0), 0);

  const potLines = orderedPots.map(f => `${f.name} - ${f.quantity > 0 ? f.quantity : ''}`);
  const totalPots = orderedPots.reduce((acc, f) => acc + (f.quantity || 0), 0);

  const text = [
    `Stick kulfi* 🍦 (₹${stickPrice})`,
    ``,
    ...stickLines,
    ``,
    `  Total= ${totalSticks} (₹${(totalSticks * stickPrice).toLocaleString('en-IN')})`,
    ``,
    `Pot kulfi 🍯 (₹${potPrice})`,
    ...potLines,
    ``,
    `  Total= ${totalPots} (₹${(totalPots * potPrice).toLocaleString('en-IN')})`,
    ``,
    `✨ Grand Total: ${totalSticks + totalPots} pcs | ₹${((totalSticks * stickPrice) + (totalPots * potPrice)).toLocaleString('en-IN')}`
  ].join('\n');

  return text;
}

export default function FlavourStockSheet({ inventory, settings, onSaved, className = '' }: FlavourStockSheetProps) {
  const stickPrice = settings.stickPrice || 40;
  const potPrice = settings.potPrice || 50;

  // Local state for interactive editing of flavours
  const [stickFlavours, setStickFlavours] = useState<{ name: string; quantity: number }[]>(() => {
    return arrangeFlavoursInSequence(inventory?.stickFlavours, MASTER_STICK_FLAVOURS);
  });

  const [potFlavours, setPotFlavours] = useState<{ name: string; quantity: number }[]>(() => {
    return arrangeFlavoursInSequence(inventory?.potFlavours, MASTER_POT_FLAVOURS);
  });

  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when inventory prop updates from cloud
  useEffect(() => {
    setStickFlavours(arrangeFlavoursInSequence(inventory?.stickFlavours, MASTER_STICK_FLAVOURS));
    setPotFlavours(arrangeFlavoursInSequence(inventory?.potFlavours, MASTER_POT_FLAVOURS));
  }, [inventory?.stickFlavours, inventory?.potFlavours]);

  // Totals calculation
  const totalSticks = useMemo(() => {
    return stickFlavours.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);
  }, [stickFlavours]);

  const totalPots = useMemo(() => {
    return potFlavours.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);
  }, [potFlavours]);

  const totalStickValue = totalSticks * stickPrice;
  const totalPotValue = totalPots * potPrice;
  const grandTotalPieces = totalSticks + totalPots;
  const grandTotalValue = totalStickValue + totalPotValue;

  const handleStickQtyChange = (index: number, val: string | number) => {
    const num = Math.max(0, parseInt(val.toString(), 10) || 0);
    setStickFlavours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: num };
      return next;
    });
  };

  const handleStickStep = (index: number, delta: number) => {
    setStickFlavours(prev => {
      const next = [...prev];
      const cur = next[index]?.quantity || 0;
      next[index] = { ...next[index], quantity: Math.max(0, cur + delta) };
      return next;
    });
  };

  const handlePotQtyChange = (index: number, val: string | number) => {
    const num = Math.max(0, parseInt(val.toString(), 10) || 0);
    setPotFlavours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: num };
      return next;
    });
  };

  const handlePotStep = (index: number, delta: number) => {
    setPotFlavours(prev => {
      const next = [...prev];
      const cur = next[index]?.quantity || 0;
      next[index] = { ...next[index], quantity: Math.max(0, cur + delta) };
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedItem: InventoryStock = {
        ...(inventory || {}),
        id: inventory?.id || 'global',
        stickQuantity: totalSticks,
        potQuantity: totalPots,
        lastUpdatedDate: inventory?.lastUpdatedDate || today,
        stickFlavours,
        potFlavours,
      };

      await saveInventoryStock(updatedItem);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSaved?.();
    } catch (err) {
      console.error('Failed to save flavour stock:', err);
      alert('Failed to save stock. Please check network connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      const text = generateFlavourStockText(stickFlavours, potFlavours, stickPrice, potPrice);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleWhatsApp = () => {
    const text = generateFlavourStockText(stickFlavours, potFlavours, stickPrice, potPrice);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetAll = () => {
    if (confirm('Reset all flavour counts to 0?')) {
      setStickFlavours(MASTER_STICK_FLAVOURS.map(name => ({ name, quantity: 0 })));
      setPotFlavours(MASTER_POT_FLAVOURS.map(name => ({ name, quantity: 0 })));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner / Controls */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-amber-500/10 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍦</span>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Flavour Stock Sheet & Sequence
            </h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
              Official Menu Sequence
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Stick Price: <span className="font-bold text-cyan-600 dark:text-cyan-400">₹{stickPrice}</span> • Pot Price: <span className="font-bold text-pink-600 dark:text-pink-400">₹{potPrice}</span> (synced from Settings page)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? 'Copied Text!' : 'Copy Stock List'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="h-9 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-md transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" /> {isSaving ? 'Saving...' : 'Save Stock'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Two Column Grid: Stick Kulfi (15 items) & Pot Kulfi (4 items) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* STICK KULFI SECTION (15 Items) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-cyan-200 dark:border-cyan-900/60 shadow-md overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-cyan-500/10 dark:bg-cyan-950/30 border-b border-cyan-100 dark:border-cyan-900/50 py-3.5 px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍦</span>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-black text-cyan-950 dark:text-cyan-200 uppercase tracking-wide">
                      Stick kulfi* 🍦
                    </CardTitle>
                    <CardDescription className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">
                      ₹{stickPrice} each • 15 Flavours in exact sequence
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Stick Total</span>
                  <span className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {totalSticks} pcs
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-5 space-y-2">
              <div className="space-y-1.5">
                {stickFlavours.map((item, idx) => {
                  const qty = item.quantity || 0;
                  const itemTotalVal = qty * stickPrice;
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                        qty > 0
                          ? 'bg-cyan-500/5 border-cyan-400/50 dark:bg-cyan-950/20 dark:border-cyan-800'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{stickPrice} {qty > 0 ? `• ₹${itemTotalVal}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Stepper + Input */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStickStep(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-transform cursor-pointer"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <Input
                          type="text"
                          inputMode="numeric"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={e => handleStickQtyChange(idx, e.target.value)}
                          className="w-14 h-7 text-center font-mono font-black text-xs sm:text-sm px-1 py-0 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-cyan-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleStickStep(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-sm"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Sticks Footer */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-cyan-200 dark:border-cyan-800/60 flex items-center justify-between px-2">
                <span className="text-sm font-black text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
                  Total =
                </span>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
                    {totalSticks} pcs
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono ml-2">
                    (₹{totalStickValue.toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* POT KULFI SECTION (4 Items) + SUMMARY */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-pink-200 dark:border-pink-900/60 shadow-md overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-pink-500/10 dark:bg-pink-950/30 border-b border-pink-100 dark:border-pink-900/50 py-3.5 px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍯</span>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-black text-pink-950 dark:text-pink-200 uppercase tracking-wide">
                      Pot kulfi 🍯
                    </CardTitle>
                    <CardDescription className="text-[11px] font-semibold text-pink-700 dark:text-pink-400">
                      ₹{potPrice} each • 4 Flavours in exact sequence
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pot Total</span>
                  <span className="text-base font-black text-pink-600 dark:text-pink-400 font-mono">
                    {totalPots} pcs
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-5 space-y-2">
              <div className="space-y-1.5">
                {potFlavours.map((item, idx) => {
                  const qty = item.quantity || 0;
                  const itemTotalVal = qty * potPrice;
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        qty > 0
                          ? 'bg-pink-500/5 border-pink-400/50 dark:bg-pink-950/20 dark:border-pink-800'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{potPrice} {qty > 0 ? `• ₹${itemTotalVal}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Stepper + Input */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePotStep(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-transform cursor-pointer"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <Input
                          type="text"
                          inputMode="numeric"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={e => handlePotQtyChange(idx, e.target.value)}
                          className="w-14 h-7 text-center font-mono font-black text-xs sm:text-sm px-1 py-0 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-pink-500"
                        />

                        <button
                          type="button"
                          onClick={() => handlePotStep(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-sm"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Pots Footer */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-pink-200 dark:border-pink-800/60 flex items-center justify-between px-2">
                <span className="text-sm font-black text-pink-900 dark:text-pink-200 uppercase tracking-wider">
                  Total =
                </span>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-mono text-pink-600 dark:text-pink-400">
                    {totalPots} pcs
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono ml-2">
                    (₹{totalPotValue.toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COMBINED AUDIT SUMMARY CARD */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-gradient-to-br from-slate-900 to-slate-950 text-white">
            <CardHeader className="py-4 px-5 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Inventory Value Summary
                  </CardTitle>
                </div>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block mb-1">
                    Sticks Total
                  </span>
                  <p className="text-2xl font-black font-mono text-white">{totalSticks}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">₹{totalStickValue.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 block mb-1">
                    Pots Total
                  </span>
                  <p className="text-2xl font-black font-mono text-white">{totalPots}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">₹{totalPotValue.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                    Combined Inventory Total
                  </span>
                  <p className="text-xl font-black font-mono text-white">{grandTotalPieces} pieces</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                    Total Value
                  </span>
                  <p className="text-xl font-black font-mono text-emerald-400">₹{grandTotalValue.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-11 bg-gradient-to-r from-cyan-600 via-pink-600 to-emerald-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  {isSaving ? 'Saving Changes...' : saveSuccess ? '✓ Successfully Saved to Cloud' : 'Save Flavour Stock to Inventory'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="h-9 text-xs font-bold text-slate-200 border-slate-700 hover:bg-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Checklist
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsApp}
                    className="h-9 text-xs font-bold text-emerald-400 border-emerald-800 hover:bg-emerald-950/40"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" /> WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
