import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [msg, setMsg] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // TODO: conecta aquí tu API de auth real (Supabase, etc.)
      await new Promise((r) => setTimeout(r, 800));
      setMsg(mode === 'login' ? 'Ingreso exitoso.' : 'Registro exitoso.');
    } catch (err: any) {
      setMsg(err?.message ?? 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Ingresar' : 'Crear cuenta'} — Realty GI</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className="auth">
        <div className="card">
          {/* LOGO */}
          <div className="logoWrap">
            <img src="/logo.png" alt="Logo" />
          </div>

          <h1>{mode === 'login' ? 'Bienvenido' : 'Crea tu cuenta'}</h1>
          <p className="subtitle">
            {mode === 'login'
              ? 'Ingresa con tu correo corporativo'
              : 'Completa tus datos para registrarte'}
          </p>

          <form onSubmit={handleSubmit} className="form">
            {mode === 'register' && (
              <div className="field">
                <label>Nombre completo</label>
                <input
                  name="fullName"
                  placeholder="Tu nombre"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                name="email"
                placeholder="tucorreo@empresa.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Contraseña</label>
              <div className="pwdWrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="togglePwd"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
                  title={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPwd ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {msg && <div className="msg">{msg}</div>}

            <button className="submit" type="submit" disabled={loading}>
              {loading ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Registrarme'}
            </button>
          </form>

          <div className="switch">
            {mode === 'login' ? (
              <>
                <span>¿No tienes cuenta?</span>
                <button onClick={() => setMode('register')} className="linkBtn">
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                <span>¿Ya tienes cuenta?</span>
                <button onClick={() => setMode('login')} className="linkBtn">
                  Ingresar
                </button>
              </>
            )}
          </div>

          <footer className="foot">
            <Link href="#" className="a">¿Olvidaste tu contraseña?</Link>
          </footer>
        </div>
      </main>

      {/* styled-jsx: no necesitas Tailwind */}
      <style jsx>{`
        .auth {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ffe6cc 0%, #ffd8b0 40%, #fff3e8 100%);
        }
        .card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 2px solid #111;
          box-shadow: 8px 8px 0 #111;
          border-radius: 18px;
          padding: 28px 26px;
        }
        .logoWrap {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          background: #111;
          display: grid;
          place-items: center;
          margin-bottom: 16px;
        }
        .logoWrap img {
          width: 46px;
          height: 46px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        h1 {
          margin: 0 0 4px 0;
          font-size: 28px;
          line-height: 1.1;
          color: #111;
        }
        .subtitle {
          margin: 0 0 18px 0;
          color: #444;
        }
        .form {
          display: grid;
          gap: 14px;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #222;
          margin-bottom: 6px;
        }
        .field input {
          width: 100%;
          padding: 12px 12px;
          border-radius: 12px;
          border: 2px solid #111;
          outline: none;
          background: #fffaf5;
          transition: box-shadow .15s ease, transform .05s ease;
        }
        .field input:focus {
          box-shadow: 0 0 0 4px #ffd9b6;
        }
        .pwdWrap {
          position: relative;
        }
        .pwdWrap input {
          padding-right: 80px;
        }
        .togglePwd {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          border: 2px solid #111;
          background: #ffe0bf;
          padding: 6px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }
        .togglePwd:hover { background: #ffd1a3; }
        .submit {
          margin-top: 6px;
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 2px solid #111;
          background: #ffb36b; /* naranja pastel */
          font-weight: 700;
          cursor: pointer;
          transition: transform .05s ease, box-shadow .1s ease;
          box-shadow: 4px 4px 0 #111;
        }
        .submit:hover { background: #ffa24a; }
        .submit:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 #111; }
        .submit:disabled { opacity: .6; cursor: default; }
        .msg {
          background: #fff4e8;
          border: 2px solid #111;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
        }
        .switch {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .linkBtn {
          background: transparent;
          border: none;
          color: #111;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
        }
        .foot {
          margin-top: 10px;
          text-align: center;
        }
        .a {
          color: #111;
          text-decoration: underline;
        }
        @media (max-width: 480px) {
          .card { border-radius: 0; max-width: 100%; height: 100vh; box-shadow: none; }
        }
      `}</style>
    </>
  );
}