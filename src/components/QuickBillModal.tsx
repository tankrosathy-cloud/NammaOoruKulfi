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
  History,
  AlertCircle,
  Edit2,
  MessageCircle
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
import { EditBillModal } from './EditBillModal';

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
  const { bills, saveBill, updateBill, deleteBill, setWhatsAppStatus } = useQuickBills();
  const { franchise, profile } = useFranchise();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation modes: 'pos' (bill creation) | 'receipt' (viewing bill) | 'history' (recent bills) | 'whatsapp' (WhatsApp share queue)
  const [modalMode, setModalMode] = useState<'pos' | 'receipt' | 'history' | 'whatsapp'>('pos');
  // Mobile sub-tab in POS mode: 'menu' (item catalog) | 'cart' (order review & pay)
  const [mobilePosTab, setMobilePosTab] = useState<'menu' | 'cart'>('menu');
  
  // Cart state
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'split' | 'complimentary'>('upi');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'stick' | 'pot' | 'plate' | 'all'>('all');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active viewing bill for receipt & bill being edited
  const [currentBill, setCurrentBill] = useState<QuickBill | null>(null);
  const [editingBill, setEditingBill] = useState<QuickBill | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [redeemSticks, setRedeemSticks] = useState<number>(0);
  const [redeemPots, setRedeemPots] = useState<number>(0);

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

  // WhatsApp Queue State & Memos
  const [whatsappFilterStatus, setWhatsappFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [whatsappSearch, setWhatsappSearch] = useState<string>('');
  const [justSharedId, setJustSharedId] = useState<string | null>(null);

  // Counts for WhatsApp tab
  const pendingWhatsAppCount = useMemo(() => {
    return filteredBills.filter(b => !b.whatsappShared).length;
  }, [filteredBills]);

  const completedWhatsAppCount = useMemo(() => {
    return filteredBills.filter(b => !!b.whatsappShared).length;
  }, [filteredBills]);

  // WhatsApp queue sorted list: pending at the top, completed at bottom
  const whatsappBills = useMemo(() => {
    let list = filteredBills;
    if (whatsappFilterStatus === 'pending') {
      list = list.filter(b => !b.whatsappShared);
    } else if (whatsappFilterStatus === 'completed') {
      list = list.filter(b => !!b.whatsappShared);
    }

    if (whatsappSearch.trim()) {
      const q = whatsappSearch.trim().toLowerCase();
      list = list.filter(b => 
        b.billNumber.toLowerCase().includes(q) ||
        (b.customerPhone && b.customerPhone.includes(q)) ||
        b.items.some(i => i.name.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      const aShared = !!a.whatsappShared;
      const bShared = !!b.whatsappShared;
      if (aShared !== bShared) {
        return aShared ? 1 : -1; // pending at the top, completed at bottom
      }
      if (!aShared) {
        // Pending bills: chronological order so bills are sent in sequence
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      } else {
        // Completed bills: most recently shared at top of completed section
        return (b.whatsappSharedAt || b.createdAt || '').localeCompare(a.whatsappSharedAt || a.createdAt || '');
      }
    });
  }, [filteredBills, whatsappFilterStatus, whatsappSearch]);

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

  // Helper to normalize phone numbers to last 10 digits
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Loyalty points calculations
  const cleanCustomerPhone = useMemo(() => getCleanPhone(customerPhone), [customerPhone]);

  const customerPointsSummary = useMemo(() => {
    if (cleanCustomerPhone.length < 10) {
      return { lifetimeEarned: 0, lifetimeRedeemed: 0, balance: 0, billCount: 0 };
    }
    let earned = 0;
    let redeemed = 0;
    let billCount = 0;
    bills.forEach(b => {
      if (getCleanPhone(b.customerPhone) === cleanCustomerPhone) {
        earned += (b.pointsEarned || 0);
        redeemed += (b.pointsRedeemed || 0);
        billCount++;
      }
    });
    return {
      lifetimeEarned: earned,
      lifetimeRedeemed: redeemed,
      balance: Math.max(0, earned - redeemed),
      billCount
    };
  }, [bills, cleanCustomerPhone]);

  const customerPointsBalance = customerPointsSummary.balance;

  const cartSticksCount = useMemo(() => {
    return cartItems.filter(i => i.category === 'stick').reduce((s, i) => s + i.quantity, 0);
  }, [cartItems]);

  const cartPotsCount = useMemo(() => {
    return cartItems.filter(i => i.category === 'pot').reduce((s, i) => s + i.quantity, 0);
  }, [cartItems]);

  const cartPlatesCount = useMemo(() => {
    return cartItems.filter(i => i.category === 'plate').reduce((s, i) => s + i.quantity, 0);
  }, [cartItems]);

  const stickPrice = settings.stickPrice || 40;
  const potPrice = settings.potPrice || 50;

  // Points redeemed: 40 pts for Stick Kulfi, 50 pts for Pot Kulfi
  const pointsRedeemedThisOrder = useMemo(() => {
    return (redeemSticks * 40) + (redeemPots * 50);
  }, [redeemSticks, redeemPots]);

  const redemptionDiscount = useMemo(() => {
    return (redeemSticks * stickPrice) + (redeemPots * potPrice);
  }, [redeemSticks, redeemPots, stickPrice, potPrice]);

  // Points earned on paid items: 3 points per paid stick, pot, or plate
  const pointsEarnedThisOrder = useMemo(() => {
    const paidSticks = Math.max(0, cartSticksCount - redeemSticks);
    const paidPots = Math.max(0, cartPotsCount - redeemPots);
    const paidPlates = cartPlatesCount;
    return (paidSticks + paidPots + paidPlates) * 3;
  }, [cartSticksCount, cartPotsCount, cartPlatesCount, redeemSticks, redeemPots]);

  const projectedPointsBalance = useMemo(() => {
    if (cleanCustomerPhone.length < 10) return 0;
    return Math.max(0, customerPointsBalance - pointsRedeemedThisOrder + pointsEarnedThisOrder);
  }, [cleanCustomerPhone, customerPointsBalance, pointsRedeemedThisOrder, pointsEarnedThisOrder]);

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

  // Loyalty redemption handlers
  const handleAddStickRedemption = () => {
    const pointsNeeded = 40;
    const currentUsed = (redeemSticks * 40) + (redeemPots * 50);
    if (customerPointsBalance - currentUsed < pointsNeeded) return;

    triggerHaptic();
    playBeep(850, 70);

    // If cart has fewer sticks than the new redemption count, auto-add a Stick Kulfi
    if (cartSticksCount < redeemSticks + 1) {
      const firstStick = catalogStickItems.find(s => (s.stockAvailable === undefined || s.stockAvailable > 0)) || catalogStickItems[0];
      const sName = firstStick ? firstStick.name : 'Malai Stick Kulfi';
      handleAddItem({
        name: sName,
        category: 'stick',
        flavour: firstStick?.flavour || 'Malai',
        price: stickPrice
      });
    }

    setRedeemSticks(prev => prev + 1);
  };

  const handleRemoveStickRedemption = () => {
    if (redeemSticks <= 0) return;
    triggerHaptic();
    playBeep(500, 50);
    setRedeemSticks(prev => Math.max(0, prev - 1));
  };

  const handleAddPotRedemption = () => {
    const pointsNeeded = 50;
    const currentUsed = (redeemSticks * 40) + (redeemPots * 50);
    if (customerPointsBalance - currentUsed < pointsNeeded) return;

    triggerHaptic();
    playBeep(850, 70);

    // If cart has fewer pots than the new redemption count, auto-add a Pot Kulfi
    if (cartPotsCount < redeemPots + 1) {
      const firstPot = catalogPotItems.find(p => (p.stockAvailable === undefined || p.stockAvailable > 0)) || catalogPotItems[0];
      const pName = firstPot ? firstPot.name : 'Malai Pot Kulfi';
      handleAddItem({
        name: pName,
        category: 'pot',
        flavour: firstPot?.flavour || 'Malai',
        price: potPrice
      });
    }

    setRedeemPots(prev => prev + 1);
  };

  const handleRemovePotRedemption = () => {
    if (redeemPots <= 0) return;
    triggerHaptic();
    playBeep(500, 50);
    setRedeemPots(prev => Math.max(0, prev - 1));
  };

  const handleClearCart = () => {
    triggerHaptic();
    setCartItems([]);
    setDiscount(0);
    setRedeemSticks(0);
    setRedeemPots(0);
    setCashTendered('');
    setSplitCashAmount('');
    setCustomerPhone('');
    setPhoneError('');
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

    // Mandatory Customer Mobile Number Validation
    const cleanPhone = getCleanPhone(customerPhone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Customer mobile number is mandatory (10 digits required).');
      triggerHaptic();
      playBeep(300, 200);
      if (phoneInputRef.current) {
        phoneInputRef.current.focus();
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setPhoneError('');
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
      pointsRedeemed: pointsRedeemedThisOrder,
      totalLoyaltyPoints: projectedPointsBalance
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

  const handleOpenEditBill = (billToEdit: QuickBill) => {
    setEditingBill(billToEdit);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedBill = async (originalBill: QuickBill, updatedBill: QuickBill) => {
    await updateBill(originalBill, updatedBill);
    if (currentBill && currentBill.id === updatedBill.id) {
      setCurrentBill(updatedBill);
    }
    triggerHaptic();
    playBeep(900, 100);
  };

  // Receipt customer points data memo
  const receiptCustomerPhone = useMemo(() => {
    return currentBill?.customerPhone ? getCleanPhone(currentBill.customerPhone) : '';
  }, [currentBill]);

  const receiptLoyaltyData = useMemo(() => {
    if (!currentBill || !receiptCustomerPhone || receiptCustomerPhone.length < 10) {
      return { earned: 0, redeemed: 0, totalBalance: 0, lifetimeEarned: 0 };
    }
    
    let earnedSum = 0;
    let redeemedSum = 0;
    bills.forEach(b => {
      if (getCleanPhone(b.customerPhone) === receiptCustomerPhone) {
        earnedSum += (b.pointsEarned || 0);
        redeemedSum += (b.pointsRedeemed || 0);
      }
    });

    const isAlreadyInBills = bills.some(b => b.id === currentBill.id);
    if (!isAlreadyInBills) {
      earnedSum += (currentBill.pointsEarned || 0);
      redeemedSum += (currentBill.pointsRedeemed || 0);
    }

    const availableBalance = Math.max(0, earnedSum - redeemedSum);
    const totalBalance = currentBill.totalLoyaltyPoints !== undefined 
      ? currentBill.totalLoyaltyPoints 
      : availableBalance;

    return {
      earned: currentBill.pointsEarned || 0,
      redeemed: currentBill.pointsRedeemed || 0,
      totalBalance,
      lifetimeEarned: earnedSum
    };
  }, [currentBill, receiptCustomerPhone, bills]);

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
      text += `Discount / Free Reward: -₹${bill.discount}\n`;
    }
    if (bill.platformFee > 0) {
      text += `Platform Fee: +₹${bill.platformFee}\n`;
    }

    if (bill.customerPhone) {
      const cleanPhone = getCleanPhone(bill.customerPhone);
      const ptsEarned = bill.pointsEarned || 0;
      const ptsRedeemed = bill.pointsRedeemed || 0;

      let totalPts = bill.totalLoyaltyPoints;
      if (totalPts === undefined) {
        let earnedSum = 0;
        let redeemedSum = 0;
        bills.forEach(b => {
          if (getCleanPhone(b.customerPhone) === cleanPhone) {
            earnedSum += (b.pointsEarned || 0);
            redeemedSum += (b.pointsRedeemed || 0);
          }
        });
        totalPts = Math.max(0, earnedSum - redeemedSum);
      }

      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⭐ *Points Earned (This Order):* +${ptsEarned} pts\n`;
      if (ptsRedeemed > 0) {
        text += `🎁 *Points Redeemed:* -${ptsRedeemed} pts (Free Kulfi Claimed)\n`;
      }
      text += `🏆 *Total Loyalty Points Balance:* ${totalPts} pts\n`;
      if (totalPts >= 50) {
        text += `🎉 _You have ${totalPts} pts! Redeem a FREE Pot Kulfi (50 pts) or Stick Kulfi (40 pts) on your next visit!_\n`;
      } else if (totalPts >= 40) {
        text += `🎉 _You have ${totalPts} pts! Redeem a FREE Stick Kulfi (40 pts) on your next visit!_\n`;
      } else {
        text += `💡 _Earn ${40 - totalPts} more pts to claim your next FREE Kulfi!_\n`;
      }
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

    // Automatically mark bill as shared on WhatsApp
    setWhatsAppStatus(bill.id, true).catch(err => {
      console.warn("Could not auto-mark bill as WhatsApp shared:", err);
    });
  };

  // Share on WhatsApp and mark completed with visual feedback
  const handleShareAndComplete = (bill: QuickBill) => {
    triggerHaptic();
    setJustSharedId(bill.id);
    handleShareWhatsApp(bill);
    setTimeout(() => {
      setJustSharedId(prev => (prev === bill.id ? null : prev));
    }, 2500);
  };

  // Toggle WhatsApp completion state manually
  const handleToggleWhatsAppStatus = async (bill: QuickBill, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    const nextStatus = !bill.whatsappShared;
    try {
      await setWhatsAppStatus(bill.id, nextStatus);
    } catch (err) {
      console.error("Could not toggle WhatsApp status:", err);
    }
  };

  // Thermal printing handler
  const handlePrintReceipt = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className={isEmbedded ? "flex flex-col h-full w-full min-h-0 bg-[#0f172a] overflow-hidden relative z-10" : "fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"}>
      <div 
        className={isEmbedded ? "w-full h-full min-h-0 flex flex-col overflow-hidden" : `w-full max-w-5xl h-full max-h-full sm:h-[92vh] sm:max-h-[92vh] sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border flex flex-col transition-all duration-300 ${
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
            <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setModalMode('pos')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1 ${
                  modalMode === 'history' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>History ({filteredBills.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalMode('whatsapp')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                  modalMode === 'whatsapp' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp ({pendingWhatsAppCount})</span>
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

        {/* Mobile View Switcher - Non-overlapping, clean scrollable pills */}
        <div className="md:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/95 dark:bg-slate-900/95 p-1.5 gap-1.5 shrink-0 z-20 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            type="button"
            onClick={() => { setModalMode('pos'); setMobilePosTab('menu'); }}
            className={`flex-1 shrink-0 min-w-max py-1.5 px-2.5 text-center text-[10px] xs:text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalMode === 'pos' && mobilePosTab === 'menu'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <IceCream className="w-3.5 h-3.5 shrink-0" />
            <span>Flavours</span>
          </button>
          <button
            type="button"
            onClick={() => { setModalMode('pos'); setMobilePosTab('cart'); }}
            className={`flex-1 shrink-0 min-w-max py-1.5 px-2.5 text-center text-[10px] xs:text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalMode === 'pos' && mobilePosTab === 'cart'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Cart ({totalCartCount})</span>
          </button>
          {currentBill && (
            <button
              type="button"
              onClick={() => setModalMode('receipt')}
              className={`flex-1 shrink-0 min-w-max py-1.5 px-2.5 text-center text-[10px] xs:text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                modalMode === 'receipt' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>Bill</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalMode('history')}
            className={`flex-1 shrink-0 min-w-max py-1.5 px-2.5 text-center text-[10px] xs:text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalMode === 'history' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>History ({filteredBills.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setModalMode('whatsapp')}
            className={`flex-1 shrink-0 min-w-max py-1.5 px-2.5 text-center text-[10px] xs:text-[11px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalMode === 'whatsapp' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp ({pendingWhatsAppCount})</span>
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
              className={`flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 min-h-0 ${
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

              {/* Bottom spacing on mobile so menu items aren't covered */}
              <div className="h-6 md:hidden shrink-0" />
            </div>

            {/* Sticky Floating Bottom Bar on Mobile (when on Menu) */}
            {mobilePosTab === 'menu' && (
              <div className="md:hidden sticky bottom-0 left-0 right-0 z-30 p-2.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-3 shadow-2xl shrink-0">
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
                  ? 'flex-1 overflow-y-auto overscroll-contain' 
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

                {/* Customer mobile number & Loyalty Points (Mandatory) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className={phoneError ? 'text-red-500 font-black' : 'text-slate-700 dark:text-slate-300'}>
                        Customer Mobile
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
                    <span className="text-amber-500 font-bold">3 pts / kulfi</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210 (10-Digit Mobile Mandatory)"
                      value={customerPhone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCustomerPhone(val);
                        setRedeemSticks(0);
                        setRedeemPots(0);
                        if (val.length === 10) {
                          setPhoneError('');
                        }
                      }}
                      className={`w-full h-8 pl-10 pr-3 rounded-lg text-xs font-mono font-bold transition-all ${
                        phoneError
                          ? 'bg-red-500/10 border-2 border-red-500 text-red-900 dark:text-red-200 focus:outline-none ring-2 ring-red-500/30'
                          : cleanCustomerPhone.length === 10
                            ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 focus:outline-none ring-1 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-500 text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>

                  {phoneError ? (
                    <p className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  ) : customerPhone.length > 0 && customerPhone.length < 10 ? (
                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <span>⚠️ {10 - customerPhone.length} more digit{10 - customerPhone.length === 1 ? '' : 's'} required</span>
                    </p>
                  ) : null}

                  {cleanCustomerPhone.length === 10 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <span>⭐ Points Balance:</span>
                          <span className="font-mono text-sm font-black underline decoration-amber-500">{customerPointsBalance} pts</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          +{pointsEarnedThisOrder} pts this order
                        </span>
                      </div>

                      {/* Redemption controls when customer has >= 40 points */}
                      {customerPointsBalance >= 40 ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
                            <span>🎁 Redeem Loyalty Rewards</span>
                            <span className="text-slate-500 font-medium">
                              Remaining: {Math.max(0, customerPointsBalance - pointsRedeemedThisOrder)} pts
                            </span>
                          </div>

                          {/* Stick Kulfi Reward (40 pts) */}
                          {redeemSticks > 0 ? (
                            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">🍦</span>
                                <div>
                                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                                    {redeemSticks}x Free Stick Kulfi
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                    -₹{redeemSticks * stickPrice} discount ({redeemSticks * 40} pts)
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={handleRemoveStickRedemption}
                                  className="w-6 h-6 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-black text-xs flex items-center justify-center hover:bg-amber-300 cursor-pointer active:scale-95"
                                  title="Remove 1 stick reward"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center font-mono font-black text-xs text-amber-900 dark:text-amber-100">
                                  {redeemSticks}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleAddStickRedemption}
                                  disabled={customerPointsBalance - pointsRedeemedThisOrder < 40}
                                  className="w-6 h-6 rounded bg-amber-600 text-white font-black text-xs flex items-center justify-center hover:bg-amber-700 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Add another stick reward"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleAddStickRedemption}
                              disabled={customerPointsBalance - pointsRedeemedThisOrder < 40}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center justify-between cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="flex items-center gap-1.5">
                                <span>🍦</span>
                                <span>Redeem Stick Kulfi</span>
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200">
                                40 pts (Save ₹{stickPrice})
                              </span>
                            </button>
                          )}

                          {/* Pot Kulfi Reward (50 pts) */}
                          {customerPointsBalance >= 50 || redeemPots > 0 ? (
                            redeemPots > 0 ? (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">🏺</span>
                                  <div>
                                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                                      {redeemPots}x Free Pot Kulfi
                                    </span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                      -₹{redeemPots * potPrice} discount ({redeemPots * 50} pts)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={handleRemovePotRedemption}
                                    className="w-6 h-6 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-black text-xs flex items-center justify-center hover:bg-amber-300 cursor-pointer active:scale-95"
                                    title="Remove 1 pot reward"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center font-mono font-black text-xs text-amber-900 dark:text-amber-100">
                                    {redeemPots}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleAddPotRedemption}
                                    disabled={customerPointsBalance - pointsRedeemedThisOrder < 50}
                                    className="w-6 h-6 rounded bg-amber-600 text-white font-black text-xs flex items-center justify-center hover:bg-amber-700 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Add another pot reward"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleAddPotRedemption}
                                disabled={customerPointsBalance - pointsRedeemedThisOrder < 50}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center justify-between cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>🏺</span>
                                  <span>Redeem Pot Kulfi</span>
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200">
                                  50 pts (Save ₹{potPrice})
                                </span>
                              </button>
                            )
                          ) : null}

                          {/* Projected Balance After Bill */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
                            <span>Balance after this bill:</span>
                            <span className="font-mono font-black text-xs">{projectedPointsBalance} pts</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <div className="w-full h-1.5 rounded-full bg-amber-500/20 overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (customerPointsBalance / 40) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            Need {40 - customerPointsBalance} more pts to redeem a Free Stick Kulfi (40 pts) or Pot (50 pts).
                          </p>
                          <div className="flex items-center justify-between text-[10px] pt-0.5 text-slate-500 font-medium">
                            <span>Balance after this order:</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {projectedPointsBalance} pts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                  <div className="text-right space-y-0.5">
                    {discount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-500 block">
                        ₹{discount} discount applied
                      </span>
                    )}
                    {redemptionDiscount > 0 && (
                      <span className="text-[10px] font-bold text-amber-500 block">
                        🎁 Free Reward: -₹{redemptionDiscount} ({pointsRedeemedThisOrder} pts)
                      </span>
                    )}
                  </div>
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

                {/* Mandatory Mobile Notice if cart has items but mobile is missing/incomplete */}
                {cartItems.length > 0 && cleanCustomerPhone.length !== 10 && (
                  <div
                    onClick={() => {
                      setPhoneError('Customer mobile number is mandatory (10 digits required).');
                      phoneInputRef.current?.focus();
                      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      triggerHaptic();
                      playBeep(300, 200);
                    }}
                    className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-500/25 active:scale-[0.99] transition-all"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>Customer Mobile Number is Mandatory</span>
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
                      : cleanCustomerPhone.length !== 10
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-red-500/60 shadow-md'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-500/25'
                  }`}
                >
                  {isSaving ? (
                    <span>Generating Receipt...</span>
                  ) : cleanCustomerPhone.length !== 10 ? (
                    <>
                      <Smartphone className="w-4 h-4 text-red-400" />
                      <span>Enter Mobile to Complete • ₹{grandTotal}</span>
                      <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                    </>
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
              <div className="h-10 md:hidden shrink-0" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: DIGITAL RECEIPT & GOOGLE REVIEW SCREEN */}
        {/* ========================================================================= */}
        {modalMode === 'receipt' && currentBill && (
          <div style={{ WebkitOverflowScrolling: 'touch' }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
            
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
                  <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-[11px] font-sans bg-amber-500/5 -mx-2 px-2.5 rounded-lg my-1">
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Customer Mobile:</span>
                      <span className="font-mono font-bold">+91 {getCleanPhone(currentBill.customerPhone)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-amber-600 dark:text-amber-400">
                      <span>⭐ Points Earned (Current Order):</span>
                      <span className="font-mono">+{currentBill.pointsEarned || 0} pts</span>
                    </div>
                    {Boolean(currentBill.pointsRedeemed && currentBill.pointsRedeemed > 0) && (
                      <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400">
                        <span>🎁 Points Redeemed:</span>
                        <span className="font-mono">-{currentBill.pointsRedeemed} pts (Free Kulfi Claimed)</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black text-slate-900 dark:text-amber-300 pt-1 border-t border-amber-200/50 dark:border-amber-900/50">
                      <span>🏆 Total Loyalty Points Balance:</span>
                      <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                        {receiptLoyaltyData.totalBalance} pts
                      </span>
                    </div>
                    {receiptLoyaltyData.totalBalance >= 40 && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold text-center pt-0.5">
                        🎉 Available to redeem a FREE Kulfi on next visit!
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
                    <div className="flex justify-between text-emerald-500 font-bold">
                      <span>Discount / Free Reward:</span>
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
                    <span className="text-[10px] text-emerald-500 font-bold">Mandatory on Bill</span>
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
                          const newPhone = customerPhone.trim();
                          const clean = getCleanPhone(newPhone);
                          let priorEarned = 0;
                          let priorRedeemed = 0;
                          bills.forEach(b => {
                            if (b.id !== currentBill.id && getCleanPhone(b.customerPhone) === clean) {
                              priorEarned += (b.pointsEarned || 0);
                              priorRedeemed += (b.pointsRedeemed || 0);
                            }
                          });
                          const updatedTotal = Math.max(0, priorEarned - (currentBill.pointsRedeemed || 0) + (currentBill.pointsEarned || 0));
                          const updated: QuickBill = { 
                            ...currentBill, 
                            customerPhone: newPhone,
                            totalLoyaltyPoints: updatedTotal
                          };
                          setCurrentBill(updated);
                          saveBill(updated, false).catch(console.error);
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
                    onClick={() => {
                      if (currentBill) handleOpenEditBill(currentBill);
                    }}
                    className="flex-1 h-11 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Bill</span>
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
          <div style={{ WebkitOverflowScrolling: 'touch' }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
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
                      {bill.customerPhone && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-slate-400 font-mono">📱 +91 {getCleanPhone(bill.customerPhone)}</span>
                          {bill.pointsEarned !== undefined && bill.pointsEarned > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">+{bill.pointsEarned} pts</span>
                          )}
                          {bill.pointsRedeemed !== undefined && bill.pointsRedeemed > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">🎁 -{bill.pointsRedeemed} pts free</span>
                          )}
                          {bill.totalLoyaltyPoints !== undefined && (
                            <span className="text-slate-500 font-bold">(Bal: {bill.totalLoyaltyPoints} pts)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        ₹{bill.totalAmount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditBill(bill)}
                        className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
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
            <div className="h-10 md:hidden shrink-0" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: WHATSAPP BILL SHARING QUEUE */}
        {/* ========================================================================= */}
        {modalMode === 'whatsapp' && (
          <div style={{ WebkitOverflowScrolling: 'touch' }} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4">
            
            {/* Header Toolbar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    WhatsApp Share Queue
                    {pendingWhatsAppCount > 0 ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        {pendingWhatsAppCount} Pending
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        All Sent ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Send bills one-by-one. Clicking share sends on WhatsApp and moves the bill to the bottom.
                  </p>
                </div>
              </div>

              {/* Date Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    selectedDate === todayStr 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Status Filter Chips */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setWhatsappFilterStatus('all')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all ${
                    whatsappFilterStatus === 'all'
                      ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({filteredBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappFilterStatus('pending')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
                    whatsappFilterStatus === 'pending'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
                  }`}
                >
                  <span>To Send</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                    {pendingWhatsAppCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappFilterStatus('completed')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
                    whatsappFilterStatus === 'completed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                  }`}
                >
                  <span>Completed</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                    {completedWhatsAppCount}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={whatsappSearch}
                  onChange={e => setWhatsappSearch(e.target.value)}
                  placeholder="Search by bill#, mobile or flavour..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {whatsappSearch && (
                  <button
                    type="button"
                    onClick={() => setWhatsappSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Bills List matching image_8f899e6d.png */}
            <div className="space-y-2.5">
              {whatsappBills.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xl">
                    {filteredBills.length === 0 ? '🧾' : '🎉'}
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {filteredBills.length === 0 
                      ? `No bills generated on ${selectedDate}` 
                      : (whatsappFilterStatus === 'pending' ? 'All WhatsApp bills sent for today!' : 'No bills found matching search')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {whatsappFilterStatus === 'pending' && filteredBills.length > 0
                      ? `Great job! All ${completedWhatsAppCount} bills have been shared to customers.`
                      : 'Bills created at the counter will appear here ready to share.'}
                  </p>
                </div>
              ) : (
                whatsappBills.map((bill, index) => {
                  const isJustShared = justSharedId === bill.id;
                  const isFirstCompleted = bill.whatsappShared && (index === 0 || !whatsappBills[index - 1]?.whatsappShared);
                  
                  return (
                    <React.Fragment key={bill.id}>
                      {/* Section divider when viewing 'all' bills */}
                      {isFirstCompleted && whatsappFilterStatus === 'all' && (
                        <div className="pt-4 pb-1.5 flex items-center gap-3">
                          <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed & Sent on WhatsApp ({completedWhatsAppCount})
                          </span>
                          <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1" />
                        </div>
                      )}

                      <div 
                        className={`p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isJustShared
                            ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500 scale-[1.01]'
                            : bill.whatsappShared
                              ? isDark ? 'bg-slate-900/40 border-slate-800/80 opacity-75' : 'bg-slate-50/80 border-slate-200 opacity-75'
                              : isDark ? 'bg-slate-900/90 border-slate-700 shadow-md ring-1 ring-emerald-500/10' : 'bg-white border-slate-300 shadow-md'
                        }`}
                      >
                        {/* Bill Info matching image_8f899e6d.png */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
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
                            {bill.whatsappShared ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Sent ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                ⏳ To Send
                              </span>
                            )}
                          </div>

                          {/* Items summary */}
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                            {bill.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>

                          {/* Customer mobile & loyalty points */}
                          {bill.customerPhone && (
                            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] flex-wrap">
                              <span className="text-slate-400 font-mono flex items-center gap-1">
                                📱 +91 {getCleanPhone(bill.customerPhone)}
                              </span>
                              {bill.pointsEarned !== undefined && bill.pointsEarned > 0 && (
                                <span className="text-amber-500 font-bold">+{bill.pointsEarned} pts</span>
                              )}
                              {bill.pointsRedeemed !== undefined && bill.pointsRedeemed > 0 && (
                                <span className="text-emerald-500 font-bold">🎁 -{bill.pointsRedeemed} pts free</span>
                              )}
                              {bill.totalLoyaltyPoints !== undefined && (
                                <span className="text-slate-500 font-bold">(Bal: {bill.totalLoyaltyPoints} pts)</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: Amount & Actions (WITHOUT edit, receipt, or delete buttons) */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                          <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                            ₹{bill.totalAmount}
                          </span>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* WhatsApp Share Button: opens WhatsApp and moves bill to bottom */}
                            <button
                              type="button"
                              onClick={() => handleShareAndComplete(bill)}
                              className={`px-3 sm:px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                                bill.whatsappShared
                                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                              }`}
                              title="Send receipt to customer on WhatsApp & mark completed"
                            >
                              <Share2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{bill.whatsappShared ? 'Share Again' : 'Share on WhatsApp'}</span>
                            </button>

                            {/* Mark as Complete / Undo Toggle */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleWhatsAppStatus(bill, e)}
                              className={`px-2.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                                bill.whatsappShared
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                              }`}
                              title={bill.whatsappShared ? "Mark as pending / not sent" : "Mark as completed without opening WhatsApp"}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${bill.whatsappShared ? 'text-emerald-400' : 'text-slate-400'}`} />
                              <span className="hidden xs:inline">{bill.whatsappShared ? 'Done ✓' : 'Mark Done'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <div className="h-12 md:hidden shrink-0" />
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

        {/* Edit Bill Modal */}
        <EditBillModal
          bill={editingBill}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBill(null);
          }}
          onSave={handleSaveEditedBill}
          stickPrice={settings.stickPrice || 40}
          potPrice={settings.potPrice || 50}
          platePrice={settings.platePrice || 75}
          availableStickFlavours={inventory.stickFlavours?.map(f => f.name)}
          availablePotFlavours={inventory.potFlavours?.map(f => f.name)}
        />

      </div>
    </div>
  );
}
