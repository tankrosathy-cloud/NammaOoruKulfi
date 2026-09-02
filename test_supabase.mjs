import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let config = '';
try {
  const env = fs.readFileSync('.env', 'utf-8');
  // parse env
} catch (e) {}

// Let's just import their supabase module and see
