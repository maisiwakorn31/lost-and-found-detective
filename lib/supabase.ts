// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://flqlpufqagndycuirphp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4n0YLsC5UDle_LTF9ip5Nw_Mf-fFa2b'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)