const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export interface SpecialOrder {
  id: string;
  date: string;
  eventType: string; // e.g., 'Birthday', 'Marriage', 'Other'
  stickQuantity: number;
  potQuantity: number;
  amountReceived: number;
  notes: string;
}

export interface AppLog {
`;

code = code.replace(/export interface AppLog \{/, newTypes);
fs.writeFileSync('src/types.ts', code);
