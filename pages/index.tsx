import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function IndexPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Cargando…</p>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <h3>Sesión actual</h3>
      <pre style={{ background:'#f5f5f5', padding:12, borderRadius:8 }}>
        {JSON.stringify(session?.user ?? null, null, 2)}
      </pre>

      <div style={{ marginTop: 16 }}>
        <a href="/auth">Ir a /auth</a>
      </div>
    </main>
  );
}
