import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, text, timestamp, date as pgDate, jsonb } from 'drizzle-orm/pg-core';

export const franchises = pgTable('franchises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique(),
  ownerId: text('owner_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email'),
  name: text('name'),
  role: text('role'),
  franchiseId: text('franchise_id').references(() => franchises.id),
});

export const entries = pgTable('entries', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  date: pgDate('date').notNull(),
  stickLoaded: integer('stick_loaded').default(0),
  stickBalance: integer('stick_balance').default(0),
  stickSold: integer('stick_sold').default(0),
  potLoaded: integer('pot_loaded').default(0),
  potBalance: integer('pot_balance').default(0),
  potSold: integer('pot_sold').default(0),
  cashBagLoaded: numeric('cash_bag_loaded').default('0'),
  cashBagTotal: numeric('cash_bag_total').default('0'),
  phonePe: numeric('phone_pe').default('0'),
  discount: numeric('discount').default('0'),
  requiredAmount: numeric('required_amount').default('0'),
  actualAmount: numeric('actual_amount').default('0'),
  shortage: numeric('shortage').default('0'),
  bonus: numeric('bonus').default('0'),
  finalAmount: numeric('final_amount').default('0'),
  expenses: numeric('expenses').default('0'),
  additionalExpenses: numeric('additional_expenses').default('0'),
  expenseDetails: text('expense_details'),
  notes: text('notes'),
  denominations: jsonb('denominations'),
  userId: text('user_id').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const dailyDenominations = pgTable('daily_denominations', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  date: pgDate('date').notNull(),
  denominations: jsonb('denominations').notNull(),
  total: numeric('total').default('0'),
  updatedBy: text('updated_by').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  date: pgDate('date').notNull(),
  paidBy: text('paid_by'),
  category: text('category'),
  title: text('title'),
  amount: numeric('amount').notNull(),
  notes: text('notes'),
  userId: text('user_id').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const profitWithdrawals = pgTable('profit_withdrawals', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  date: pgDate('date').notNull(),
  amount: numeric('amount').notNull(),
  notes: text('notes'),
  withdrawnBy: text('withdrawn_by'),
  month: text('month'),
  userId: text('user_id').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const specialOrders = pgTable('special_orders', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  date: pgDate('date').notNull(),
  eventType: text('event_type'),
  stickQuantity: integer('stick_quantity').default(0),
  potQuantity: integer('pot_quantity').default(0),
  amountReceived: numeric('amount_received').default('0'),
  notes: text('notes'),
  userId: text('user_id').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  stickPrice: numeric('stick_price'),
  potPrice: numeric('pot_price'),
  platePrice: numeric('plate_price'),
  monthlyGoal: numeric('monthly_goal'),
  expensePaidByNames: text('expense_paid_by_names').array(),
  expenseCategories: text('expense_categories').array(),
});

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  stickQuantity: integer('stick_quantity').default(0),
  potQuantity: integer('pot_quantity').default(0),
  stickFlavours: jsonb('stick_flavours'),
  potFlavours: jsonb('pot_flavours'),
  lastUpdatedDate: pgDate('last_updated_date'),
  userId: text('user_id').references(() => users.uid),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const logs = pgTable('logs', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').references(() => franchises.id),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  userEmail: text('user_email'),
  action: text('action'),
  details: text('details'),
  deletedPayload: text('deleted_payload'),
});
