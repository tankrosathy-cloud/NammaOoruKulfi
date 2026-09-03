import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Server,
  Zap,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  FileCode,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  testSupabaseConnection,
  cleanSupabaseUrl,
  cleanSupabaseKey,
  validateSupabaseInputs,
} from '../lib/supabase';
import { migrateAllDataToSupabase } from '../lib/supabaseService';
import { useEntries, useExpenses, useSpecialOrders, useInventory, useSettings, useSync } from '../store';

const SQL_SCHEMA_SNIPPET = `-- ===================================================================
-- NAMMA OORU KULFI - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION
-- Run this in Supabase: SQL Editor -> New Query -> Paste & Click Run
-- ===================================================================

-- 1. Daily Sales Entries Table
CREATE TABLE IF NOT EXISTS public.entries (
    id TEXT PRIMARY KEY,
    franchise_id TEXT,
    date DATE NOT NULL,
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
    user_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- Schema & Table Permissions for Anonymous & Authenticated Client Access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS) & Public Policies
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

-- Enable Realtime Safely (Does not fail if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries, public.expenses, public.special_orders, public.inventory, public.settings;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Seed Global Default Settings & Inventory
INSERT INTO public.settings (id, stick_price, pot_price, plate_price, monthly_goal)
VALUES ('global', 40, 50, 75, 150000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory (id, stick_quantity, pot_quantity, last_updated_date, stick_flavours, pot_flavours)
VALUES ('global', 0, 0, '2026-08-23', '[{"name": "Pista badam", "quantity": 0}]'::jsonb, '[{"name": "Badam", "quantity": 0}, {"name": "Pistha", "quantity": 0}, {"name": "Pistha badam", "quantity": 0}, {"name": "Shahi gulab", "quantity": 0}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- MIGRATION: Fix Unique Constraint for Multi-Franchise Support
-- Run this if you are getting duplicate key errors when saving entries
-- for the same date across different franchises
-- ===================================================================
DO $$ 
BEGIN
  -- Drop the old unique constraint on date alone
  ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_date_key;
  
  -- Add a new composite unique constraint on (date, franchise_id)
  -- This allows each franchise to have its own entry for a given date
  ALTER TABLE public.entries ADD CONSTRAINT entries_date_franchise_id_key UNIQUE (date, franchise_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint migration already applied or constraint not found';
END $$;
`;

export default function SupabaseManager() {
  const { entries } = useEntries();
  const { expenses } = useExpenses();
  const { specialOrders } = useSpecialOrders();
  const { inventory } = useInventory();
  const { settings } = useSettings();
  const { syncNow, databaseType } = useSync();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableCounts?: Record<string, number>; errorDetails?: string } | null>(null);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    const cleaned = cleanSupabaseUrl(creds.url);
    if (cleaned && cleaned !== creds.url) {
      saveSupabaseCredentials(cleaned, creds.anonKey);
      setUrl(cleaned);
    } else {
      setUrl(creds.url);
    }
    setAnonKey(creds.anonKey);
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      testSupabaseConnection().then((res) => {
        setTestResult(res);
      }).catch(() => {});
    }
  }, []);

  const handleSaveAndTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = cleanSupabaseKey(anonKey);
    
    // Update state to cleaned version
    setUrl(cleanedUrl);
    setAnonKey(cleanedKey);

    const validation = validateSupabaseInputs(cleanedUrl, cleanedKey);
    if (!validation.isValid) {
      setTestResult({ 
        success: false, 
        message: validation.warning || 'Please check your Supabase URL and Anon Key.',
        errorDetails: `Entered URL: "${url}". Expected format: "https://<your-project-ref>.supabase.co"`
      });
      return;
    }

    saveSupabaseCredentials(cleanedUrl, cleanedKey);
    setIsConfigured(isSupabaseConfigured());

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        await syncNow();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Error testing connection: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoFixUrl = () => {
    const cleaned = cleanSupabaseUrl(url);
    if (cleaned) {
      setUrl(cleaned);
    }
  };

  const handleDisconnect = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setIsConfigured(false);
    setTestResult(null);
    setMigrationStatus(null);
    syncNow();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleMigrateAll = async () => {
    if (!isSupabaseConfigured()) {
      setMigrationStatus('Please save and test your Supabase connection first.');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('Transferring entries, expenses, special orders, and inventory to Supabase...');

    try {
      const res = await migrateAllDataToSupabase({
        entries,
        expenses,
        specialOrders,
        inventory,
        settings,
      });

      setMigrationStatus(res.message);
      await syncNow();
      const testRes = await testSupabaseConnection();
      setTestResult(testRes);
    } catch (err: any) {
      setMigrationStatus(`Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6" id="supabase-manager-card">
      {/* 1. Database Connection Status Header */}
      <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-emerald-950 dark:text-emerald-100">
                    Supabase PostgreSQL Database
                  </h2>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                    isConfigured && testResult?.success 
                      ? 'bg-emerald-600 text-white' 
                      : isConfigured 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-200'
                  }`}>
                    {isConfigured && testResult?.success ? 'Connected & Active' : isConfigured ? 'Configured' : 'Ready to Connect'}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300 font-medium">
                  {isConfigured
                    ? 'Your NammaOoruKulfi app is linked to your free Supabase PostgreSQL database.'
                    : 'Easily connect your free Supabase project to migrate away from Firestore with zero discrepancies.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveAndTest()}
                disabled={isTesting}
                className="w-full sm:w-auto border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </div>

          {/* Test connection report banner */}
          {testResult && (
            <div className={`mt-4 p-4 rounded-xl text-xs font-semibold flex flex-col gap-2 ${
              testResult.success 
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700' 
                : 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.tableCounts && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <div>Daily Entries: <strong className="text-emerald-950 dark:text-white">{testResult.tableCounts.entries ?? 0}</strong></div>
                  <div>Expenses: <strong className="text-emerald-950 dark:text-white">{testResult.tableCounts.expenses ?? 0}</strong></div>
                  <div>Special Orders: <strong className="text-emerald-950 dark:text-white">{testResult.tableCounts.special_orders ?? 0}</strong></div>
                  <div>Inventory: <strong className="text-emerald-950 dark:text-white">{testResult.tableCounts.inventory ?? 0}</strong></div>
                  <div>Settings: <strong className="text-emerald-950 dark:text-white">{testResult.tableCounts.settings ?? 0}</strong></div>
                </div>
              )}
              {testResult.errorDetails && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-800 text-[10px] text-rose-800/90 dark:text-rose-300 font-mono break-all">
                  Details: {testResult.errorDetails}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Supabase Credentials Input Form */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" /> 1. Connect Supabase Project
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Obtain your free Supabase URL & Public Anon Key from{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 underline font-bold inline-flex items-center gap-0.5"
                >
                  supabase.com/dashboard <ExternalLink className="w-3 h-3" />
                </a>{' '}
                (Settings → API).
              </p>
            </div>
            {isConfigured && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold"
              >
                Disconnect
              </Button>
            )}
          </div>

          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supabase-url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Supabase Project URL
                  </Label>
                  {url && url !== cleanSupabaseUrl(url) && (
                    <button
                      type="button"
                      onClick={handleAutoFixUrl}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Fix to .supabase.co
                    </button>
                  )}
                </div>
                <Input
                  id="supabase-url"
                  placeholder="https://your-project-ref.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => {
                    const cleaned = cleanSupabaseUrl(url);
                    if (cleaned && cleaned !== url) setUrl(cleaned);
                  }}
                  className="font-mono text-xs"
                />
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-muted-foreground">
                    Must end with <code className="text-emerald-700 dark:text-emerald-400 font-semibold">.supabase.co</code>
                  </span>
                  {url.includes('xqphkeuajbpxsvysvyhv') && url !== 'https://xqphkeuajbpxsvysvyhv.supabase.co' && (
                    <button
                      type="button"
                      onClick={() => setUrl('https://xqphkeuajbpxsvysvyhv.supabase.co')}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Set to https://xqphkeuajbpxsvysvyhv.supabase.co
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supabase-anon" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Supabase Anon (Public) Key
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKey ? 'Hide' : 'Show Key'}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="supabase-anon"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    type={showKey ? 'text' : 'password'}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    onBlur={() => {
                      const cleaned = cleanSupabaseKey(anonKey);
                      if (cleaned !== anonKey) setAnonKey(cleaned);
                    }}
                    className="font-mono text-xs pr-8"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Project Settings &rarr; API &rarr; Project API keys &rarr; copy <span className="font-semibold text-foreground">anon / public</span> key.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-muted-foreground">
                Credentials are saved securely in your browser & environment.
              </span>
              <Button
                type="submit"
                disabled={isTesting}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    CONNECTING & TESTING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    SAVE & CONNECT TO SUPABASE
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. SQL Schema Script (1-Click Copy) */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" /> 2. Initialize Database Tables (SQL Editor)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Copy this pre-made PostgreSQL setup script and run it in your Supabase SQL Editor to create all tables with Row Level Security.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSqlPreview(!showSqlPreview)}
                className="text-xs font-semibold"
              >
                {showSqlPreview ? 'Hide SQL' : 'View SQL'}
              </Button>
              <Button
                size="sm"
                onClick={handleCopySql}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    COPIED TO CLIPBOARD!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    COPY SQL SCHEMA
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border/80 text-xs space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick 3-Step Setup Instructions:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click <strong>COPY SQL SCHEMA</strong> button above.</li>
              <li>Open your Supabase Project → <strong>SQL Editor</strong> → click <strong>New Query</strong>.</li>
              <li>Paste the code and click <strong>Run</strong>. (Creates <code>entries</code>, <code>expenses</code>, <code>special_orders</code>, <code>inventory</code>, <code>settings</code>).</li>
            </ol>
          </div>

          {showSqlPreview && (
            <div className="mt-2 rounded-xl bg-zinc-950 text-zinc-100 p-4 font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800">
              <pre>{SQL_SCHEMA_SNIPPET}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. 1-Click Migration Button */}
      <Card className="border-pink-200 bg-pink-50/40 dark:border-pink-900/40 dark:bg-pink-950/20 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-pink-200 dark:border-pink-900/60 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-pink-950 dark:text-pink-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-pink-600" /> 3. Migrate All App Data to Supabase
              </h3>
              <p className="text-xs text-pink-800/80 dark:text-pink-300/80 mt-0.5">
                Pushes all {entries.length} daily entries, {expenses.length} expenses, special orders, and inventory from the app directly into your Supabase database.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-pink-900 dark:text-pink-200">
              Ready to transfer: <strong>{entries.length} Entries</strong>, <strong>{expenses.length} Expenses</strong>, <strong>{specialOrders.length} Special Orders</strong>.
            </div>

            <Button
              onClick={handleMigrateAll}
              disabled={isMigrating || !isConfigured}
              className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-black text-xs tracking-wider"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  MIGRATING ALL DATA...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  MIGRATE ALL DATA TO SUPABASE (1-CLICK)
                </>
              )}
            </Button>
          </div>

          {migrationStatus && (
            <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-950 dark:text-pink-200 text-xs font-semibold text-center border border-pink-300 dark:border-pink-800">
              {migrationStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
