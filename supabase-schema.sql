-- SUPABASE POSTGRESQL SCHEMA WITH FRANCHISE MULTI-TENANCY (RLS)
-- You can run this directly in the Supabase SQL Editor.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Franchises Table
CREATE TABLE public.franchises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Users Table (Extension of Supabase Auth)
CREATE TABLE public.users (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    role TEXT CHECK (role IN ('owner', 'staff')),
    franchise_id TEXT REFERENCES public.franchises(id)
);

-- 4. App Tables
CREATE TABLE public.entries (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    date DATE NOT NULL,
    stick_loaded INTEGER DEFAULT 0,
    stick_balance INTEGER DEFAULT 0,
    stick_sold INTEGER DEFAULT 0,
    pot_loaded INTEGER DEFAULT 0,
    pot_balance INTEGER DEFAULT 0,
    pot_sold INTEGER DEFAULT 0,
    cash_bag_loaded NUMERIC DEFAULT 0,
    cash_bag_total NUMERIC DEFAULT 0,
    phone_pe NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    required_amount NUMERIC DEFAULT 0,
    actual_amount NUMERIC DEFAULT 0,
    shortage NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    final_amount NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    additional_expenses NUMERIC DEFAULT 0,
    expense_details TEXT,
    notes TEXT,
    denominations JSONB,
    user_id UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.daily_denominations (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    date DATE NOT NULL,
    denominations JSONB NOT NULL,
    total NUMERIC DEFAULT 0,
    updated_by UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.expenses (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    date DATE NOT NULL,
    paid_by TEXT,
    category TEXT,
    title TEXT,
    amount NUMERIC NOT NULL,
    notes TEXT,
    user_id UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.profit_withdrawals (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    withdrawn_by TEXT,
    month TEXT,
    user_id UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.special_orders (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    date DATE NOT NULL,
    event_type TEXT,
    stick_quantity INTEGER DEFAULT 0,
    pot_quantity INTEGER DEFAULT 0,
    amount_received NUMERIC DEFAULT 0,
    notes TEXT,
    user_id UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.settings (
    id TEXT PRIMARY KEY, -- use 'global' or franchise_id
    franchise_id TEXT REFERENCES public.franchises(id),
    stick_price NUMERIC,
    pot_price NUMERIC,
    plate_price NUMERIC,
    monthly_goal NUMERIC,
    expense_paid_by_names TEXT[],
    expense_categories TEXT[],
    enable_stick BOOLEAN DEFAULT TRUE,
    enable_pot BOOLEAN DEFAULT TRUE,
    enable_plate BOOLEAN DEFAULT TRUE,
    enable_platform_fee BOOLEAN DEFAULT FALSE,
    platform_fee NUMERIC
);

CREATE TABLE public.inventory (
    id TEXT PRIMARY KEY, -- use 'global' or franchise_id
    franchise_id TEXT REFERENCES public.franchises(id),
    stick_quantity INTEGER DEFAULT 0,
    pot_quantity INTEGER DEFAULT 0,
    stick_flavours JSONB,
    pot_flavours JSONB,
    last_updated_date DATE,
    user_id UUID REFERENCES public.users(uid),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.logs (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_email TEXT,
    action TEXT,
    details TEXT,
    deleted_payload TEXT
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_denominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Helper Function to get user's franchise_id
CREATE OR REPLACE FUNCTION get_current_user_franchise_id()
RETURNS TEXT AS $$
  SELECT franchise_id FROM public.users WHERE uid = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Users can read their own profile"
ON public.users FOR SELECT USING (uid = auth.uid());

CREATE POLICY "Users can read profiles in their franchise"
ON public.users FOR SELECT USING (franchise_id = get_current_user_franchise_id());

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE USING (uid = auth.uid());

-- Franchises Table Policies
CREATE POLICY "Users can read their own franchise"
ON public.franchises FOR SELECT USING (id = get_current_user_franchise_id());

CREATE POLICY "Anyone can create a franchise"
ON public.franchises FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Franchise owners can update their franchise"
ON public.franchises FOR UPDATE USING (owner_id = auth.uid());

-- Function to generate standard policies for franchise-isolated tables
CREATE OR REPLACE FUNCTION create_franchise_policies(table_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Read own franchise %1$s" ON public.%1$s
        FOR SELECT USING (franchise_id = get_current_user_franchise_id());
        
        CREATE POLICY "Insert own franchise %1$s" ON public.%1$s
        FOR INSERT WITH CHECK (franchise_id = get_current_user_franchise_id());
        
        CREATE POLICY "Update own franchise %1$s" ON public.%1$s
        FOR UPDATE USING (franchise_id = get_current_user_franchise_id());
        
        CREATE POLICY "Delete own franchise %1$s" ON public.%1$s
        FOR DELETE USING (franchise_id = get_current_user_franchise_id());
    ', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply standard franchise policies to most tables
SELECT create_franchise_policies('entries');
SELECT create_franchise_policies('daily_denominations');
SELECT create_franchise_policies('expenses');
SELECT create_franchise_policies('profit_withdrawals');
SELECT create_franchise_policies('special_orders');
SELECT create_franchise_policies('logs');

-- Settings & Inventory Policies (Support 'global' fallback)
CREATE POLICY "Read settings" ON public.settings
FOR SELECT USING (franchise_id = get_current_user_franchise_id() OR id = 'global');

CREATE POLICY "Write settings" ON public.settings
FOR ALL USING (franchise_id = get_current_user_franchise_id() OR id = 'global');

CREATE POLICY "Read inventory" ON public.inventory
FOR SELECT USING (franchise_id = get_current_user_franchise_id() OR id = 'global');

CREATE POLICY "Write inventory" ON public.inventory
FOR ALL USING (franchise_id = get_current_user_franchise_id() OR id = 'global');
