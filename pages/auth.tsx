import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setMsg(null);
  setLoading(true);

  try {
    // 1) Intento de login en Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });

    if (error || !data.user) {
      // Correo/clave no válidos en Auth
      throw new Error('Usuario no reconocido, por favor regístrese.');
    }

    // 2) Buscar su perfil en tu tabla `usuarios`
    const { data: perfil, error: qerr } = await supabase
      .from('usuarios')
      .select('estado')
      .eq('auth_user_id', data.user.id)
      .single();

    if (qerr || !perfil) {
      // No existe perfil asociado → no está registrado en tu tabla de negocio
      await supabase.auth.signOut();
      throw new Error('Usuario no reconocido, por favor regístrese.');
    }

    if (perfil.estado !== 'ACTIVO') {
      await supabase.auth.signOut();
      if (perfil.estado === 'PENDIENTE') {
        throw new Error('Tu cuenta está pendiente de activación.');
      }
      throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
    }

    // 3) OK → continuar
    setMsg('Ingreso exitoso.');
    // Redirige a tu página protegida:
    // window.location.href = '/orden-de-requerimiento';
  } catch (err: unknown) {
    setMsg(err instanceof Error ? err.message : 'Ocurrió un error.');
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
          <div className="logo" aria-hidden>
            <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority style={{ objectFit: 'contain' }} />
          </div>

          <h1>REALTY GRUPO INMOBILIARIO</h1>

          <form onSubmit={onSubmit} className="form" noValidate>
            <label htmlFor="email">Correo Corporativo</label>
            <div className="field">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nombre.apellido@realtygi.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Contraseña</label>
            <div className="field pwdWrap">
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
                title={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPwd ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.49 1.7-3.05 3.06-4.41M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-.53 1.23-1.3 2.42-2.27 3.45" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
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
            </div>


            {msg && <div className="msg">{msg}</div>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>

            <Link href="#" className="forgot">
              ¿Olvidaste tu contraseña?
            </Link>

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
          background: rgba(255, 255, 255, 0.12); /* fondo aclarado */
          z-index: 0;
        }

        .glass {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 32px 28px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.18); /* glass */
          backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          color: #222;
          text-align: center;
          animation: fadeUp 0.7s ease-out both;
        }

        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 10px;
          border-radius: 50%;
          background: #000;
          padding: 8px;
          display: grid;
          place-items: center;
          animation: floaty 6s ease-in-out infinite;
        }

        h1 {
          margin: 4px 0 2px 0;
          font-size: 26px; /* +2 px respecto a tu versión */
          font-weight: 700;
          color: #1d1d1d;
          text-transform: uppercase;
        }

        label {
          display: block;
          text-align: left;
          font-size: 14px;
          color: #3a2c1a;
          margin: 12px 0 6px;
        }

        .field input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #d1c4a3;
          outline: none;
          font-size: 15px;
          color: #2b1d07;
          background: rgba(255, 255, 255, 0.95);
          transition: box-shadow 0.15s ease;
        }
        .field input::placeholder { color: #9d8a67; }
        .field input:focus { box-shadow: 0 0 0 3px rgba(192, 155, 88, 0.3); }
        .field input:focus::placeholder { color: transparent; } /* oculta placeholder al enfocar */

        .pwdWrap { position: relative; margin-bottom: 6px; }
        .pwdWrap input { padding-right: 44px; }  /* espacio para el icono */

        .eyeBtn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);  /* centra respecto al input */
            width: 32px;
            height: 32px;
            display: grid;
            place-items: center;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #6a512a;
        }

        .btn {
          width: 100%;
          height: 46px;
          margin-top: 10px;
          margin-bottom: 18px; /* separa del enlace */
          background: #a38147;
          color: #fff;
          font-weight: bold;
          font-size: 17px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btn:hover { background: #8d6e3e; }

        .forgot {
          display: block;
          margin-top: 45px; /* más abajo para no quedar pegado */
          color: #000;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
        }

        .cta {
          margin-top: 10px;
          color: #604a23; /* color del texto "¿No tienes cuenta?" */
          font-size: 15px;
        }
        .cta a {
          font-weight: bold;
          color: #fff; /* "Regístrate aquí" en blanco */
          text-decoration: none;
        }
        .cta a:hover { text-decoration: underline; }

        .msg {
          margin-top: 6px;
          color: #604a23;
          font-size: 14px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @media (max-width: 480px) {
          .glass { padding: 24px 20px; }
        }

          .row {
            display: flex;
             align-items: center;
             justify-content: flex-start;
             margin: 4px 0 6px;
            }

            .remember {
            display: inline-flex;
             align-items: center;
             gap: 8px;
             font-size: 14px;
             color: #3a2c1a;
             cursor: pointer;
            }

            .remember input {
             width: 16px;
             height: 16px;
             accent-color: #a38147; /* tono dorado */
            }
      `}</style>
    </>
  );
}