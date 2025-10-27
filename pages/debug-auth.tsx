// /pages/debug-auth.tsx
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function DebugAuth() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await supabase.auth.getSession();
      const u = await supabase.auth.getUser();
      setSession(s.data?.session ?? null);
      setUser(u.data?.user ?? null);
      console.log('getSession:', s);
      console.log('getUser:', u);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h1>Debug Auth</h1>
      <p><b>URL:</b> {typeof window !== 'undefined' ? window.location.href : 'ssr'}</p>

      <button onClick={refresh} style={{ padding: 8, margin: '12px 0' }}>
        Refrescar (getSession / getUser)
      </button>

      {loading ? <p>Cargando…</p> : (
        <>
          {err && <p style={{ color: 'crimson' }}>{err}</p>}

          <h3>Session</h3>
          <pre style={{ background:'#f6f6f6', padding:12 }}>{JSON.stringify(session, null, 2)}</pre>

          <h3>User</h3>
          <pre style={{ background:'#f6f6f6', padding:12 }}>{JSON.stringify(user, null, 2)}</pre>

          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                console.log('signOut error:', error);
                await refresh();
              }}
            >
              SignOut
            </button>

            <button
              onClick={async () => {
                const email = prompt('Email:');
                const password = prompt('Password:');
                if (!email || !password) return;
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                console.log('signInWithPassword -> data:', data, 'error:', error);
                await refresh();
              }}
            >
              SignIn (prompt)
            </button>
          </div>
        </>
      )}
    </main>
  );
}
