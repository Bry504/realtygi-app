import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function IndexPage() {
  const supabase = useSupabaseClient();
  const user = useUser(); // obtiene el usuario actual desde el helper
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return; // aún cargando
    if (!user) router.replace('/auth');
    else setLoading(false);
  }, [user, router]);

  const handleLogout = async () => {
    try {
      // 1️⃣ Cierra sesión del cliente (limpia localStorage)
      await supabase.auth.signOut();
      // 2️⃣ Llama al endpoint para limpiar cookies httpOnly
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      // 3️⃣ Redirige al login
      router.replace('/auth');
    }
  };

  if (loading || !user) return <p style={{ padding: 40 }}>Cargando...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Bienvenido, {user.email}</h1>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </main>
  );
}