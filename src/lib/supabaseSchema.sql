-- ===================================================================
-- NAMMA OORU KULFI - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION
-- Run this SQL in your Supabase Project: SQL Editor -> New Query -> Run
-- ===================================================================

-- 1. Daily Sales Entries Table
CREATE TABLE IF NOT EXISTS public.entries (
    id TEXT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    stick_loaded INT DEFAULT 0,
    stick_balance INT DEFAULT 0,
    stick_sold INT DEFAULT 0,
    pot_loaded INT DEFAULT 0,
    pot_balance INT DEFAULT 0,
    pot_sold INT DEFAULT 0,
    cash_bag_loaded NUMERIC(10, 2) DEFAULT 0,
    cash_bag_total NUMERIC(10, 2) DEFAULT 0,
    phone_pe NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    bonus NUMERIC(10, 2) DEFAULT 0,
    required_amount NUMERIC(10, 2) DEFAULT 0,
    actual_amount NUMERIC(10, 2) DEFAULT 0,
    shortage NUMERIC(10, 2) DEFAULT 0,
    final_amount NUMERIC(10, 2) DEFAULT 0,
    expenses NUMERIC(10, 2) DEFAULT 0,
    additional_expenses NUMERIC(10, 2) DEFAULT 0,
    expense_details TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    denominations JSONB DEFAULT '{}'::jsonb,
    user_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- In case public.entries already exists without the column:
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS denominations JSONB DEFAULT '{}'::jsonb;

-- 2. Standalone Business Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    paid_by TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    title TEXT DEFAULT '',
    user_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Bulk Event / Special Orders Table
CREATE TABLE IF NOT EXISTS public.special_orders (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    event_type TEXT NOT NULL,
    stick_quantity INT DEFAULT 0,
    pot_quantity INT DEFAULT 0,
    amount_received NUMERIC(10, 2) DEFAULT 0,
    notes TEXT DEFAULT '',
    user_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Central Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY DEFAULT 'global',
    stick_quantity INT DEFAULT 0,
    pot_quantity INT DEFAULT 0,
    stick_flavours JSONB DEFAULT '[]'::jsonb,
    pot_flavours JSONB DEFAULT '[]'::jsonb,
    last_updated_date DATE DEFAULT CURRENT_DATE,
    user_id TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Business Settings & Target Goals Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    stick_price NUMERIC(10, 2) DEFAULT 40,
    pot_price NUMERIC(10, 2) DEFAULT 50,
    plate_price NUMERIC(10, 2) DEFAULT 75,
    monthly_goal NUMERIC(12, 2) DEFAULT 150000,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Profit Withdrawals Table
CREATE TABLE IF NOT EXISTS public.profit_withdrawals (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    withdrawn_by TEXT NOT NULL,
    notes TEXT DEFAULT '',
    month TEXT DEFAULT '',
    user_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.app_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_email TEXT DEFAULT '',
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    deleted_payload TEXT DEFAULT ''
);

-- Enable Row Level Security (RLS) and allow public read/write for client application
-- Grant Schema and Table Access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Row Level Security & Policies
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access Entries" ON public.entries;
CREATE POLICY "Public Access Entries" ON public.entries FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Expenses" ON public.expenses;
CREATE POLICY "Public Access Expenses" ON public.expenses FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Special Orders" ON public.special_orders;
CREATE POLICY "Public Access Special Orders" ON public.special_orders FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Inventory" ON public.inventory;
CREATE POLICY "Public Access Inventory" ON public.inventory FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Settings" ON public.settings;
CREATE POLICY "Public Access Settings" ON public.settings FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Profit Withdrawals" ON public.profit_withdrawals;
CREATE POLICY "Public Access Profit Withdrawals" ON public.profit_withdrawals FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access App Logs" ON public.app_logs;
CREATE POLICY "Public Access App Logs" ON public.app_logs FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- Enable Realtime for all tables (Idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries, public.expenses, public.special_orders, public.inventory, public.settings;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Seed Global Default Settings
INSERT INTO public.settings (id, stick_price, pot_price, plate_price, monthly_goal)
VALUES ('global', 40, 50, 75, 150000)
ON CONFLICT (id) DO UPDATE SET 
    stick_price = EXCLUDED.stick_price,
    pot_price = EXCLUDED.pot_price,
    monthly_goal = EXCLUDED.monthly_goal;

-- Seed Global Inventory
INSERT INTO public.inventory (id, stick_quantity, pot_quantity, last_updated_date, stick_flavours, pot_flavours)
VALUES (
    'global',
    771,
    28,
    '2026-08-23',
    '[{"name": "Pista badam", "quantity": 22}]'::jsonb,
    '[{"name": "Badam", "quantity": 0}, {"name": "Pistha", "quantity": 12}, {"name": "Pistha badam", "quantity": 12}, {"name": "Shahi gulab", "quantity": 24}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    stick_quantity = EXCLUDED.stick_quantity,
    pot_quantity = EXCLUDED.pot_quantity;

-- Seed Special Orders
INSERT INTO public.special_orders (id, date, event_type, stick_quantity, pot_quantity, amount_received, notes)
VALUES ('special-2026-08-15-1', '2026-08-15', 'Special Order / Bulk Catering', 50, 7, 2376, 'August Special Order')
ON CONFLICT (id) DO NOTHING;

-- Seed August Standalone Expenses
INSERT INTO public.expenses (id, date, category, amount, paid_by, notes) VALUES
('exp-2026-08-08-1', '2026-08-08', 'Food', 175, 'Nadeem', ''),
('exp-2026-08-08-2', '2026-08-08', 'Others', 300, 'Nadeem', ''),
('exp-2026-08-09-1', '2026-08-09', 'Food', 50, 'Nadeem', '50'),
('exp-2026-08-11-1', '2026-08-11', 'Supplies', 15717, 'Nadeem', 'Nok order bill'),
('exp-2026-08-13-1', '2026-08-13', 'Others', 40, 'Nadeem', 'plug'),
('exp-2026-08-17-1', '2026-08-17', 'Others', 20, 'Nadeem', 'Insect chock piece'),
('exp-2026-08-17-2', '2026-08-17', 'Supplies', 18105, 'Nadeem', 'Nok bill'),
('exp-2026-08-19-1', '2026-08-19', 'Others', 9125, 'Nadeem', 'Chit'),
('exp-2026-08-21-1', '2026-08-21', 'Food', 950, 'Nadeem', 'Kfc'),
('exp-2026-08-22-1', '2026-08-22', 'Supplies', 500, 'Nadeem', 'Cover'),
('exp-2026-08-22-2', '2026-08-22', 'Food', 65, 'Nadeem', ''),
('exp-2026-08-22-3', '2026-08-22', 'Supplies', 300, 'Nadeem', ''),
('1787471811531', '2026-08-23', 'Others', 250, 'Nadeem', 'Phonepe rent')
ON CONFLICT (id) DO NOTHING;

-- Seed August 1 to 23 Daily Entries
INSERT INTO public.entries (id, date, stick_loaded, stick_balance, stick_sold, pot_loaded, pot_balance, pot_sold, cash_bag_loaded, cash_bag_total, phone_pe, discount, required_amount, actual_amount, shortage, final_amount, expenses, notes) VALUES
('entry-2026-08-01', '2026-08-01', 238, 74, 164, 7, 0, 7, 1255, 3330, 4760, 60, 8090, 8090, 0, 8090, 15, ''),
('entry-2026-08-02', '2026-08-02', 356, 111, 245, 24, 16, 8, 1245, 4720, 6640, 55, 11375, 11360, 15, 11360, 15, ''),
('entry-2026-08-03', '2026-08-03', 292, 163, 129, 16, 11, 5, 1260, 3350, 3130, 180, 6475, 6480, -5, 6480, 15, ''),
('entry-2026-08-04', '2026-08-04', 187, 94, 93, 11, 4, 7, 1300, 3265, 2050, 40, 5315, 5315, 0, 5315, 15, 'Raj 20 alt'),
('entry-2026-08-05', '2026-08-05', 196, 99, 97, 4, 0, 4, 1245, 1340, 3990, 0, 5310, 5330, -20, 5330, 15, ''),
('entry-2026-08-06', '2026-08-06', 184, 103, 81, 12, 6, 6, 1265, 3500, 1250, 40, 4750, 4750, 0, 4750, 15, 'Raj 20 alt'),
('entry-2026-08-07', '2026-08-07', 201, 127, 74, 18, 11, 7, 1255, 2460, 1940, 110, 4440, 4400, 40, 4400, 15, 'Friend 50'),
('entry-2026-08-08', '2026-08-08', 210, 67, 143, 11, 3, 8, 1355, 4060, 3370, 50, 7410, 7430, -20, 7430, 15, 'Friend 50'),
('entry-2026-08-09', '2026-08-09', 229, 63, 166, 15, 0, 15, 1250, 4885, 3720, 0, 8625, 8605, 20, 8605, 15, ''),
('entry-2026-08-10', '2026-08-10', 211, 131, 80, 12, 8, 4, 1265, 2010, 2620, 20, 4630, 4630, 0, 4630, 15, 'Coffee'),
('entry-2026-08-11', '2026-08-11', 179, 113, 66, 8, 7, 1, 1320, 2385, 1600, 0, 3995, 3985, 10, 3985, 15, ''),
('entry-2026-08-12', '2026-08-12', 197, 113, 84, 7, 1, 6, 1505, 3440, 1690, 20, 5130, 5130, 0, 5130, 15, ''),
('entry-2026-08-13', '2026-08-13', 161, 96, 65, 1, 0, 1, 1540, 2890, 1270, 0, 4175, 4160, 15, 4160, 15, ''),
('entry-2026-08-14', '2026-08-14', 222, 157, 65, 0, 0, 0, 1485, 2830, 1200, 0, 4070, 4030, 40, 4030, 15, ''),
('entry-2026-08-15', '2026-08-15', 250, 47, 203, 0, 0, 0, 1350, 5055, 4150, 250, 9205, 9205, 0, 9205, 15, ''),
('entry-2026-08-16', '2026-08-16', 251, 47, 204, 0, 0, 0, 1405, 4770, 4700, 80, 9470, 9470, 0, 9470, 15, 'Raj 40 friend'),
('entry-2026-08-17', '2026-08-17', 179, 102, 77, 0, 0, 0, 1500, 2695, 1740, 70, 4495, 4435, 60, 4435, 15, 'Friend 40'),
('entry-2026-08-18', '2026-08-18', 225, 125, 100, 0, 0, 0, 1695, 3590, 2070, 60, 5620, 5660, -40, 5660, 15, 'Friend 40'),
('entry-2026-08-19', '2026-08-19', 191, 100, 91, 0, 0, 0, 1440, 2925, 2060, 80, 4985, 4985, 0, 4985, 15, 'Friend 40'),
('entry-2026-08-20', '2026-08-20', 173, 116, 57, 0, 0, 0, 1225, 2350, 1080, 0, 3430, 3430, 0, 3430, 15, 'KASTHURI BAKES 20-FRIEND 40'),
('POPrwnRfnGCuz2DcZ2D1', '2026-08-21', 201, 35, 166, 0, 0, 0, 1450, 4875, 3200, 0, 8075, 8075, 0, 8075, 15, ''),
('entry-2026-08-22', '2026-08-22', 287, 142, 145, 0, 0, 0, 1505, 3770, 3460, 20, 7270, 7230, 40, 7230, 15, ''),
('entry-2026-08-23', '2026-08-23', 0, 0, 0, 0, 0, 0, 1370, 0, 0, 0, 1370, 0, 1370, 0, 0, '')
ON CONFLICT (id) DO UPDATE SET
    stick_loaded = EXCLUDED.stick_loaded,
    stick_balance = EXCLUDED.stick_balance,
    stick_sold = EXCLUDED.stick_sold,
    cash_bag_loaded = EXCLUDED.cash_bag_loaded,
    cash_bag_total = EXCLUDED.cash_bag_total,
    phone_pe = EXCLUDED.phone_pe,
    actual_amount = EXCLUDED.actual_amount,
    shortage = EXCLUDED.shortage,
    final_amount = EXCLUDED.final_amount,
    expenses = EXCLUDED.expenses,
    updated_at = NOW();
