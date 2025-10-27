// /pages/debug-auth.tsx
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function DebugAuth() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const s = await supabase.auth.getSession();
    const u = await supabase.auth.getUser();
    setSession(s.data?.session ?? null);
    setUser(u.data?.user ?? null);
    setLoading(false);
    console.log('getSession:', s);
    console.log('getUser:', u);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h1>Debug Auth</h1>

      <p><b>URL:</b> {typeof window !== 'undefined' ? window.location.href : 'ssr'}</p>

      <button onClick={refresh} style={{ padding: 8, marginBottom: 12 }}>
        Refrescar (getSession/getUser)
      </button>

      {loading ? <p>Cargando…</p> : (
        <>
          <h3>Session</h3>
          <pre style={{ background:'#f6f6f6', padding:12 }}>{JSON.stringify(session, null, 2)}</pre>

          <h3>User</h3>
          <pre style={{ background:'#f6f6f6', padding:12 }}>{JSON.stringify(user, null, 2)}</pre>

          {error && <p style={{ color:'crimson' }}>{error}</p>}

          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                setError(error?.message ?? null);
                await refresh();
              }}
            >
              SignOut
            </button>

            <button
              onClick={async () => {
                // WARNING: solo para probar que signIn responde algo; no se guarda credenciales
                const email = prompt('Email:');
                const password = prompt('Password:');
                if (!email || !password) return;
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                console.log('signInWithPassword -> data:', data, 'error:', error);
                setError(error?.message ?? null);
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