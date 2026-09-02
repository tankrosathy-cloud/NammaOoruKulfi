const fs = require('fs');

// Fix Settings.tsx import for Share2
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');
settings = settings.replace("Copy,", "Copy,\n  Share2,");
fs.writeFileSync('src/pages/Settings.tsx', settings);

// Fix types.ts
let types = fs.readFileSync('src/types.ts', 'utf-8');
types = types.replace(
  "export interface DailyDenominationsRecord {",
  "export interface DailyDenominationsRecord {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface DailyEntry {",
  "export interface DailyEntry {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface ExpenseEntry {",
  "export interface ExpenseEntry {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface ProfitWithdrawal {",
  "export interface ProfitWithdrawal {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface SpecialOrder {",
  "export interface SpecialOrder {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface InventoryStock {",
  "export interface InventoryStock {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface AppLog {",
  "export interface AppLog {\n  franchiseId?: string;"
);
types = types.replace(
  "export interface Settings {",
  "export interface Settings {\n  franchiseId?: string;"
);

fs.writeFileSync('src/types.ts', types);

// Fix AppShell.tsx
let appShell = fs.readFileSync('src/AppShell.tsx', 'utf-8');
appShell = appShell.replace("<SettingsPage role={role as any} />", "<SettingsPage role={role as 'owner' | 'staff'} />");
// Let's check what role SettingsPage expects in Settings.tsx
