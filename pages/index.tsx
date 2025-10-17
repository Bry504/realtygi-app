import React from 'react';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7fb',
        textAlign: 'center'
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🏠 Realty GI</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Bienvenido al sistema interno RealtyGI
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li style={{ marginBottom: 12 }}>
          <Link
            href="/Realtygi/auth"
            style={{
              padding: '10px 16px',
              background: '#111827',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none'
            }}
          >
            Iniciar sesión / Registrarme
          </Link>
        </li>
        <li>
          <Link
            href="/Realtygi/orden-de-requerimiento"
            style={{
              padding: '10px 16px',
              background: '#e5e7eb',
              color: '#111827',
              borderRadius: 10,
              textDecoration: 'none'
            }}
          >
            Ir a Orden de Requerimiento
          </Link>
        </li>
      </ul>
    </main>
  );
};

export default Home;