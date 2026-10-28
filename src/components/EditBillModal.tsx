import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Save, 
  ShoppingBag, 
  Smartphone, 
  Coins, 
  IceCream, 
  CheckCircle2 
} from 'lucide-react';
import { BillItem, QuickBill } from '../types';
import { MASTER_STICK_FLAVOURS, MASTER_POT_FLAVOURS } from '../store';
import { format } from 'date-fns';

interface EditBillModalProps {
  bill: QuickBill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (originalBill: QuickBill, updatedBill: QuickBill) => Promise<void>;
  stickPrice?: number;
  potPrice?: number;
  platePrice?: number;
  availableStickFlavours?: string[];
  availablePotFlavours?: string[];
}

export const EditBillModal: React.FC<EditBillModalProps> = ({
  bill,
  isOpen,
  onClose,
  onSave,
  stickPrice = 40,
  potPrice = 50,
  platePrice = 75,
  availableStickFlavours,
  availablePotFlavours
}) => {
  const [items, setItems] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'split' | 'complimentary'>('upi');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [selectedAddCategory, setSelectedAddCategory] = useState<'stick' | 'pot'>('stick');
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when bill changes
  useEffect(() => {
    if (bill && isOpen) {
      setItems(bill.items ? JSON.parse(JSON.stringify(bill.items)) : []);
      setPaymentMethod(bill.paymentMethod || 'upi');
      setSplitCashAmount(bill.cashAmount ? String(bill.cashAmount) : '');
      const digits = (bill.customerPhone || '').replace(/\D/g, '');
      setCustomerPhone(digits.length >= 10 ? digits.slice(-10) : digits);
      setCustomerName(bill.customerName || '');
      setDiscount(bill.discount || 0);
      setNotes(bill.notes || '');
      setPhoneError('');
      setShowAddMenu(false);
      setIsSaving(false);
    }
  }, [bill, isOpen]);

  const cleanCustomerPhone = useMemo(() => {
    const digits = customerPhone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }, [customerPhone]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0));
  }, [subtotal, discount]);

  // Points earned calculation (3 pts per stick / pot / plate kulfi)
  const pointsEarned = useMemo(() => {
    const totalKulfis = items
      .filter(i => i.category === 'stick' || i.category === 'pot' || i.category === 'plate')
      .reduce((s, i) => s + i.quantity, 0);
    const freeCount = bill?.pointsRedeemed ? Math.round(bill.pointsRedeemed / 40) : 0;
    const paidKulfis = Math.max(0, totalKulfis - freeCount);
    return paidKulfis * 3;
  }, [items, bill]);

  if (!isOpen || !bill) return null;

  // Stepper handlers
  const handleQuantityChange = (index: number, delta: number) => {
    setItems(prev => {
      const copy = [...prev];
      const target = copy[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, idx) => idx !== index);
      }
      copy[index] = {
        ...target,
        quantity: newQty,
        total: target.price * newQty
      };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddFlavourItem = (name: string, category: 'stick' | 'pot', price: number) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.name.toLowerCase() === name.toLowerCase() && i.category === category);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const target = copy[existingIdx];
        const newQty = target.quantity + 1;
        copy[existingIdx] = {
          ...target,
          quantity: newQty,
          total: target.price * newQty
        };
        return copy;
      }
      return [
        ...prev,
        {
          name,
          category,
          flavour: name,
          price,
          quantity: 1,
          total: price
        }
      ];
    });
    setShowAddMenu(false);
  };

  const stickFlavourList = availableStickFlavours && availableStickFlavours.length > 0
    ? availableStickFlavours
    : MASTER_STICK_FLAVOURS;

  const potFlavourList = availablePotFlavours && availablePotFlavours.length > 0
    ? availablePotFlavours
    : MASTER_POT_FLAVOURS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Bill must contain at least one item.");
      return;
    }

    // MANDATORY MOBILE VALIDATION
    if (!cleanCustomerPhone || cleanCustomerPhone.length !== 10) {
      setPhoneError("Customer mobile number is mandatory (10 digits required).");
      phoneInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      let cashAmt = 0;
      let upiAmt = 0;
      if (paymentMethod === 'cash') cashAmt = grandTotal;
      if (paymentMethod === 'upi') upiAmt = grandTotal;
      if (paymentMethod === 'split') {
        cashAmt = Math.min(grandTotal, Math.max(0, Number(splitCashAmount) || 0));
        upiAmt = Math.max(0, grandTotal - cashAmt);
      }

      // Calculate delta to properly update totalLoyaltyPoints on this bill
      const oldEarned = bill.pointsEarned ?? 0;
      const oldRedeemed = bill.pointsRedeemed ?? 0;
      const newRedeemed = bill.pointsRedeemed ?? 0;
      const delta = (pointsEarned - newRedeemed) - (oldEarned - oldRedeemed);
      const updatedTotalLoyaltyPoints = bill.totalLoyaltyPoints !== undefined
        ? Math.max(0, bill.totalLoyaltyPoints + delta)
        : pointsEarned;

      const updated: QuickBill = {
        ...bill,
        items,
        subtotal,
        discount: Number(discount) || 0,
        totalAmount: grandTotal,
        paymentMethod,
        cashAmount: cashAmt,
        upiAmount: upiAmt,
        customerPhone: cleanCustomerPhone,
        customerName: customerName.trim(),
        notes: notes.trim(),
        pointsEarned,
        totalLoyaltyPoints: updatedTotalLoyaltyPoints,
        updatedAt: new Date().toISOString()
      };

      await onSave(bill, updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update bill:", err);
      alert("Failed to save bill changes: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed top */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/95 shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Edit Bill #{bill.billNumber}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                {bill.date}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Created {format(new Date(bill.createdAt), 'hh:mm a')} • Update items, payment or customer info
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form wrapping scrollable content and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div 
            style={{ WebkitOverflowScrolling: 'touch' }} 
            className="p-3.5 sm:p-5 overflow-y-auto overscroll-contain space-y-4 text-sm flex-1 min-h-0"
          >
          {/* Customer Mobile (Mandatory) & Name */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase">
              <span className="flex items-center gap-1.5">
                <span className={phoneError ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>
                  Customer Mobile Number
                </span>
                <span className="text-red-500 text-xs font-black">*</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  phoneError
                    ? 'bg-red-500 text-white animate-pulse'
                    : cleanCustomerPhone.length === 10
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}>
                  {cleanCustomerPhone.length === 10 ? '✓ Valid' : 'Mandatory'}
                </span>
              </span>
              <span className="text-[10px] text-amber-500 font-bold">3 pts / kulfi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (10 Digits)"
                    value={customerPhone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomerPhone(val);
                      if (val.length === 10) setPhoneError('');
                    }}
                    className={`w-full h-10 pl-11 pr-3 rounded-xl text-xs font-mono font-bold transition-all ${
                      phoneError
                        ? 'bg-red-500/10 border-2 border-red-500 text-red-900 dark:text-red-200 focus:outline-none ring-2 ring-red-500/30'
                        : cleanCustomerPhone.length === 10
                          ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 focus:outline-none ring-1 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 dark:text-white'
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Items in Bill */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />
                <span>Bill Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flavour</span>
              </button>
            </div>

            {/* Quick Add Flavour Drawer/Menu */}
            {showAddMenu && (
              <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-500/5 dark:bg-pink-950/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Select Flavour to Add
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAddCategory('stick')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        selectedAddCategory === 'stick' 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sticks (₹{stickPrice})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAddCategory('pot')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        selectedAddCategory === 'pot' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Pots (₹{potPrice})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {selectedAddCategory === 'stick' ? (
                    stickFlavourList.map(flavour => (
                      <button
                        key={flavour}
                        type="button"
                        onClick={() => handleAddFlavourItem(flavour, 'stick', stickPrice)}
                        className="p-1.5 text-left rounded-lg bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 truncate cursor-pointer transition-colors"
                      >
                        🍦 {flavour}
                      </button>
                    ))
                  ) : (
                    potFlavourList.map(flavour => (
                      <button
                        key={flavour}
                        type="button"
                        onClick={() => handleAddFlavourItem(flavour, 'pot', potPrice)}
                        className="p-1.5 text-left rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 truncate cursor-pointer transition-colors"
                      >
                        🍯 {flavour}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Item list */}
            {items.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/30">
                All items removed. Add at least one flavour above.
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        ₹{item.price} each • {item.category.toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-black font-mono text-xs text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-14 text-right font-black font-mono text-xs text-slate-900 dark:text-white">
                        ₹{item.price * item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'split'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>Split</span>
              </button>
            </div>

            {paymentMethod === 'split' && (
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Cash Portion:</span>
                  <input
                    type="number"
                    min={0}
                    max={grandTotal}
                    value={splitCashAmount}
                    onChange={e => setSplitCashAmount(e.target.value)}
                    placeholder="Enter cash amount"
                    className="w-32 h-8 px-2 rounded-lg text-right font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>UPI Portion (Auto):</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    ₹{Math.max(0, grandTotal - (Number(splitCashAmount) || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full h-9 px-3 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Order note (optional)"
                className="w-full h-9 px-3 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>
          </div>

          {/* Sticky Action Footer - ALWAYS VISIBLE AT BOTTOM, NEVER OBSCURED */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 space-y-2.5 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            {/* Order Totals Summary Bar */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Subtotal: ₹{subtotal} {discount > 0 && `• Disc: -₹${discount}`}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  ⭐ Loyalty: +{pointsEarned} pts
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Total Due
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="w-1/3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || items.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4 shrink-0" />
                    <span>Update Bill • ₹{grandTotal}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
