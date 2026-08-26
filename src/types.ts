export interface Denominations {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export interface DailyDenominationsRecord {
  id?: string;
  date: string;
  denominations: Denominations;
  total: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD

  // Stick Kulfi
  stickLoaded: number;
  stickBalance?: number;
  stickSold: number;

  // Pot Kulfi
  potLoaded: number;
  potBalance?: number;
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
  
  denominations?: Denominations;

  notes: string;
  userId?: string;
  updatedAt?: string;
}

export interface Settings {
  stickPrice: number;
  potPrice: number;
  platePrice?: number;
  monthlyGoal?: number;
}

export interface InventoryStock {
  id: string;
  stickQuantity: number;
  potQuantity: number;
  lastUpdatedDate?: string;
  stickFlavours?: { name: string; quantity: number }[];
  potFlavours?: { name: string; quantity: number }[];
  userId?: string;
  updatedAt?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  paidBy: string;
  category: string;
  amount: number;
  notes: string;
  title?: string;
  userId?: string;
  updatedAt?: string;
}

export interface ProfitWithdrawal {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes: string;
  withdrawnBy?: string;
  month?: string;
  userId?: string;
  updatedAt?: string;
}

export interface SpecialOrder {
  id: string;
  date: string;
  eventType: string; // e.g., 'Birthday', 'Marriage', 'Other'
  stickQuantity: number;
  potQuantity: number;
  amountReceived: number;
  notes: string;
  userId?: string;
  updatedAt?: string;
}

export interface AppLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
  deletedPayload?: string; // Serialized JSON of the deleted item
}
