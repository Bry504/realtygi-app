// /pages/index.tsx
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const IndexPage: NextPage = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  // Si aún no hay sesión (el middleware ya protege, pero por UX):
  if (!session) return <p>Cargando...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Bienvenido, {session.user?.email}</h1>
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
};

export default IndexPage;