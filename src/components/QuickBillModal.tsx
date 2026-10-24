import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  Smartphone, 
  Banknote, 
  Share2, 
  Printer, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  RotateCcw, 
  Receipt, 
  ShoppingBag,
  IceCream,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Calendar,
  Percent,
  Search,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useQuickBills, 
  useSettings, 
  useInventory, 
  useEntries,
  MASTER_STICK_FLAVOURS,
  MASTER_POT_FLAVOURS,
  arrangeFlavoursInSequence
} from '../store';
import { BillItem, QuickBill } from '../types';
import { auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useFranchise } from '../context/FranchiseContext';

// Shared singletons for performance & zero memory leak
const qrCodeCache = new Map<string, string>();
let sharedAudioCtx: AudioContext | null = null;
function playAudioBeep(freq = 600, duration = 80) {
  try {
    if (typeof window === 'undefined') return;
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (!sharedAudioCtx) return;
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    const now = sharedAudioCtx.currentTime;
    osc.start(now);
    osc.stop(now + duration / 1000);
  } catch {}
}

interface QuickBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export function QuickBillModal({ isOpen, onClose, isEmbedded = false }: QuickBillModalProps) {
  const { settings } = useSettings();
  const { inventory } = useInventory();
  const { bills, saveBill, deleteBill } = useQuickBills();
  const { franchise, profile } = useFranchise();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation modes: 'pos' (bill creation) | 'receipt' (viewing bill) | 'history' (recent bills)
  const [modalMode, setModalMode] = useState<'pos' | 'receipt' | 'history'>('pos');
  // Mobile sub-tab in POS mode: 'menu' (item catalog) | 'cart' (order review & pay)
  const [mobilePosTab, setMobilePosTab] = useState<'menu' | 'cart'>('menu');
  
  // Cart state
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'split' | 'complimentary'>('upi');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'stick' | 'pot' | 'plate' | 'all'>('all');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active viewing bill for receipt
  const [currentBill, setCurrentBill] = useState<QuickBill | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reset to menu tab whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setMobilePosTab('menu');
      setSearchQuery('');
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  // QR Code data URLs
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [googleReviewQrUrl, setGoogleReviewQrUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullQrOpen, setIsFullQrOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [redeemType, setRedeemType] = useState<'none' | 'stick' | 'pot'>('none');

  const todayBills = useMemo(() => {
    return bills.filter(b => b.date === todayStr);
  }, [bills, todayStr]);

  const todaySalesTotal = useMemo(() => {
    return todayBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [todayBills]);

  // Selected date bills calculation
  const filteredBills = useMemo(() => {
    return bills.filter(b => b.date === selectedDate);
  }, [bills, selectedDate]);

  const salesTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [filteredBills]);

  const upiTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      if (b.paymentMethod === 'upi') return sum + b.totalAmount;
      if (b.paymentMethod === 'split') return sum + (b.upiAmount || 0);
      return sum;
    }, 0);
  }, [filteredBills]);

  const cashTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      if (b.paymentMethod === 'cash') return sum + b.totalAmount;
      if (b.paymentMethod === 'split') return sum + (b.cashAmount || 0);
      return sum;
    }, 0);
  }, [filteredBills]);


  // Audio beep on item tap / completion
  const playBeep = (freq = 600, duration = 80) => {
    if (!soundEnabled) return;
    playAudioBeep(freq, duration);
  };

  // Vibration feedback
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  };

  // Generate next bill number
  const nextBillNumber = useMemo(() => {
    const prefix = settings.billPrefix || 'NOK-';
    const count = (bills.length + 1).toString().padStart(4, '0');
    return `${prefix}${count}`;
  }, [settings.billPrefix, bills.length]);

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Customer retail bills in POS do NOT include platform fee (platform fee is a daily stall rent expense)
  const platformFee = 0;

  // Loyalty points calculations
  const cleanCustomerPhone = customerPhone.replace(/\D/g, '');
  const customerPointsBalance = useMemo(() => {
    if (cleanCustomerPhone.length < 10) return 0;
    let earned = 0;
    let redeemed = 0;
    bills.forEach(b => {
      if ((b.customerPhone || '').replace(/\D/g, '') === cleanCustomerPhone) {
        earned += (b.pointsEarned || 0);
        redeemed += (b.pointsRedeemed || 0);
      }
    });
    return Math.max(0, earned - redeemed);
  }, [bills, cleanCustomerPhone]);

  const cartSticksCount = useMemo(() => {
    return cartItems.filter(i => i.category === 'stick').reduce((s, i) => s + i.quantity, 0);
  }, [cartItems]);

  const cartPotsCount = useMemo(() => {
    return cartItems.filter(i => i.category === 'pot').reduce((s, i) => s + i.quantity, 0);
  }, [cartItems]);

  const pointsEarnedThisOrder = useMemo(() => {
    return (cartSticksCount + cartPotsCount) * 3;
  }, [cartSticksCount, cartPotsCount]);

  const redemptionDiscount = useMemo(() => {
    if (redeemType === 'stick' && customerPointsBalance >= 40) {
      return settings.stickPrice || 40;
    }
    if (redeemType === 'pot' && customerPointsBalance >= 50) {
      return settings.potPrice || 50;
    }
    return 0;
  }, [redeemType, customerPointsBalance, settings.stickPrice, settings.potPrice]);

  const pointsRedeemedThisOrder = useMemo(() => {
    if (redeemType === 'stick' && customerPointsBalance >= 40) return 40;
    if (redeemType === 'pot' && customerPointsBalance >= 50) return 50;
    return 0;
  }, [redeemType, customerPointsBalance]);

  const grandTotal = useMemo(() => {
    if (paymentMethod === 'complimentary') return 0;
    if (cartItems.length === 0) return 0;
    const calculated = subtotal - discount - redemptionDiscount;
    return Math.max(0, calculated);
  }, [subtotal, discount, redemptionDiscount, paymentMethod, cartItems.length]);

  // UPI amount when in split mode
  const currentUpiAmount = useMemo(() => {
    if (paymentMethod === 'upi') return grandTotal;
    if (paymentMethod === 'split') {
      const cash = Number(splitCashAmount) || 0;
      return Math.max(0, grandTotal - cash);
    }
    return 0;
  }, [paymentMethod, grandTotal, splitCashAmount]);

  // Cash change calculation
  const cashChange = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const given = Number(cashTendered) || 0;
    return Math.max(0, given - grandTotal);
  }, [paymentMethod, cashTendered, grandTotal]);

  // UPI Intent URI construction
  const upiPayUri = useMemo(() => {
    const upiId = settings.upiId || 'nammaoorukulfi@oksbi';
    const upiName = settings.upiName || franchise?.name || 'Namma Ooru Kulfi';
    const amount = (paymentMethod === 'split' ? currentUpiAmount : grandTotal).toFixed(2);
    const billNo = currentBill ? currentBill.billNumber : nextBillNumber;
    const note = `Kulfi Bill ${billNo}`;
    
    // Standard NPCI UPI URI Scheme
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [settings.upiId, settings.upiName, franchise?.name, grandTotal, currentUpiAmount, paymentMethod, currentBill, nextBillNumber]);

  // Generate UPI QR Code with memoized cache
  useEffect(() => {
    if (!isOpen) return;
    if (grandTotal > 0 && (paymentMethod === 'upi' || paymentMethod === 'split')) {
      const cached = qrCodeCache.get(upiPayUri);
      if (cached) {
        setUpiQrUrl(cached);
        return;
      }
      QRCode.toDataURL(upiPayUri, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
      .then(url => {
        qrCodeCache.set(upiPayUri, url);
        setUpiQrUrl(url);
      })
      .catch(err => console.error("Error generating UPI QR:", err));
    } else {
      setUpiQrUrl('');
    }
  }, [isOpen, upiPayUri, grandTotal, paymentMethod]);

  // Generate Google Review QR Code with memoized cache
  useEffect(() => {
    if (!isOpen || modalMode !== 'receipt') return;
    const reviewUrl = settings.googleReviewUrl?.trim();
    if (reviewUrl) {
      const cached = qrCodeCache.get(reviewUrl);
      if (cached) {
        setGoogleReviewQrUrl(cached);
        return;
      }
      QRCode.toDataURL(reviewUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
      .then(url => {
        qrCodeCache.set(reviewUrl, url);
        setGoogleReviewQrUrl(url);
      })
      .catch(err => console.error("Error generating Google Review QR:", err));
    } else {
      setGoogleReviewQrUrl('');
    }
  }, [isOpen, modalMode, settings.googleReviewUrl]);

  // Catalog item presets based on inventory flavors & prices arranged in the exact official sequence
  const catalogStickItems = useMemo(() => {
    const price = settings.stickPrice || 40;
    const ordered = arrangeFlavoursInSequence(inventory.stickFlavours, MASTER_STICK_FLAVOURS);
    return ordered.map(f => ({
      id: `stick_${f.name.toLowerCase().replace(/[\s\-_]+/g, '_')}`,
      name: f.name.toLowerCase().includes('stick') ? f.name : `${f.name} Stick`,
      category: 'stick' as const,
      flavour: f.name,
      price,
      stockAvailable: f.quantity !== undefined ? f.quantity : 99
    }));
  }, [settings.stickPrice, inventory.stickFlavours]);

  const catalogPotItems = useMemo(() => {
    const price = settings.potPrice || 50;
    const ordered = arrangeFlavoursInSequence(inventory.potFlavours, MASTER_POT_FLAVOURS);
    return ordered.map(f => ({
      id: `pot_${f.name.toLowerCase().replace(/[\s\-_]+/g, '_')}`,
      name: f.name.toLowerCase().includes('pot') ? f.name : `${f.name} Pot`,
      category: 'pot' as const,
      flavour: f.name,
      price,
      stockAvailable: f.quantity !== undefined ? f.quantity : 99
    }));
  }, [settings.potPrice, inventory.potFlavours]);

  const catalogPlateItems = useMemo(() => {
    if (!settings.enablePlate) return [];
    const price = settings.platePrice || 75;
    const configured = (inventory.plateFlavours || []).filter(f => f && f.name && f.name.trim().length > 0);
    if (configured.length > 0) {
      return configured.map(f => ({
        id: `plate_${f.name}`,
        name: f.name.toLowerCase().includes('plate') ? f.name : `${f.name} Plate`,
        category: 'plate' as const,
        flavour: f.name,
        price,
        stockAvailable: f.quantity
      }));
    }
    return [
      { id: 'plate_rabdi', name: 'Rabdi Plate', category: 'plate' as const, flavour: 'Rabdi', price, stockAvailable: 99 },
      { id: 'plate_falooda', name: 'Falooda Plate', category: 'plate' as const, flavour: 'Falooda', price, stockAvailable: 99 },
      { id: 'plate_general', name: 'Special Plate Kulfi', category: 'plate' as const, flavour: 'Special', price, stockAvailable: 99 },
    ];
  }, [settings.enablePlate, settings.platePrice, inventory.plateFlavours]);

  const filteredStickItems = useMemo(() => {
    if (!searchQuery.trim()) return catalogStickItems;
    const q = searchQuery.toLowerCase().trim();
    return catalogStickItems.filter(i => i.name.toLowerCase().includes(q) || (i.flavour && i.flavour.toLowerCase().includes(q)));
  }, [catalogStickItems, searchQuery]);

  const filteredPotItems = useMemo(() => {
    if (!searchQuery.trim()) return catalogPotItems;
    const q = searchQuery.toLowerCase().trim();
    return catalogPotItems.filter(i => i.name.toLowerCase().includes(q) || (i.flavour && i.flavour.toLowerCase().includes(q)));
  }, [catalogPotItems, searchQuery]);

  const filteredPlateItems = useMemo(() => {
    if (!searchQuery.trim()) return catalogPlateItems;
    const q = searchQuery.toLowerCase().trim();
    return catalogPlateItems.filter(i => i.name.toLowerCase().includes(q) || (i.flavour && i.flavour.toLowerCase().includes(q)));
  }, [catalogPlateItems, searchQuery]);

  // Cart operations
  const handleAddItem = (item: { name: string; category: 'stick' | 'pot' | 'plate' | 'custom'; flavour?: string; price: number }) => {
    triggerHaptic();
    playBeep(750, 60);

    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.name === item.name && i.category === item.category);
      if (existingIndex > -1) {
        const next = [...prev];
        const current = next[existingIndex];
        const newQty = current.quantity + 1;
        next[existingIndex] = {
          ...current,
          quantity: newQty,
          total: newQty * current.price
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            category: item.category,
            flavour: item.flavour,
            price: item.price,
            quantity: 1,
            total: item.price
          }
        ];
      }
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    triggerHaptic();
    playBeep(delta > 0 ? 800 : 500, 50);

    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.price
          };
        }
        return item;
      }).filter(Boolean) as BillItem[];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    triggerHaptic();
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleClearCart = () => {
    triggerHaptic();
    setCartItems([]);
    setDiscount(0);
    setRedeemType('none');
    setCashTendered('');
    setSplitCashAmount('');
    setCustomerPhone('');
    setCustomerName('');
    setNotes('');
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customItemPrice);
    if (!customItemName.trim() || isNaN(price) || price <= 0) return;
    
    handleAddItem({
      name: customItemName.trim(),
      category: 'custom',
      flavour: customItemName.trim(),
      price
    });

    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomItemForm(false);
  };

  // Complete & Save Bill
  const handleCompleteBill = async () => {
    if (cartItems.length === 0 || isSaving) return;

    triggerHaptic();
    playBeep(950, 150);
    setIsSaving(true);

    const now = new Date();
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    let cashAmt = 0;
    let upiAmt = 0;
    if (paymentMethod === 'cash') cashAmt = grandTotal;
    if (paymentMethod === 'upi') upiAmt = grandTotal;
    if (paymentMethod === 'split') {
      cashAmt = Number(splitCashAmount) || 0;
      upiAmt = Math.max(0, grandTotal - cashAmt);
    }

    const newBill: QuickBill = {
      id: billId,
      billNumber: nextBillNumber,
      franchiseId: franchise?.id || 'global',
      date: format(now, 'yyyy-MM-dd'),
      createdAt: now.toISOString(),
      items: cartItems,
      subtotal,
      discount: discount + redemptionDiscount,
      platformFee,
      totalAmount: grandTotal,
      paymentMethod,
      status: 'paid',
      cashAmount: cashAmt,
      upiAmount: upiAmt,
      customerPhone: customerPhone.trim() || '',
      customerName: customerName.trim() || '',
      notes: notes.trim() || '',
      syncedToDailyEntry: settings.autoSyncBillToEntry !== false,
      userId: auth.currentUser?.uid || '',
      pointsEarned: pointsEarnedThisOrder,
      pointsRedeemed: pointsRedeemedThisOrder
    };

    // Instant UI transition so staff is never stuck
    setCurrentBill(newBill);
    setModalMode('receipt');
    handleClearCart();
    setIsSaving(false);

    // Save in background
    try {
      await saveBill(newBill, settings.autoSyncBillToEntry !== false);
    } catch (err) {
      console.error("Failed to sync bill to cloud in background:", err);
    }
  };

  // Start a fresh new customer transaction
  const handleNextCustomer = () => {
    triggerHaptic();
    playBeep(700, 80);
    handleClearCart();
    setCurrentBill(null);
    setModalMode('pos');
    setMobilePosTab('menu');
  };

  // Copy UPI string
  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiPayUri);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {}
  };

  // WhatsApp receipt text sharing
  const handleShareWhatsApp = (bill: QuickBill) => {
    const storeName = settings.upiName || franchise?.name || 'Namma Ooru Kulfi';
    const storeTagline = settings.storeTagline || '100% Traditional Malai & Pot Kulfi';
    const reviewUrl = settings.googleReviewUrl?.trim();
    const formattedDate = format(new Date(bill.createdAt), 'dd MMM yyyy, hh:mm a');

    let text = `🍨 *${storeName}* - Digital Receipt\n`;
    text += `✨ _${storeTagline}_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🧾 *Bill No:* ${bill.billNumber}\n`;
    text += `📅 *Date:* ${formattedDate}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*ITEMS:*\n`;
    
    bill.items.forEach(item => {
      text += `• ${item.quantity}x ${item.name} @ ₹${item.price} = ₹${item.total}\n`;
    });

    if (bill.discount > 0) {
      text += `Discount: -₹${bill.discount}\n`;
    }
    if (bill.platformFee > 0) {
      text += `Platform Fee: +₹${bill.platformFee}\n`;
    }

    if (bill.pointsEarned && bill.pointsEarned > 0) {
      text += `⭐ *Loyalty Points Earned:* +${bill.pointsEarned} pts\n`;
    }
    if (bill.pointsRedeemed && bill.pointsRedeemed > 0) {
      text += `🎁 *Points Redeemed:* -${bill.pointsRedeemed} pts (Free item claimed)\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *TOTAL PAID: ₹${bill.totalAmount}* (${bill.paymentMethod.toUpperCase()})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (reviewUrl) {
      text += `🌟 *Loved your fresh kulfi?*\n`;
      text += `Please support our cart with a quick 5-star review on Google Maps:\n`;
      text += `👉 ${reviewUrl}\n\n`;
    }

    const instaUrl = settings.instagramUrl?.trim();
    if (instaUrl) {
      text += `📸 *For best offers & updates, follow our Instagram page!*\n`;
      text += `👉 ${instaUrl}\n\n`;
    }

    text += `📞 *Contact:* 9686831400 (Offers & Stock Availability)\n`;
    text += `⏰ *Timing:* 6:00 PM to 11:30 PM (All Days)\n\n`;

    text += `Thank you for visiting! Please come again! 🙏🍦`;

    const phone = bill.customerPhone?.replace(/\D/g, '') || customerPhone.replace(/\D/g, '');
    let waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (phone && phone.length >= 10) {
      const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
      waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }

    window.open(waUrl, '_blank');
  };

  // Thermal printing handler
  const handlePrintReceipt = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className={isEmbedded ? "flex flex-col h-full w-full bg-[#0f172a] overflow-hidden pb-24 relative z-10" : "fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"}>
      <div 
        className={isEmbedded ? "w-full h-full flex flex-col overflow-hidden" : `w-full max-w-5xl h-full max-h-full sm:h-[92vh] sm:max-h-[92vh] sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border flex flex-col transition-all duration-300 ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white shadow-cyan-950/20' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Header Bar */}
        <div className={`px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-500 flex items-center justify-center font-black text-base sm:text-lg shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black tracking-tight truncate">
                  Quick POS & Digital Receipt
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
                  {nextBillNumber}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block">
                Instant UPI QR • 1-Tap Google Reviews • Auto-Stock Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop view switcher tabs */}
            <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalMode('pos')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  modalMode === 'pos' 
                    ? 'bg-pink-500 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🛒 Counter
              </button>
              {currentBill && (
                <button
                  type="button"
                  onClick={() => setModalMode('receipt')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    modalMode === 'receipt' 
                      ? 'bg-pink-500 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🧾 Receipt
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalMode('history')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  modalMode === 'history' 
                    ? 'bg-pink-500 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({filteredBills.length})</span>
              </button>
            </div>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={soundEnabled ? "Mute beep sound" : "Enable beep sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Close POS"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/95 dark:bg-slate-900/95 p-1.5 gap-1.5 shrink-0 z-20">
          <button
            type="button"
            onClick={() => { setModalMode('pos'); setMobilePosTab('menu'); }}
            className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              modalMode === 'pos' && mobilePosTab === 'menu'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <IceCream className="w-3.5 h-3.5" />
            <span>Flavours (Add)</span>
          </button>
          <button
            type="button"
            onClick={() => { setModalMode('pos'); setMobilePosTab('cart'); }}
            className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              modalMode === 'pos' && mobilePosTab === 'cart'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart ({totalCartCount})</span>
            {grandTotal > 0 && <span className="font-mono text-[10px] ml-0.5 px-1 rounded bg-black/20">₹{grandTotal}</span>}
          </button>
          {currentBill && (
            <button
              type="button"
              onClick={() => setModalMode('receipt')}
              className={`py-2 px-2.5 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modalMode === 'receipt' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bill</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalMode('history')}
            className={`py-2 px-2.5 text-center text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              modalMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({filteredBills.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: POS COUNTER BILLING */}
        {/* ========================================================================= */}
        {modalMode === 'pos' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
            {/* Left: Product Selector Grid */}
            <div 
              style={{ WebkitOverflowScrolling: 'touch' }}
              className={`flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-5 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 min-h-0 ${
                mobilePosTab === 'menu' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
              }`}
            >
              
              {/* Search & Quick Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search flavours (Malai, Mango, Badam...)"
                    className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category selector pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    ✨ All Items
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('stick')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === 'stick'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    <span>🍦 Sticks</span>
                    <span className="text-[10px] opacity-75 font-mono">₹{settings.stickPrice || 40}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('pot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === 'pot'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-pink-500/10 text-pink-700 dark:text-pink-400 hover:bg-pink-500/20'
                    }`}
                  >
                    <span>🍯 Pots</span>
                    <span className="text-[10px] opacity-75 font-mono">₹{settings.potPrice || 50}</span>
                  </button>
                  {settings.enablePlate && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory('plate')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeCategory === 'plate'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      <span>🍽️ Plates</span>
                      <span className="text-[10px] opacity-75 font-mono">₹{settings.platePrice || 75}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Custom
                  </button>
                </div>
              </div>

              {/* Custom Item Form */}
              {showCustomItemForm && (
                <form onSubmit={handleAddCustomItem} className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom Item Name (e.g. Extra Rabdi)"
                    value={customItemName}
                    onChange={e => setCustomItemName(e.target.value)}
                    className="flex-1 min-w-[160px] h-9 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Price (₹)"
                    value={customItemPrice}
                    onChange={e => setCustomItemPrice(e.target.value)}
                    className="w-24 h-9 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-pink-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomItemForm(false)}
                    className="h-9 px-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Stick Section */}
              {(activeCategory === 'all' || activeCategory === 'stick') && filteredStickItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    <span className="flex items-center gap-1.5">
                      🍦 Stick kulfi* (₹{settings.stickPrice || 40})
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Tap to add</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {filteredStickItems.map(item => {
                      const cartItem = cartItems.find(i => i.name === item.name);
                      const countInCart = cartItem?.quantity || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className={`relative p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none active:scale-[0.98] flex flex-col justify-between min-h-[82px] ${
                            countInCart > 0
                              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                              : isDark
                                ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850'
                                : 'bg-white border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 shadow-sm'
                          }`}
                        >
                          {countInCart > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyan-500 text-white font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50 z-10">
                              {countInCart}
                            </span>
                          )}
                          <div>
                            <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-wider block">Stick</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                              {item.flavour || item.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">₹{item.price}</span>
                            {countInCart > 0 && cartItem ? (
                              <div 
                                className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-cyan-500/30 p-0.5 shadow-sm"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, -1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-black font-mono text-cyan-600 dark:text-cyan-400">
                                  {countInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pot Section */}
              {(activeCategory === 'all' || activeCategory === 'pot') && filteredPotItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                    <span className="flex items-center gap-1.5">
                      🍯 Pot kulfi (₹{settings.potPrice || 50})
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Tap to add</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {filteredPotItems.map(item => {
                      const cartItem = cartItems.find(i => i.name === item.name);
                      const countInCart = cartItem?.quantity || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className={`relative p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none active:scale-[0.98] flex flex-col justify-between min-h-[82px] ${
                            countInCart > 0
                              ? 'bg-pink-500/10 border-pink-500/50 shadow-sm shadow-pink-500/10'
                              : isDark
                                ? 'bg-slate-900/60 border-slate-800 hover:border-pink-500/40 hover:bg-slate-850'
                                : 'bg-white border-slate-200 hover:border-pink-400 hover:bg-pink-50/40 shadow-sm'
                          }`}
                        >
                          {countInCart > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-500 text-white font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50 z-10">
                              {countInCart}
                            </span>
                          )}
                          <div>
                            <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-wider block">Matka Pot</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                              {item.flavour || item.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">₹{item.price}</span>
                            {countInCart > 0 && cartItem ? (
                              <div 
                                className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-pink-500/30 p-0.5 shadow-sm"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, -1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-black font-mono text-pink-600 dark:text-pink-400">
                                  {countInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-black text-pink-600 dark:text-pink-400 bg-pink-500/15 hover:bg-pink-500/25 px-2.5 py-1 rounded-lg border border-pink-500/30 flex items-center gap-1 shadow-sm">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Plate Section */}
              {(activeCategory === 'all' || activeCategory === 'plate') && filteredPlateItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      🍽️ Plate Kulfi (₹{settings.platePrice || 75})
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Tap to add</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {filteredPlateItems.map(item => {
                      const cartItem = cartItems.find(i => i.name === item.name);
                      const countInCart = cartItem?.quantity || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className={`relative p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none active:scale-[0.98] flex flex-col justify-between min-h-[82px] ${
                            countInCart > 0
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/10'
                              : isDark
                                ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850'
                                : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-sm'
                          }`}
                        >
                          {countInCart > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50 z-10">
                              {countInCart}
                            </span>
                          )}
                          <div>
                            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">Plate</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                              {item.flavour || item.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">₹{item.price}</span>
                            {countInCart > 0 && cartItem ? (
                              <div 
                                className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-amber-500/30 p-0.5 shadow-sm"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, -1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                                  {countInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.id, 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 shadow-sm">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty search results state */}
              {searchQuery && filteredStickItems.length === 0 && filteredPotItems.length === 0 && filteredPlateItems.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No flavours found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400">Try searching another flavour name or tap Clear.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Bottom spacing on mobile so menu items aren't covered by floating bar */}
              <div className={`h-24 ${isEmbedded ? 'h-36' : ''} md:hidden shrink-0`} />
            </div>

            {/* Sticky Floating Bottom Bar on Mobile (when on Menu) */}
            {mobilePosTab === 'menu' && (
              <div className={`md:hidden sticky ${isEmbedded ? 'bottom-20' : 'bottom-0'} left-0 right-0 z-30 p-2.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-3 shadow-2xl shrink-0`}>
                {cartItems.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                        {totalCartCount}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                          {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
                        </span>
                        <span className="text-base font-black font-mono text-white leading-tight">
                          ₹{grandTotal}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobilePosTab('cart')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-pink-500/25 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Review & Pay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between py-1 text-xs px-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      👆 Tap any flavour to add to bill
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobilePosTab('cart')}
                      className="text-xs font-bold text-pink-400 hover:text-pink-300 underline cursor-pointer"
                    >
                      View Cart (0)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Right: Cart, Live Bill & Payment Section */}
            <div 
              style={{ WebkitOverflowScrolling: 'touch' }}
              className={`w-full md:w-96 flex flex-col min-h-0 border-slate-200 dark:border-slate-800 md:border-l ${
                isDark ? 'bg-slate-900/40' : 'bg-slate-50/70'
              } ${
                mobilePosTab === 'cart' 
                  ? 'flex-1 overflow-y-auto overscroll-contain touch-pan-y' 
                  : 'hidden md:flex md:flex-col md:overflow-hidden'
              }`}
            >
              
              {/* Mobile Back to Menu Sticky Header */}
              <div className="md:hidden sticky top-0 z-20 p-2.5 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMobilePosTab('menu')}
                  className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer active:scale-95 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add More Flavours</span>
                </button>
                <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">
                  {totalCartCount} items • ₹{grandTotal}
                </span>
              </div>

              {/* Order items tray */}
              <div className="p-3.5 sm:p-4 md:flex-1 md:overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />
                    Current Order ({totalCartCount})
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[10px] font-extrabold uppercase text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-xl">
                      🍦
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Your cart is empty</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Select flavours from the menu catalog to begin</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobilePosTab('menu')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Browse Menu Flavours</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div 
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500">
                            ₹{item.price} each
                          </p>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right shrink-0 w-14">
                          <span className="text-xs font-black text-slate-900 dark:text-white block font-mono">
                            ₹{item.total}
                          </span>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setMobilePosTab('menu')}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400 text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add More Flavours</span>
                    </button>
                  </div>
                )}

                {/* Quick Discount chips */}
                {cartItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                      <span>Discount (₹)</span>
                      {discount > 0 && <span className="text-emerald-500 font-bold">-₹{discount}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 20, 50].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscount(amt)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            discount === amt
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {amt === 0 ? 'None' : `₹${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer mobile number & Loyalty Points */}
                {cartItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                      <span>Customer Mobile & Loyalty</span>
                      <span className="text-amber-500 font-bold">3 pts / stick or pot</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210 (Customer Phone)"
                        value={customerPhone}
                        onChange={e => {
                          setCustomerPhone(e.target.value.replace(/\D/g, ''));
                          setRedeemType('none');
                        }}
                        className="w-full h-8 pl-10 pr-3 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    {cleanCustomerPhone.length === 10 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-amber-800 dark:text-amber-300">
                            ⭐ Points Balance: <span className="font-mono">{customerPointsBalance} pts</span>
                          </span>
                          <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-bold">
                            (+{pointsEarnedThisOrder} pts earned today)
                          </span>
                        </div>

                        {/* Redemption buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {customerPointsBalance >= 40 && (
                            <button
                              type="button"
                              onClick={() => setRedeemType(redeemType === 'stick' ? 'none' : 'stick')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                redeemType === 'stick'
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              }`}
                            >
                              {redeemType === 'stick' ? '✓ Free Stick Applied' : `🎁 Redeem Stick (40 pts)`}
                            </button>
                          )}
                          {customerPointsBalance >= 50 && (
                            <button
                              type="button"
                              onClick={() => setRedeemType(redeemType === 'pot' ? 'none' : 'pot')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                redeemType === 'pot'
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              }`}
                            >
                              {redeemType === 'pot' ? '✓ Free Pot Applied' : `🎁 Redeem Pot (50 pts)`}
                            </button>
                          )}
                          {customerPointsBalance < 40 && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              Need {40 - customerPointsBalance} more pts to redeem a free Stick (40 pts) or Pot (50 pts).
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pay Box */}
              <div className={`p-4 border-t space-y-3 md:shrink-0 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                {/* Grand Total Display */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Due</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                      ₹{grandTotal}
                    </span>
                  </div>
                  {discount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-500">
                      ₹{discount} discount applied
                    </span>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('upi'); triggerHaptic(); }}
                    className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'upi'
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('cash'); triggerHaptic(); }}
                    className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('split'); triggerHaptic(); }}
                    className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'split'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20 scale-[1.02]'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Split</span>
                  </button>
                </div>

                {/* Cash Change Tender Calculator */}
                {paymentMethod === 'cash' && grandTotal > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Cash Received</span>
                      <div className="flex gap-1">
                        {[grandTotal, 100, 200, 500].filter(n => n >= grandTotal).slice(0, 3).map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashTendered(amt.toString())}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 text-emerald-600 border border-emerald-300 dark:border-emerald-700 cursor-pointer"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter amount customer gave"
                        value={cashTendered}
                        onChange={e => setCashTendered(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 h-8 px-2.5 rounded-lg text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800"
                      />
                      {Number(cashTendered) > grandTotal && (
                        <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black animate-in zoom-in-50">
                          Return: ₹{cashChange}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Split Cash & UPI calculator */}
                {paymentMethod === 'split' && (
                  <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-pink-700 dark:text-pink-400">Cash Portion:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="₹ Cash"
                        value={splitCashAmount}
                        onChange={e => setSplitCashAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-24 h-7 px-2 rounded text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-pink-300 dark:border-pink-800 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-cyan-600 dark:text-cyan-400">UPI Portion via QR:</span>
                      <span className="font-mono text-cyan-500">₹{currentUpiAmount}</span>
                    </div>
                  </div>
                )}

                {/* Inline Live Dynamic QR for quick counter scanning */}
                {(paymentMethod === 'upi' || paymentMethod === 'split') && upiQrUrl && grandTotal > 0 && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-inner">
                    <div 
                      className="p-1.5 rounded-xl bg-white shadow-sm border border-slate-200 shrink-0 cursor-pointer group relative"
                      onClick={() => setIsFullQrOpen(true)}
                      title="Tap to enlarge QR code"
                    >
                      <img src={upiQrUrl} alt="UPI Payment QR" className="w-20 h-20 rounded group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-x-0 bottom-1 text-[8px] font-black text-center text-slate-700 bg-white/95 rounded-b py-0.5 shadow">
                        🔍 Tap Full
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                        ⚡ Scan with GPay / PhonePe
                      </span>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                        ₹{paymentMethod === 'split' ? currentUpiAmount : grandTotal}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyUpiLink}
                        className="text-[10px] font-bold text-slate-500 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUpi ? 'Link Copied!' : 'Copy UPI Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Complete Bill Button */}
                <button
                  type="button"
                  disabled={cartItems.length === 0 || isSaving}
                  onClick={handleCompleteBill}
                  className={`w-full h-12 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] ${
                    cartItems.length === 0 || isSaving
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-500/25'
                  }`}
                >
                  {isSaving ? (
                    <span>Generating Receipt...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Bill • ₹{grandTotal}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>

              {/* Extra mobile bottom safe spacer so the Complete Bill button is never cut off on phones */}
              <div className="h-28 md:hidden shrink-0" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: DIGITAL RECEIPT & GOOGLE REVIEW SCREEN */}
        {/* ========================================================================= */}
        {modalMode === 'receipt' && currentBill && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Success Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase block">Payment Completed & Recorded!</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Inventory deducted • Bill #{currentBill.billNumber} • ₹{currentBill.totalAmount}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextCustomer}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer active:scale-95 transition-transform"
              >
                ⚡ Next Customer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Thermal / Digital Receipt Card */}
              <div 
                id="digital-receipt-printable" 
                className={`p-6 rounded-2xl border relative overflow-hidden font-mono text-xs ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800 shadow-xl'
                }`}
              >
                {/* Serrated edge decor on top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-cyan-400 to-amber-400" />

                {/* Receipt Header */}
                <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                  <div className="inline-block p-2 rounded-xl bg-pink-500/10 text-pink-500 mb-1">
                    🍦
                  </div>
                  <h3 className="text-base font-black tracking-wider uppercase font-sans text-slate-950 dark:text-white">
                    {settings.upiName || franchise?.name || 'Namma Ooru Kulfi'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-sans font-bold">
                    {settings.storeTagline || '100% Traditional Malai & Pot Kulfi'}
                  </p>
                  {settings.storeAddress && (
                    <p className="text-[10px] text-slate-400 font-sans">
                      {settings.storeAddress}
                    </p>
                  )}
                  {settings.storePhone && (
                    <p className="text-[10px] text-slate-400 font-sans">
                      Ph: {settings.storePhone}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill No:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-sans">{currentBill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {format(new Date(currentBill.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier / Staff:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-sans">
                      {profile?.name || auth.currentUser?.email?.split('@')[0] || 'Counter Staff'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-black text-emerald-500 uppercase font-sans">
                      PAID ({currentBill.paymentMethod.toUpperCase()})
                    </span>
                  </div>
                </div>

                {/* Loyalty Points Summary */}
                {currentBill.customerPhone && (
                  <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px] font-sans">
                    <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                      <span>⭐ Loyalty Points Earned:</span>
                      <span>+{currentBill.pointsEarned || 0} pts</span>
                    </div>
                    {Boolean(currentBill.pointsRedeemed && currentBill.pointsRedeemed > 0) && (
                      <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>🎁 Points Redeemed:</span>
                        <span>-{currentBill.pointsRedeemed} pts (Free item)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Itemized Table */}
                <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Item</span>
                    <span>Qty x Rate</span>
                    <span>Amount</span>
                  </div>
                  {currentBill.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-bold font-sans truncate max-w-[140px] text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-slate-500">
                        {item.quantity} x {item.price}
                      </span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        ₹{item.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{currentBill.subtotal}</span>
                  </div>
                  {currentBill.discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount:</span>
                      <span>-₹{currentBill.discount}</span>
                    </div>
                  )}
                  {currentBill.platformFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Platform Fee:</span>
                      <span>+₹{currentBill.platformFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-sans uppercase">Total Paid:</span>
                    <span className="font-mono">₹{currentBill.totalAmount}</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="text-center pt-4 text-[10px] text-slate-500 space-y-1 font-sans">
                  <p className="font-bold">Thank you for visiting! 🙏</p>
                  <p className="text-[9px] text-slate-400 font-bold">Contact: 9686831400 (Offers & Stock)</p>
                  <p className="text-[9px] text-slate-400">Timing: 6:00 PM to 11:30 PM (All Days)</p>
                  <p className="text-[9px] text-slate-400">Pure Traditional Kulfi • Made with Farm Milk</p>
                </div>
              </div>

              {/* Right Side: Google Review QR & Share Tools */}
              <div className="space-y-4">
                
                {/* ⭐ Google Maps 5-Star Review Prompt Card */}
                <div className={`p-5 rounded-2xl border text-center space-y-3.5 relative overflow-hidden ${
                  isDark 
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30' 
                    : 'bg-gradient-to-b from-amber-50 to-white border-amber-300 shadow-lg'
                }`}>
                  <div className="flex justify-center items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Loved your Kulfi? Rate us on Google!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Help our local cart grow on Google Maps with a quick 5-star review!
                    </p>
                  </div>

                  {/* Google Review QR Code */}
                  {googleReviewQrUrl ? (
                    <div className="space-y-2">
                      <div className="inline-block p-2.5 rounded-2xl bg-white shadow-md border border-amber-200">
                        <img 
                          src={googleReviewQrUrl} 
                          alt="Scan to Review on Google Maps" 
                          className="w-40 h-40 rounded-lg mx-auto" 
                        />
                      </div>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        📷 Scan with phone camera to review
                      </p>
                      
                      {settings.googleReviewUrl && (
                        <a
                          href={settings.googleReviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer active:scale-95 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Google Maps Review</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-bold">Google Review Link not configured</p>
                      <p className="text-[11px] opacity-80">
                        Go to Settings ➔ Quick Digital Receipt & Google Review QR Setup to paste your Google Maps link.
                      </p>
                    </div>
                  )}
                </div>

                {/* 📸 Instagram Follow Prompt Card */}
                {settings.instagramUrl && (
                  <div className={`p-4 rounded-2xl border text-center space-y-2.5 relative overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-b from-pink-500/10 via-slate-900 to-slate-900 border-pink-500/30' 
                      : 'bg-gradient-to-b from-pink-50 to-white border-pink-300 shadow-md'
                  }`}>
                    <div className="flex justify-center items-center gap-1.5 text-pink-500 font-black text-sm uppercase tracking-wide">
                      <span>📸 Follow on Instagram</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      For best offers, daily updates & cart locations, follow our Insta page!
                    </p>
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit Instagram Page</span>
                    </a>
                  </div>
                )}

                {/* Customer WhatsApp Phone Number Input */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Customer WhatsApp Phone</span>
                    <span className="text-[10px] text-emerald-500 font-normal">Optional</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-10 pl-11 pr-3 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (customerPhone.trim().length >= 10 && currentBill) {
                          const updated = { ...currentBill, customerPhone: customerPhone.trim() };
                          setCurrentBill(updated);
                          triggerHaptic();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      Update
                    </button>
                  </div>
                  {currentBill?.customerPhone && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Saved to bill: +91 {currentBill.customerPhone}
                    </p>
                  )}
                </div>

                {/* Action Buttons: WhatsApp Share & Print */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(currentBill)}
                    className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="h-12 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                </div>

                {/* Back / Next Customer Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('pos')}
                    className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ← Edit / Back to POS
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCustomer}
                    className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer active:scale-95 transition-transform"
                  >
                    ⚡ Next Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: TODAY'S BILLS & COUNTER SALES HISTORY */}
        {/* ========================================================================= */}
        {modalMode === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Date Selector & Quick Filters */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-pink-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    selectedDate === todayStr 
                      ? 'bg-pink-500 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    setSelectedDate(format(yest, 'yyyy-MM-dd'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    selectedDate === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
                      ? 'bg-pink-500 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Sales KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Total Bills ({selectedDate})
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  {filteredBills.length} bills (₹{salesTotal})
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-extrabold uppercase text-cyan-500 block tracking-wider">
                  UPI QR Collections
                </span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">
                  ₹{upiTotal}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-extrabold uppercase text-emerald-500 block tracking-wider">
                  Cash Collections
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                  ₹{cashTotal}
                </span>
              </div>
            </div>

            {/* List of bills for selected date */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Bills for {selectedDate} ({filteredBills.length})
              </h4>

              {filteredBills.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold">No bills generated on {selectedDate}</p>
                  <p className="text-[10px] mt-1">Select another date above or switch to Counter to take orders.</p>
                </div>
              ) : (
                filteredBills.map(bill => (
                  <div 
                    key={bill.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          #{bill.billNumber}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          bill.paymentMethod === 'upi'
                            ? 'bg-cyan-500/15 text-cyan-500'
                            : bill.paymentMethod === 'cash'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-pink-500/15 text-pink-500'
                        }`}>
                          {bill.paymentMethod}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(bill.createdAt), 'hh:mm a')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {bill.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        ₹{bill.totalAmount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentBill(bill);
                          setModalMode('receipt');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase cursor-pointer"
                      >
                        Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(bill)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === bill.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1.5 rounded-xl">
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">Delete bill?</span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              triggerHaptic();
                              try {
                                await deleteBill(bill.id);
                              } catch (err) {
                                console.error("Failed to delete bill:", err);
                              }
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            triggerHaptic();
                            setDeleteConfirmId(bill.id);
                          }}
                          style={{ touchAction: 'manipulation' }}
                          className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 cursor-pointer active:scale-95 transition-all shadow-sm"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Full-Size QR Lightbox Modal */}
        {isFullQrOpen && upiQrUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsFullQrOpen(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  ⚡ Scan to Pay (GPay / PhonePe)
                </span>
                <button type="button" onClick={() => setIsFullQrOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs hover:bg-slate-200 cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 inline-block">
                <img src={upiQrUrl} alt="Full Size UPI QR" className="w-72 h-72 sm:w-80 sm:h-80 rounded-xl mx-auto" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-slate-950 dark:text-white">
                  ₹{currentBill ? currentBill.totalAmount : grandTotal}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {settings.upiName || franchise?.name || 'Namma Ooru Kulfi'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullQrOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
