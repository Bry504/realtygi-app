import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.replace('/auth'); // si no hay sesión, vuelve al login
      else setUser(data.user);
    });
  }, []);

  if (!user) return <p>Cargando...</p>;

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