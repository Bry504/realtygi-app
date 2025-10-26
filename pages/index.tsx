import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirige automáticamente al login
    router.replace('/auth');
  }, [router]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'Times New Roman, serif',
        color: '#6b4e2e'
      }}
    >
      <h1>Redirigiendo a la página de acceso...</h1>
    </div>
  );
}