import React, { useState } from 'react';
import { DailyEntry, InventoryStock, Settings, ExpenseEntry } from '../types';
import { format, parseISO } from 'date-fns';
import { useFranchise } from '../context/FranchiseContext';
import { Button } from './ui/button';
import { Copy, Check, Share2, MessageCircle, X, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function generateWhatsAppClosingText(
  entry: DailyEntry,
  inventory?: InventoryStock | null,
  settings?: Settings | null,
  franchiseName?: string
): string {
  const stickPrice = settings?.stickPrice || 40;
  const potPrice = settings?.potPrice || 50;
  const platePrice = settings?.platePrice || 75;
  const enablePlate = settings?.enablePlate !== false || (entry.plateLoaded || 0) > 0 || (entry.plateSold || 0) > 0;

  let formattedDate = entry.date;
  let dayOfWeek = '';
  try {
    const parsed = parseISO(entry.date);
    formattedDate = format(parsed, 'd MMMM yyyy');
    dayOfWeek = format(parsed, 'EEEE');
  } catch {
    // keep default
  }

  const grossSales = (entry.stickSold * stickPrice) + (entry.potSold * potPrice) + ((entry.plateSold || 0) * platePrice);
  const totalKulfis = (entry.stickSold || 0) + (entry.potSold || 0) + (entry.plateSold || 0);
  const discount = entry.discount || 0;
  const cartExpenses = (entry.expenses || 0) + (entry.additionalExpenses || 0);
  const netSales = Math.max(0, (entry.actualAmount || 0) - (entry.cashBagLoaded || 0) + cartExpenses + (entry.bonus || 0));

  // Available stock calculation
  const stickStockRemaining = inventory?.stickQuantity !== undefined ? inventory.stickQuantity : null;
  const potStockRemaining = inventory?.potQuantity !== undefined ? inventory.potQuantity : null;
  const plateStockRemaining = inventory?.plateQuantity !== undefined ? inventory.plateQuantity : null;

  const lines: string[] = [
    `🍦 *NAMMA OORU KULFI — DAILY CLOSING* 🍦`,
    `📍 *${franchiseName || 'Franchise'} Cart Operations*`,
    `📅 *Date:* ${formattedDate} (${dayOfWeek})`,
    ``,
    `📊 *SALES & PRODUCTION:*`,
    `• Stick Kulfi (₹${stickPrice}): ${entry.stickLoaded || 0} loaded → ${entry.stickBalance ?? (entry.stickLoaded !== undefined ? Math.max(0, (entry.stickLoaded || 0) - (entry.stickSold || 0)) : 0)} bal = *${entry.stickSold || 0} sold* (₹${(entry.stickSold * stickPrice).toLocaleString('en-IN')})`,
    `• Pot Kulfi (₹${potPrice}): ${entry.potLoaded || 0} loaded → ${entry.potBalance ?? (entry.potLoaded !== undefined ? Math.max(0, (entry.potLoaded || 0) - (entry.potSold || 0)) : 0)} bal = *${entry.potSold || 0} sold* (₹${(entry.potSold * potPrice).toLocaleString('en-IN')})`,
    ...(enablePlate ? [
      `• Plate Kulfi (₹${platePrice}): ${entry.plateLoaded || 0} loaded → ${entry.plateBalance ?? (entry.plateLoaded !== undefined ? Math.max(0, (entry.plateLoaded || 0) - (entry.plateSold || 0)) : 0)} bal = *${entry.plateSold || 0} sold* (₹${((entry.plateSold || 0) * platePrice).toLocaleString('en-IN')})`
    ] : []),
    `• *Total Kulfis Sold:* *${totalKulfis} pcs*`,
    `• *Gross Sales:* *₹${grossSales.toLocaleString('en-IN')}*`,
    discount > 0 ? `• *Discount/Offer:* -₹${discount.toLocaleString('en-IN')}` : '',
    ``,
    `💰 *COLLECTIONS & CASH IN HAND:*`,
    `• 📱 PhonePe / UPI: *₹${(entry.phonePe || 0).toLocaleString('en-IN')}*`,
    `• 💵 Cash Bag Total (End): *₹${(entry.cashBagTotal || 0).toLocaleString('en-IN')}*`,
    ...(entry.denominations && ((entry.denominations.n500 || 0) + (entry.denominations.n200 || 0) + (entry.denominations.n100 || 0) + (entry.denominations.n50 || 0) + (entry.denominations.n20 || 0) + (entry.denominations.n10 || 0) + (entry.denominations.coins || 0) > 0) ? [
      `  ↳ Denoms: ${[
        entry.denominations.n500 ? `500×${entry.denominations.n500}` : '',
        entry.denominations.n200 ? `200×${entry.denominations.n200}` : '',
        entry.denominations.n100 ? `100×${entry.denominations.n100}` : '',
        entry.denominations.n50 ? `50×${entry.denominations.n50}` : '',
        entry.denominations.n20 ? `20×${entry.denominations.n20}` : '',
        entry.denominations.n10 ? `10×${entry.denominations.n10}` : '',
        entry.denominations.coins ? `Coins ₹${entry.denominations.coins}` : '',
      ].filter(Boolean).join(' | ')}`
    ] : []),
    `• 💼 Cash Bag Loaded (Start): ₹${(entry.cashBagLoaded || 0).toLocaleString('en-IN')}`,
    cartExpenses > 0 ? `• 🏷️ Cart Expenses: -₹${cartExpenses.toLocaleString('en-IN')}${entry.expenseDetails ? ` (${entry.expenseDetails})` : ''}` : '',
    (entry.bonus || 0) > 0 ? `• 🎁 Bonus Deducted: -₹${(entry.bonus || 0).toLocaleString('en-IN')}` : '',
    `• 🏁 *Net Sales Collected:* *₹${netSales.toLocaleString('en-IN')}*`,
    entry.shortage !== 0 ? `• ⚠️ *Shortage / Discrepancy:* ${entry.shortage > 0 ? `Short ₹${entry.shortage}` : `Excess +₹${Math.abs(entry.shortage)}`}` : `• ✅ *Cash Tally Status:* Exact Match (Balanced)`,
  ];

  if (stickStockRemaining !== null && potStockRemaining !== null) {
    lines.push(
      ``,
      `📦 *WAREHOUSE STOCK BALANCE:*`,
      `• Stick Kulfi: *${stickStockRemaining} pcs*`,
      `• Pot Kulfi: *${potStockRemaining} pcs*`,
      ...(enablePlate && plateStockRemaining !== null ? [`• Plate Kulfi: *${plateStockRemaining} pcs*`] : [])
    );
  }

  if (entry.notes) {
    lines.push(
      ``,
      `📝 *Notes:* ${entry.notes}`
    );
  }

  lines.push(
    ``,
    `✨ _Generated via Namma Ooru Kulfi Management App_`
  );

  return lines.filter(line => line !== '').join('\n');
}

interface WhatsAppSummaryModalProps {
  expenses?: ExpenseEntry[];
  isOpen: boolean;
  onClose: () => void;
  entry: DailyEntry | null;
  inventory?: InventoryStock | null;
  settings?: Settings | null;
}

export function WhatsAppSummaryModal({ isOpen, onClose, entry, settings, inventory, expenses }: WhatsAppSummaryModalProps) {
  const { franchise } = useFranchise();
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');

  if (!isOpen || !entry) return null;

  const summaryText = generateWhatsAppClosingText(entry, inventory, settings, franchise?.name);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = customPhone.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const encoded = encodeURIComponent(summaryText);
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Namma Ooru Kulfi Closing - ${entry.date}`,
          text: summaryText,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    handleSendWhatsApp();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  WhatsApp Daily Closing
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  1-Click Share
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Formatted daily report for Yuvaraj, Sebastin & team
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatted Text Preview Box */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Message Preview
              </span>
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Ready to send
              </span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner max-h-72 overflow-y-auto select-all">
              {summaryText}
            </pre>
          </div>

          {/* Optional Direct Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Send to specific number (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="e.g. 9876543210 (leave blank to choose in WhatsApp)"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-1/2 h-11 rounded-xl text-xs font-black uppercase tracking-wider border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Summary Text</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleNativeShare}
            className="w-full sm:w-1/2 h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
