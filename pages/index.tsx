import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function IndexPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    // 1) Sesión actual (más rápido/fiable que getUser al primer render)
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null;
      if (!u) {
        router.replace('/auth');
      } else {
        setUser(u);
      }
      setLoading(false);
    });

    // 2) Si la sesión cambia (login/logout), actualiza o redirige
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      const u = sess?.user ?? null;
      if (!u) router.replace('/auth');
      else setUser(u);
    });
    unsub = () => sub?.subscription?.unsubscribe();

    return () => unsub();
  }, [router]);

  if (loading) return <p>Cargando...</p>;
  if (!user) return null; // el redirect ya corre

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