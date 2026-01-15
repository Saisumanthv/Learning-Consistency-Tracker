import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DailyCompletion {
  id: string;
  date: string;
  user_id: string;
  ai_knowledge: boolean;
  codebasics: boolean;
  trading: boolean;
  created_at: string;
  updated_at: string;
}
