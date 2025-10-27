// /components/AppLayout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <h3>REALTY GI</h3>
        <nav className="nav">
          <Link href="/">Inicio</Link>
          <Link href="/orden-de-requerimiento">Orden de Requerimiento</Link>
          <Link href="/proveedores">Proveedores</Link>
          <Link href="/compras">Compras</Link>
          <Link href="/pagos">Pagos</Link>
        </nav>
      </aside>
      <div>
        <div className="header">
          <div className="muted">Procure to Pay</div>
          <div>
            <Link className="btn btn-outline" href="/auth">Salir</Link>
          </div>
        </div>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}