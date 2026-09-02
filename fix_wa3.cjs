const fs = require('fs');

let wa = fs.readFileSync('src/components/WhatsAppSummaryModal.tsx', 'utf-8');

// The franchise object is inside `generateWhatsAppClosingText` which is a pure function.
// We should pass `franchiseName` to it.

wa = wa.replace(
  "export function generateWhatsAppClosingText(\n  entry: DailyEntry,\n  inventory?: InventoryStock | null,\n  settings?: Settings | null\n): string {",
  "export function generateWhatsAppClosingText(\n  entry: DailyEntry,\n  inventory?: InventoryStock | null,\n  settings?: Settings | null,\n  franchiseName?: string\n): string {"
);

wa = wa.replace(
  "📍 *${franchise?.name || 'Franchise'} Cart Operations*",
  "📍 *${franchiseName || 'Franchise'} Cart Operations*"
);

wa = wa.replace(
  "const message = generateWhatsAppClosingText(entry, inventory, settings);",
  "const message = generateWhatsAppClosingText(entry, inventory, settings, franchise?.name);"
);

fs.writeFileSync('src/components/WhatsAppSummaryModal.tsx', wa);

