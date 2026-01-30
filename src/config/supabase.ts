import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// Default client for user-scoped actions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for system-level actions (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);