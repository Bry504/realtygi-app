import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '../lib/supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // ====== LOGIN ======
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
  const [dupP, setDupP] = useState(false);
  const [dupR, setDupR] = useState(false);

  // ===== Debounce para validación de correos =====
  const debounce = (fn: Function, delay = 400) => {
    let t: any;
    return (...args: any[]) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  };

  const checkCorreo = useMemo(
    () =>
      debounce(async (correo: string, tipo: 'P' | 'R') => {
        if (!correo) return;
        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .or(`correo_principal.eq.${correo},correo_recuperacion.eq.${correo}`);
        if (!error && data.length > 0) {
          tipo === 'P' ? setDupP(true) : setDupR(true);
        } else {
          tipo === 'P' ? setDupP(false) : setDupR(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    if (mode === 'register' && correoP) checkCorreo(correoP, 'P');
  }, [correoP, mode, checkCorreo]);

  useEffect(() => {
    if (mode === 'register' && correoR) checkCorreo(correoR, 'R');
  }, [correoR, mode, checkCorreo]);

  // ===== LOGIN SUBMIT =====
  async function onSubmitLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error || !data.user) throw new Error('Usuario no reconocido.');

      const { data: perfil, error: qerr } = await supabase
        .from('usuarios')
        .select('estado')
        .eq('auth_user_id', data.user.id)
        .single();

      if (qerr || !perfil) {
        await supabase.auth.signOut();
        throw new Error('Usuario no registrado.');
      }
      if (perfil.estado !== 'ACTIVO') {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta no está activa o está pendiente.');
      }

      setMsg('Ingreso exitoso.');
      // window.location.href = '/orden-de-requerimiento';
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===== REGISTRO SUBMIT =====
  async function onSubmitRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dupP || dupR) {
      setMsg('Uno de los correos ya está registrado.');
      return;
    }

    setMsg(null);
    setLoading(true);
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: correoP,
        password: pwdReg,
      });
      if (authErr) throw authErr;
      const authId = auth.user?.id;

      const { error: insErr } = await supabase.from('usuarios').insert([
        {
          auth_user_id: authId,
          nombres,
          apellidos,
          tipo_doc: tipoDoc,
          num_doc: numDoc,
          celular,
          correo_principal: correoP,
          correo_recuperacion: correoR,
          estado: 'PENDIENTE',
        },
      ]);
      if (insErr) throw insErr;

      setMsg('Registro enviado. Espera activación del administrador.');
      setMode('login');
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===== RETURN =====
  return (
    <>
      <Head>
        <title>Acceso — Realty Grupo Inmobiliario</title>
      </Head>

      <main className="wrap">
        <div className={`glass ${mode === 'register' ? 'isFlipped' : ''}`}>
          <div className="flip3d">
            {/* FRONT: LOGIN */}
            <div className="face front">
              <div className="logo">
                <Image src="/logo.png" alt="Logo Realty GI" width={80} height={80} priority />
              </div>
              <h1>REALTY GRUPO INMOBILIARIO</h1>

              <form onSubmit={onSubmitLogin} className="form">
                <label>Correo Corporativo</label>
                <input
                  type="email"
                  placeholder="nombre.apellido@realtygi.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>Contraseña</label>
                <div className="pwdWrap">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="eyeBtn">
                    👁️
                  </button>
                </div>

                {msg && <div className="msg">{msg}</div>}

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Procesando...' : 'Iniciar Sesión'}
                </button>

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

            {/* BACK: REGISTRO */}
            <div className="face back">
              <div className="logo">
                <Image src="/logo.png" alt="Logo Realty GI" width={80} height={80} priority />
              </div>
              <h1>REGISTRO DE USUARIO</h1>

              <form onSubmit={onSubmitRegister} className="form">
                <div className="g2">
                  <input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
                  <input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
                </div>
                <div className="g2">
                  <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value as any)}>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                  </select>
                  <input placeholder={tipoDoc} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} required />
                </div>
                <div className="g2">
                  <input placeholder="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} required />
                  <input
                    placeholder="Correo principal"
                    type="email"
                    value={correoP}
                    onChange={(e) => setCorreoP(e.target.value)}
                    required
                  />
                </div>
                {dupP && <p className="error">Correo principal ya registrado</p>}

                <div className="g2">
                  <input
                    placeholder="Correo de recuperación"
                    type="email"
                    value={correoR}
                    onChange={(e) => setCorreoR(e.target.value)}
                    required
                  />
                  <input
                    placeholder="Contraseña"
                    type="password"
                    value={pwdReg}
                    onChange={(e) => setPwdReg(e.target.value)}
                    required
                  />
                </div>
                {dupR && <p className="error">Correo de recuperación ya registrado</p>}

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
        * { font-family: 'Times New Roman', Times, serif; }
        html, body { height: 100%; overflow: hidden; }

        .wrap {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          background-image: url('/auth-bg.jpg');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .glass {
          position: relative;
          width: 420px;
          height: 560px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          perspective: 1400px;
          overflow: hidden;
        }

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
          backface-visibility: hidden;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          text-align: center;
        }

        .back { transform: rotateY(180deg); }

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
          margin: 4px 0 14px 0;
          font-size: 26px;
          font-weight: 700;
          color: #1d1d1d;
          text-transform: uppercase;
        }

        input, select {
          width: 100%;
          height: 42px;
          margin-top: 8px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid #d1c4a3;
          background: rgba(255, 255, 255, 0.95);
          font-size: 15px;
        }

        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .pwdWrap { position: relative; }
        .eyeBtn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6a512a;
        }

        .btn {
          margin-top: 16px;
          width: 100%;
          height: 46px;
          background: #a38147;
          color: #fff;
          font-weight: bold;
          font-size: 17px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn:hover { background: #8d6e3e; }

        .cta {
          margin-top: 14px;
          color: #604a23;
          font-size: 15px;
        }
        .cta a {
          color: #0047ff;
          font-weight: bold;
          text-decoration: none;
        }
        .cta a:hover { text-decoration: underline; }

        .msg { margin-top: 8px; font-size: 14px; color: #604a23; }
        .error { color: #c81e1e; font-size: 13px; margin-top: 2px; text-align: left; }

        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}