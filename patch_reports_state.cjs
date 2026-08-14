const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// 1. Add state variables
const newStates = `
  const { specialOrders } = useSpecialOrders();
  const { inventory } = useInventory();
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialDeleteConfirmId, setSpecialDeleteConfirmId] = useState<string | null>(null);
  const [specialForm, setSpecialForm] = useState({ eventType: 'Party', stickQuantity: '', potQuantity: '', amountReceived: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
`;
code = code.replace(
  /const \[profitForm, setProfitForm\].*;\s*/,
  (match) => match + newStates
);

// Update activeListTab type hack
code = code.replace(
  /useState<'entries' \| 'expenses' \| 'profits'>/,
  "useState<string>"
);

// 2. Update useMemo
// Add filteredSpecialOrders
const useMemoRepl = `
    const filteredSpecials = specialOrders.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    }).sort((a, b) => b.date.localeCompare(a.date));
`;
code = code.replace(
  /const filtered = entries\.filter\(e => \{/,
  useMemoRepl + "\n    const filtered = entries.filter(e => {"
);

// Add to totals
const totalsAdd = `
    // Add special orders to revenue and items sold
    filteredSpecials.forEach(order => {
      totals.revenue += order.amountReceived;
      totals.stickSold += order.stickQuantity;
      totals.potSold += order.potQuantity;
    });
`;
code = code.replace(
  /\/\/ Add standalone expenses to totals for owner only/,
  totalsAdd + "\n    // Add standalone expenses to totals for owner only"
);

// Export from useMemo
code = code.replace(
  /filteredProfits: filteredProfs, chartData/,
  "filteredProfits: filteredProfs, filteredSpecials, chartData"
);
code = code.replace(
  /profitWithdrawals, currentDate\]\);/,
  "profitWithdrawals, specialOrders, currentDate]);"
);

// 3. Add Handlers
const handlers = `
  const handleSpecialSubmit = async () => {
    if (!specialForm.amountReceived) return;
    try {
      await saveSpecialOrder({
        id: Date.now().toString(),
        date: specialForm.date,
        eventType: specialForm.eventType,
        stickQuantity: Number(specialForm.stickQuantity) || 0,
        potQuantity: Number(specialForm.potQuantity) || 0,
        amountReceived: Number(specialForm.amountReceived),
        notes: specialForm.notes
      }, inventory);
      setShowSpecialModal(false);
      setSpecialForm({ eventType: 'Party', stickQuantity: '', potQuantity: '', amountReceived: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSpecial = async (order: SpecialOrder) => {
    await deleteSpecialOrder(order, inventory);
    setSpecialDeleteConfirmId(null);
  };
`;
code = code.replace(
  /const handleDeleteProfit = async.*?setProfitDeleteConfirmId\(null\);\s*\};/s,
  (match) => match + "\n" + handlers
);

fs.writeFileSync('src/pages/Reports.tsx', code);
