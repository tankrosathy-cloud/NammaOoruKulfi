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
  franchiseId?: string;
  id?: string;
  date: string;
  denominations: Denominations;
  total: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface DailyEntry {
  franchiseId?: string;
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
  // Plate Kulfi
  plateLoaded?: number;
  plateBalance?: number;
  plateSold?: number;

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
  franchiseId?: string;
  enableStick?: boolean;
  enablePot?: boolean;
  enablePlate?: boolean;
  enablePlatformFee?: boolean;
  stickPrice: number;
  potPrice: number;
  platePrice: number;
  platformFee?: number;
  monthlyGoal?: number;
  expensePaidByNames?: string[];
  expenseCategories?: string[];
}

export interface InventoryStock {
  franchiseId?: string;
  id: string;
  stickQuantity: number;
  potQuantity: number;
  plateQuantity?: number;
  lastUpdatedDate?: string;
  stickFlavours?: { name: string; quantity: number }[];
  potFlavours?: { name: string; quantity: number }[];
  plateFlavours?: { name: string; quantity: number }[];
  userId?: string;
  updatedAt?: string;
}

export interface ExpenseEntry {
  franchiseId?: string;
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
  franchiseId?: string;
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
  franchiseId?: string;
  id: string;
  date: string;
  eventType: string; // e.g., 'Birthday', 'Marriage', 'Other'
  stickQuantity: number;
  potQuantity: number;
  plateQuantity?: number;
  amountReceived: number;
  notes: string;
  userId?: string;
  updatedAt?: string;
}

export interface AppLog {
  franchiseId?: string;
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
  deletedPayload?: string; // Serialized JSON of the deleted item
}

export type UserRole = 'owner' | 'manager' | 'staff' | 'superadmin';

export interface UserProfile {
  uid: string;
  email: string;
  franchiseId: string;
  role: UserRole;
  name?: string;
  phone?: string;
}

export interface Franchise {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}
