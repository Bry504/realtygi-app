// /pages/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function IndexPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    // 1) Carga de sesión
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null;
      if (!u) router.replace('/auth');
      else setUser(u);
      setLoading(false);
    });
    // 2) Observador auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      if (!u) router.replace('/auth');
      else setUser(u);
    });
    unsub = () => sub?.subscription?.unsubscribe();
    return () => unsub();
  }, [router]);

  if (loading) return <p>Cargando...</p>;
  if (!user) return null;

  return (
    <main style={{ padding: 40 }}>
      <h1>Bienvenido, {user.email}</h1>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace('/auth');
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}