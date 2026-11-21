import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both values exist in .env
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// If .env is missing, this is null instead of crashing the whole app
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null