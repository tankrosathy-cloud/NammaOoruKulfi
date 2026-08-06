import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Add states
content = content.replace("const [isEditingInventory, setIsEditingInventory] = useState(false);",
`const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedInvoice, setParsedInvoice] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);`);

// Add upload handler
const uploadHandler = `
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
`;

content = content.replace("const startInventoryEdit = () => {", uploadHandler + "\n  const startInventoryEdit = () => {");

fs.writeFileSync('src/pages/Settings.tsx', content);
