export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD

  // Stick Kulfi
  stickLoaded: number;
  stickBalance: number;
  stickSold: number;

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
  additionalExpenses?: number;
  expenseDetails?: string;
  
  notes: string;
}

export interface Settings {
  stickPrice: number;
  potPrice: number;
  monthlyGoal?: number;
}

export interface InventoryStock {
  id: string;
  stickQuantity: number;
  potQuantity: number;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  paidBy: string;
  category: string;
  amount: number;
  notes: string;
}

export interface AppLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
}
