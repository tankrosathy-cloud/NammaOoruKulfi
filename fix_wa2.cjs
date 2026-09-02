const fs = require('fs');

let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');

// The original signature at the top of the file:
// export function WhatsAppSummaryModal({ isOpen, onClose, entry, settings, inventory, expenses }: WhatsAppSummaryModalProps) {
// Wait, is there a second WhatsAppSummaryModal definition at the bottom?
let lines = wa.split('\n');
console.log(lines.map((l, i) => `${i+1}: ${l}`).filter(l => l.includes('WhatsAppSummaryModal')));

