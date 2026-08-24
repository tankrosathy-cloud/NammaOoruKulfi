import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'nammaoorukulfi_supabase_url';
const STORAGE_KEY_ANON = 'nammaoorukulfi_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function cleanSupabaseUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';

  if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
    if (!cleaned.startsWith('http')) cleaned = 'http://' + cleaned;
    return cleaned.replace(/\/+$/, '');
  }

  // If user pasted a Supabase Dashboard URL e.g. https://supabase.com/dashboard/project/abcdef12345/settings/api
  const dashboardMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // If user pasted or typed a 20-character project ref with or without partial domain
  // e.g. https://xqphkeuajbpxsvysvyhv.supa or xqphkeuajbpxsvysvyhv or https://xqphkeuajbpxsvysvyhv.supabase.co
  const refMatch = cleaned.match(/([a-z0-9]{20})/i);
  if (refMatch && refMatch[1] && (cleaned.includes('supa') || !cleaned.includes('.'))) {
    return `https://${refMatch[1].toLowerCase()}.supabase.co`;
  }

  // If someone entered e.g. https://abc.supabase or https://abc.supa
  const partialMatch = cleaned.match(/^https?:\/\/([a-zA-Z0-9_-]+)\.supa(base)?(\.co)?/i);
  if (partialMatch && partialMatch[1]) {
    return `https://${partialMatch[1]}.supabase.co`;
  }

  // Ensure https:// scheme
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  return cleaned.replace(/\/+$/, ''); // Remove trailing slashes
}

export function cleanSupabaseKey(key: string): string {
  return (key || '').trim().replace(/^["']|["']$/g, '');
}

export function validateSupabaseInputs(url: string, key: string): { isValid: boolean; warning?: string } {
  const cleanUrl = cleanSupabaseUrl(url);
  const cleanKey = cleanSupabaseKey(key);

  if (!cleanUrl) {
    return { isValid: false, warning: 'Please enter your Supabase Project URL.' };
  }
  if (!cleanUrl.includes('.supabase.co') && !cleanUrl.startsWith('http://localhost') && !cleanUrl.startsWith('http://127.0.0.1')) {
    return { 
      isValid: false, 
      warning: `Project URL "${cleanUrl}" does not appear to be a valid Supabase API endpoint. It must look like "https://<project-ref>.supabase.co" (found under Project Settings -> API in Supabase).` 
    };
  }
  if (!cleanKey) {
    return { isValid: false, warning: 'Please enter your Supabase Anon (Publishable) Key.' };
  }
  if (cleanKey.startsWith('http')) {
    return { isValid: false, warning: 'You pasted a URL into the API Key field instead of the key token.' };
  }

  return { isValid: true };
}

export const DEFAULT_SUPABASE_URL = 'https://xqphkeuajbpxsvysvyhv.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGhrZXVhamJweHN2eXN2eWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ2ODcwNCwiZXhwIjoyMTAzMDQ0NzA0fQ.FRQg9hLtKPrybbl_zV2Snca4_b4kCLRl_ynUH5jqG2s';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = cleanSupabaseUrl((metaEnv.VITE_SUPABASE_URL as string | undefined) || '');
  const envKey = cleanSupabaseKey((metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined) || '');

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    localUrl = cleanSupabaseUrl(localStorage.getItem(STORAGE_KEY_URL) || '');
    localKey = cleanSupabaseKey(localStorage.getItem(STORAGE_KEY_ANON) || '');
    
    // Auto-fix if old corrupted or truncated URL is in local storage
    if (!localUrl || !localUrl.endsWith('.supabase.co') || localUrl.includes('.supa')) {
      localUrl = DEFAULT_SUPABASE_URL;
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_SUPABASE_URL);
    }
    if (!localKey || localKey.length < 20) {
      localKey = DEFAULT_SUPABASE_KEY;
      localStorage.setItem(STORAGE_KEY_ANON, DEFAULT_SUPABASE_KEY);
    }
  }

  const url = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = localKey || envKey || DEFAULT_SUPABASE_KEY;

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  const cleanedUrl = cleanSupabaseUrl(url);
  const cleanedKey = cleanSupabaseKey(anonKey);

  if (typeof window !== 'undefined') {
    if (cleanedUrl) {
      localStorage.setItem(STORAGE_KEY_URL, cleanedUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (cleanedKey) {
      localStorage.setItem(STORAGE_KEY_ANON, cleanedKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  }

  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tableCounts?: Record<string, number>; errorDetails?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase credentials not configured. Please supply URL and Anon Key.',
    };
  }

  try {
    const results: Record<string, number> = {};
    const errors: string[] = [];
    
    // Check tables individually with head count
    const [entriesRes, expRes, specialsRes, invRes, setRes] = await Promise.allSettled([
      client.from('entries').select('id', { count: 'exact', head: true }),
      client.from('expenses').select('id', { count: 'exact', head: true }),
      client.from('special_orders').select('id', { count: 'exact', head: true }),
      client.from('inventory').select('id', { count: 'exact', head: true }),
      client.from('settings').select('id', { count: 'exact', head: true }),
    ]);

    const checkResult = (res: PromiseSettledResult<any>, tableName: string) => {
      if (res.status === 'fulfilled') {
        if (!res.value.error) {
          results[tableName] = res.value.count ?? 0;
        } else {
          const err = res.value.error;
          errors.push(`${tableName}: ${err.message || err.code || JSON.stringify(err)}`);
        }
      } else {
        errors.push(`${tableName}: ${res.reason?.message || 'Network failure'}`);
      }
    };

    checkResult(entriesRes, 'entries');
    checkResult(expRes, 'expenses');
    checkResult(specialsRes, 'special_orders');
    checkResult(invRes, 'inventory');
    checkResult(setRes, 'settings');

    const hasAnyTable = Object.keys(results).length > 0;
    if (hasAnyTable) {
      return {
        success: true,
        message: `Successfully connected to Supabase PostgreSQL! (${Object.keys(results).length}/5 tables detected)`,
        tableCounts: results,
      };
    } else {
      const errorString = errors.join('; ').toLowerCase();
      let friendlyHint = 'Tables are not found in your Supabase database. Please copy and run the SQL setup script in the Supabase SQL Editor.';
      
      if (errorString.includes('apikey') || errorString.includes('jwt') || errorString.includes('invalid key') || errorString.includes('unauthorized') || errorString.includes('401') || errorString.includes('403')) {
        friendlyHint = 'Invalid Supabase API Key. Please ensure you copied the "Publishable key" (or "anon key") from Project Settings -> API.';
      } else if (errorString.includes('load failed') || errorString.includes('failed to fetch') || errorString.includes('network') || errorString.includes('cors')) {
        friendlyHint = 'Could not reach your Supabase Project URL (Load failed). Please check your Supabase Project URL: it should look like "https://<project-ref>.supabase.co". If you pasted a dashboard or project name link, tap "Auto-Fix & Clean URL".';
      } else if (errorString.includes('relation') || errorString.includes('does not exist') || errorString.includes('not found') || errorString.includes('404')) {
        friendlyHint = 'Tables do not exist yet in your Supabase database. Please copy the SQL script below and click "Run" in your Supabase SQL Editor.';
      }

      return {
        success: false,
        message: friendlyHint,
        errorDetails: errors.join('; '),
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message || 'Unknown network error'}`,
      errorDetails: error.stack || String(error),
    };
  }
}
