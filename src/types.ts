export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD

  // Stick Kulfi
  stickLoaded: number;
  stickBalance: number;
  stickSold: number;

  // Plate Kulfi
  plateLoaded: number;
  plateBalance: number;
  plateSold: number;

  // Pot Kulfi
  potLoaded: number;
  potBalance: number;
  potSold: number;

  // Financials
  cashBagLoaded: number;
  cashBagTotal: number;
  phonePe: number;
  discount: number;
  
  requiredAmount: number;
  actualAmount: number;
  shortage: number;
  bonus: number;
  finalAmount: number;
  expenses: number;
  
  notes: string;
}

export interface Settings {
  stickPrice: number;
  platePrice: number;
  potPrice: number;
}
