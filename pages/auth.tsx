import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setMsg('Ingreso exitoso.');
    } catch (_e: unknown) {
      setMsg('Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Iniciar Sesión — Realty Grupo Inmobiliario</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className="wrap">
        <div className="overlay" />
        <div className="glass">
          <div className="logo">
            <img src="/logo.png" alt="Logo Realty GI" />
          </div>

          <h1>REALTY GRUPO INMOBILIARIO</h1>

          <form onSubmit={onSubmit} className="form">
            <label>Correo Corporativo</label>
            <div className="field">
              <input
                type="email"
                placeholder="nombre.apellido@realtygi.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label>Contraseña</label>
            <div className="field pwdWrap">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPwd ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.49 1.7-3.05 3.06-4.41M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-.53 1.23-1.3 2.42-2.27 3.45" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {msg && <div className="msg">{msg}</div>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>

            <Link href="#" className="forgot">¿Olvidaste tu contraseña?</Link>

            <p className="cta">
              ¿No tienes cuenta? <a href="#">Regístrate aquí</a>
            </p>
          </form>
        </div>
      </main>

      <style jsx>{`
        * { font-family: 'Times New Roman', Times, serif; }

        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background-image: url('/auth-bg.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          overflow: hidden;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(225, 225, 225, 0.12);
          z-index: 0;
        }

        .glass {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 32px 28px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          color: #222;
          text-align: center;
          animation: fadeUp .7s ease-out both;
        }

        .logo img {
          width: 80px; height: 80px; border-radius: 50%;
          background: #000; padding: 8px; margin-bottom: 10px;
          animation: floaty 6s ease-in-out infinite;
        }

        h1 {
          margin: 4px 0 2px 0;
          font-size: 24px; /* +2 px */
          font-weight: 700;
          color: #1d1d1d;
          text-transform: uppercase;
        }

        label {
          display: block; text-align: left; font-size: 14px;
          color: #3a2c1a; margin: 12px 0 6px;
        }

        .field input {
          width: 100%; height: 42px; padding: 0 14px;
          border-radius: 8px; border: 1px solid #d1c4a3;
          outline: none; font-size: 15px; color: #2b1d07;
          background: rgba(255, 255, 255, 0.95);
          transition: box-shadow .15s ease;
        }
        .field input::placeholder { color: #9d8a67; }
        .field input:focus { box-shadow: 0 0 0 3px rgba(192,155,88,.30); }
        /* Oculta placeholder al enfocar */
        .field input:focus::placeholder { color: transparent; }

        .pwdWrap { position: relative; }
        .eyeBtn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #6a512a;
        }

        .btn {
          width: 100%; height: 46px; margin-top: 18px;
          background: #a38147; color: #fff; font-weight: bold;font-size: 17px;
          border: none; border-radius: 6px; cursor: pointer;
          transition: background .2s ease;
        }
        .btn:hover { background: #8d6e3e; }

        .forgot {
          display: block;
          margin-top: 30px; /* un poco más abajo */
          color: #000;
          font-weight: 700; /* negrita */
          font-size: 14px;
          text-decoration: none;
        }

        .cta { margin-top: 10px; color: #604a23; font-size: 15px; }
        .cta a { font-weight: bold; color: #604a23; text-decoration: none; }
        .cta a:hover { text-decoration: underline; }

        .msg { margin-top: 6px; color: #604a23; font-size: 14px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floaty {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-5px); }
        }

        @media (max-width: 480px) {
          .glass { padding: 24px 20px; }
        }
      `}</style>
    </>
  );
}