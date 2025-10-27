// /lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ⬇⬇⬇ AGREGA ESTO
if (typeof window !== 'undefined') {
  console.log('[Supabase ENV]', {
    hasUrl: !!url, hasAnon: !!anon,
    urlSample: url ? url.slice(0, 24) + '...' : null
  });
  if (!url || !anon) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}
// ⬆⬆⬆

const supabase = createClient(url, anon);
export default supabase;