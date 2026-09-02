-- Add Plate Kulfi Columns to existing tables
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS plate_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS plate_flavours JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS plate_loaded INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS plate_balance INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS plate_sold INT DEFAULT 0;

ALTER TABLE public.special_orders 
ADD COLUMN IF NOT EXISTS plate_quantity INT DEFAULT 0;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS enable_stick BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_pot BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_plate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_platform_fee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS expense_paid_by_names JSONB DEFAULT '["Nadeem", "Partner", "Store Cash"]'::jsonb,
ADD COLUMN IF NOT EXISTS expense_categories JSONB DEFAULT '["Wages", "Water", "Snacks", "Purchases", "Others"]'::jsonb;
