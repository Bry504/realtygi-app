import React, { useState } from 'react';
import Link from 'next/link';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // demo
    setLoading(false);
    setMsg('✅ (Demo) Iniciar sesión simulado. Luego conectamos Supabase Auth.');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f7fb' }}>
      <div style={{ width: 380, background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Realty GI</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>Inicia sesión</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 4 }}>Usuario (correo)</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="tucorreo@realtygi.pe"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 4 }}>Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: '12px 14px', borderRadius: 10, border: 'none',
              background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {loading ? 'Procesando…' : 'Iniciar sesión'}
          </button>

          {msg && (
            <div style={{ background: '#eefdf3', color: '#14532d', padding: 10, borderRadius: 8, fontSize: 13 }}>
              {msg}
            </div>
          )}
        </form>

        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {/* Este link va a una ruta que luego crearemos */}
          <Link href="/register" style={{ fontSize: 14, color: '#111827' }}>
            ¿No estás registrado? <strong>Regístrate</strong>
          </Link>

          <Link
            href="/forgot-password"
            style={{
              marginTop: 8, display: 'inline-block',
              padding: '10px 14px', textAlign: 'center',
              borderRadius: 10, background: '#e5e7eb', color: '#111827', textDecoration: 'none'
            }}
          >
            Olvidé mi contraseña
          </Link>

          {/* Volver al portal (Next añadirá /Realtygi solo) */}
          <Link href="/" style={{ fontSize: 13, color: '#6b7280', justifySelf: 'center' }}>
            ← Volver al portal
          </Link>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  outline: 'none'
};