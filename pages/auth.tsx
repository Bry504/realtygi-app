import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '../lib/supabaseClient';

export default function AuthPage() {
  // ====== MODO (login/register) ======
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // ====== LOGIN (diseño original) ======
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  // ====== REGISTRO ======
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDoc, setTipoDoc] = useState<'DNI' | 'CE'>('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [celular, setCelular] = useState('');
  const [correoP, setCorreoP] = useState('');
  const [correoR, setCorreoR] = useState('');
  const [pwdReg, setPwdReg] = useState('');
  const [showPwdReg, setShowPwdReg] = useState(false);
  const [dupP, setDupP] = useState(false);
  const [dupR, setDupR] = useState(false);

  // Debounce helper
  const debounce = (fn: Function, ms = 400) => {
    let t: any;
    return (...args: any[]) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Verificación en vivo de correos duplicados
  const checkCorreo = useMemo(
    () =>
      debounce(async (correo: string, tipo: 'P' | 'R') => {
        if (!correo) return;
        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .or(`usuario.eq.${correo},correo_recuperacion.eq.${correo}`);
        if (!error && data && data.length > 0) {
          tipo === 'P' ? setDupP(true) : setDupR(true);
        } else {
          tipo === 'P' ? setDupP(false) : setDupR(false);
        }
      }, 450),
    []
  );

  useEffect(() => {
    if (mode === 'register' && correoP) checkCorreo(correoP, 'P');
  }, [correoP, mode, checkCorreo]);

  useEffect(() => {
    if (mode === 'register' && correoR) checkCorreo(correoR, 'R');
  }, [correoR, mode, checkCorreo]);

  // ====== LOGIN SUBMIT (igual a tu versión) ======
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // 1) Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });

      if (error || !data.user) {
        throw new Error('Usuario no reconocido, por favor regístrese.');
      }

      // 2) Perfil en tu tabla `usuarios`
      const { data: perfil, error: qerr } = await supabase
        .from('usuarios')
        .select('estado')
        .eq('auth_user_id', data.user.id)
        .single();

      if (qerr || !perfil) {
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

      // 3) OK
      setMsg('Ingreso exitoso.');
      // window.location.href = '/orden-de-requerimiento';
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  // ====== REGISTRO SUBMIT ======
  async function onSubmitRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dupP || dupR) {
      setMsg('Correo principal o de recuperación ya registrado. Intenta con otro.');
      return;
    }

    setMsg(null);
    setLoading(true);
    try {
      // 1) Alta en Auth con correo principal
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: correoP,
        password: pwdReg,
      });
      if (authErr) throw authErr;
      const authId = auth.user?.id;

      // 2) Insert en tabla de negocio
      const { error: insErr } = await supabase.from('usuarios').insert([
        {
          auth_user_id: authId,
          usuario: correoP,                 // 👈 correo principal va aquí
          nombres,
          apellidos,
          tipo_doc: tipoDoc,
          num_doc: numDoc,
          celular,
          correo_recuperacion: correoR,     // 👈 correo de recuperación
          estado: 'PENDIENTE',
        },
      ]);
      if (insErr) throw insErr;

      setMsg('Registro enviado. Tu cuenta está en PENDIENTE hasta activación.');
      setMode('login');
    } catch (err: any) {
      setMsg(err.message ?? 'No se pudo completar el registro.');
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

        {/* === CONTENEDOR GLASS con FLIP (se mantiene diseño) === */}
        <div className={`glass ${mode === 'register' ? 'isFlipped' : ''}`}>
          <div className="flip3d">
            {/* ===== FRONT: LOGIN (tu diseño original) ===== */}
            <div className="face front">
              <div className="logo" aria-hidden>
                <Image
                  src="/logo.png"
                  alt="Logo Realty GI"
                  width={64}
                  height={64}
                  priority
                  style={{ objectFit: 'contain' }}
                />
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

                <Link href="#" className="forgot">¿Olvidaste tu contraseña?</Link>

                <p className="cta">
                  ¿No tienes cuenta?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMsg(null);
                      setMode('register');
                    }}
                  >
                    Regístrate aquí
                  </a>
                </p>
              </form>
            </div>

            {/* ===== BACK: REGISTRO (misma estética + ojito) ===== */}
            <div className="face back">
              <div className="logo" aria-hidden>
                <Image
                  src="/logo.png"
                  alt="Logo Realty GI"
                  width={64}
                  height={64}
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>

              <h1>REGISTRO DE USUARIO</h1>

              <form onSubmit={onSubmitRegister} className="form formRegister" noValidate>
                <div className="mt8" />

                {/* Nombres + Apellidos */}
                <div className="g2">
                  <div className="field">
                    <input
                      placeholder="Nombres"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      placeholder="Apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Tipo Doc + Nº Doc */}
                <div className="g2">
                  <div className="field">
                    <select
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value as 'DNI' | 'CE')}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div className="field">
                    <input
                      placeholder={tipoDoc}
                      value={numDoc}
                      onChange={(e) => setNumDoc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Correo principal */}
                <div className="field">
                  <input
                    placeholder="Correo principal"
                    type="email"
                    value={correoP}
                    onChange={(e) => setCorreoP(e.target.value)}
                    required
                  />
                </div>
                <div className="errLine">
                  {dupP && <span className="error">Correo principal ya registrado</span>}
                </div>

                {/* Correo de recuperación */}
                <div className="field">
                  <input
                    placeholder="Correo de recuperación"
                    type="email"
                    value={correoR}
                    onChange={(e) => setCorreoR(e.target.value)}
                    required
                  />
                </div>
                <div className="errLine">
                  {dupR && <span className="error">Correo de recuperación ya registrado</span>}
                </div>

                {/* Celular + Contraseña */}
                <div className="g2">
                  <div className="field">
                    <input
                      placeholder="Celular"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field pwdWrap">
                    <input
                      placeholder="Contraseña"
                      type={showPwdReg ? 'text' : 'password'}
                      value={pwdReg}
                      onChange={(e) => setPwdReg(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eyeBtn"
                      onClick={() => setShowPwdReg((s) => !s)}
                      aria-label={showPwdReg ? 'Ocultar contraseña' : 'Ver contraseña'}
                      title={showPwdReg ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPwdReg ? (
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
                </div>

                {msg && <div className="msg">{msg}</div>}

                <button className="btn" disabled={!!(dupP || dupR)}>
                  Registrarme
                </button>

                <p className="cta">
                  ¿Ya tienes cuenta?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode('login');
                      setMsg(null);
                    }}
                  >
                    Iniciar Sesión
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* ======= TU ESTILO ORIGINAL ======= */
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
          background: rgba(255, 255, 255, 0.12);
          z-index: 0;
        }

        .glass {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          height: 560px; /* más compacto */
          padding: 0;     /* el padding va en cada cara */
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          color: #222;
          text-align: center;
          animation: fadeUp 0.7s ease-out both;
          perspective: 1400px; /* 3D */
          overflow: hidden;    /* recorta durante el flip */
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
          font-size: 26px;
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

        /* Unifica el look de inputs y selects */
        .field input,
        .field select {
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
        .field input:focus,
        .field select:focus { box-shadow: 0 0 0 3px rgba(192, 155, 88, 0.3); }
        .field input:focus::placeholder { color: transparent; }

        .pwdWrap { position: relative; margin-bottom: 6px; }
        .pwdWrap input { padding-right: 44px; }

        .eyeBtn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
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
          margin-bottom: 18px;
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
          margin-top: 45px;
          color: #000;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
        }

        .cta {
          margin-top: 10px;
          color: #604a23;
          font-size: 15px;
        }
        .cta a { font-weight: bold; color: #fff; text-decoration: none; }
        .cta a:hover { text-decoration: underline; }

        .msg { margin-top: 6px; color: #604a23; font-size: 14px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @media (max-width: 480px) {
          .glass { max-width: 420px; }
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
          accent-color: #a38147;
        }

        /* ======= NUEVO PARA FLIP Y REGISTRO ======= */
        .flip3d {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s ease;
        }
        .glass.isFlipped .flip3d { transform: rotateY(180deg); }

        .face {
          position: absolute;
          inset: 0;
          padding: 32px 28px;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          text-align: center;
        }
        .back { transform: rotateY(180deg); }

        /* Fila de 2 columnas (usada en registro) */
        .g2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;              /* compacto entre columnas */
        }

        /* Espaciado vertical uniforme y compacto ENTRE filas del registro */
        .formRegister .field,
        .formRegister .g2 {
          margin-top: 3px;
          margin-bottom: 3px;
        }

        /* Separador sutil arriba del registro */
        .mt8 { height: 6px; }

        /* El formulario del registro ocupa toda la altura (para empujar el botón si hace falta) */
        .formRegister {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* Línea reservada para mensajes de error (evita que el layout salte) */
        .errLine {
          min-height: 14px;
          line-height: 14px;
        }

        /* Estilo de error compacto */
        .error {
          color: #c81e1e;
          font-size: 12px;
          display: inline-block;
          margin-top: 2px;
        }

        /* Ajuste fino visual del select */
        .formRegister select { padding-right: 8px; }

        /* (opcional) empujar elementos al fondo si lo necesitas en algún momento */
        .spacer { flex: 1; }
      `}</style>
    </>
  );
}