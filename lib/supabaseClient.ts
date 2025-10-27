// /lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseKey);
// Este cliente usa cookies (no localStorage), lo que permite
// que el middleware del edge lea la sesión correctamente.

export default supabase;