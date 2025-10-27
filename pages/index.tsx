import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import AppLayout from '../components/AppLayout'; // 👈 FALTA ESTE IMPORT

export default function IndexPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) router.replace('/auth');
    else setLoading(false);
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      router.replace('/auth');
    }
  };

  if (loading || !user) return <p style={{ padding: 40 }}>Cargando...</p>;

  return (
    <AppLayout>
      <div className="container stack-lg">
        <div className="card">
          <h1>Bienvenido, {user.email}</h1>
          <p className="muted">Panel principal del proceso P2P.</p>
          <div style={{ display:'flex', gap:12, marginTop:12 }}>
            <button className="btn btn-primary" onClick={()=>router.push('/orden-de-requerimiento')}>Nueva OR</button>
            <button className="btn btn-muted" onClick={()=>router.push('/compras')}>Ver Compras</button>
            <button className="btn btn-outline" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>

        <div className="grid-3">
          <div className="card">
            <h2>Requerimientos</h2>
            <span className="badge badge-warn">Pendientes: 4</span>
          </div>
          <div className="card">
            <h2>OC/OS</h2>
            <span className="badge badge-ok">Aprobadas: 8</span>
          </div>
          <div className="card">
            <h2>Pagos</h2>
            <span className="badge badge-danger">Observadas: 2</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}