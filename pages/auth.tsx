import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      // TODO: conecta aquí tu auth real (Supabase, API, etc.)
      await new Promise((r) => setTimeout(r, 700));
      setMsg('Ingreso exitoso.');
    } catch (_e: unknown) {
      setMsg('Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Iniciar sesión — Realty GI</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className="wrap">
        <div className="glass">
          <h1>Iniciar sesión</h1>

          <form onSubmit={onSubmit} className="form">
            <div className="field">
              <input
                type="text"
                placeholder="Usuario o correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <input
                type="password"
                placeholder="Contraseña"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Recuérdame</span>
              </label>

              <Link href="#" className="forgot">¿Olvidaste tu contraseña?</Link>
            </div>

            {msg && <div className="msg">{msg}</div>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Procesando…' : 'Ingresar'}
            </button>
          </form>

          <p className="cta">
            ¿No tienes una cuenta? <a href="#">Registrarte</a>
          </p>
        </div>
      </main>

      <style jsx>{`
        .wrap {
         position: relative;
         min-height: 100vh;
         display: grid;
         place-items: center;
         background-image: url('/auth-bg.jpg');
        background-size: cover;
         background-position: center;
         background-repeat: no-repeat;
          padding: 24px;
        }

        .wrap::before {
         content: "";
         position: absolute;
         inset: 0;
          background: rgba(0, 0, 0, 0.45); /* <- capa negra semitransparente */
         z-index: 0;
        }

        .glass {
          position: relative;
         z-index: 1; /* para estar encima del overlay */
        /* resto igual que arriba */
        }
        .glass {
        width: 100%;
         max-width: 520px;
        padding: 28px 26px 22px;
         border-radius: 14px;
         background: rgba(30, 30, 30, 0.45); /* <- antes 0.18 */
         backdrop-filter: blur(14px) saturate(150%);
         -webkit-backdrop-filter: blur(14px) saturate(150%);
         border: 1px solid rgba(255, 255, 255, 0.25);
         box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35);
         color: #fff;
        text-align: center;
        }
        h1 {
          margin: 8px 0 18px;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 0.4px;
          color: #fff;
        }
        .form {
          display: grid;
          gap: 14px;
          text-align: left;
        }
        .field input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          outline: none;
          font-size: 15px;
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
        }
        .field input::placeholder { color: rgba(255,255,255,0.85); }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 2px;
        }
        .remember {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #fff;
          cursor: pointer;
        }
        .remember input {
          width: 16px; height: 16px;
          accent-color: #fff;
        }
        .forgot {
          color: #fff;
          font-weight: 700;
          text-decoration: none;
        }
        .forgot:hover { text-decoration: underline; }
        .btn {
          margin: 6px 0 8px;
          width: 100%;
          height: 48px;
          border-radius: 26px;
          border: none;
          background: rgba(255,255,255,0.92);
          color: #333;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
        }
        .btn:disabled { opacity: 0.7; cursor: default; }
        .cta {
          margin: 6px 0 0;
          color: rgba(255,255,255,0.95);
          font-size: 15px;
        }
        .cta a {
          color: #fff;
          font-weight: 800;
          text-decoration: none;
        }
        .cta a:hover { text-decoration: underline; }
        .msg {
          text-align: center;
          color: #fff;
          font-size: 14px;
        }
        @media (max-width: 480px) {
          .glass { padding: 22px 18px 18px; }
          h1 { font-size: 30px; }
        }
      `}</style>
    </>
  );
}
