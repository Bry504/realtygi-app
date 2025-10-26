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
  const [dupP, setDupP] = useState<null | boolean>(null);
  const [dupR, setDupR] = useState<null | boolean>(null);

  // Debounce para verificar correos duplicados
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
  }, [correoP]);

  useEffect(() => {
    if (mode === 'register' && correoR) checkCorreo(correoR, 'R');
  }, [correoR]);

  // ====== LOGIN SUBMIT ======
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
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ====== REGISTRO SUBMIT ======
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

  return (
    <>
      <Head>
        <title>Acceso — Realty Grupo Inmobiliario</title>
      </Head>

      <main className="wrap">
        <div className={`flip-container ${mode === 'register' ? 'flipped' : ''}`}>
          {/* FRONT: LOGIN */}
          <div className="face front">
            <div className="logo">
              <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority />
            </div>
            <h1>REALTY GRUPO INMOBILIARIO</h1>

            <form onSubmit={onSubmitLogin} className="form">
              <label>Correo Corporativo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority />
            </div>
            <h1>REGISTRO DE USUARIO</h1>

            <form onSubmit={onSubmitRegister} className="form">
              <input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
              <input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
              <div className="row">
                <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value as any)}>
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                </select>
                <input placeholder={tipoDoc} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} required />
              </div>
              <input placeholder="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} required />
              <input
                placeholder="Correo principal"
                type="email"
                value={correoP}
                onChange={(e) => setCorreoP(e.target.value)}
                required
              />
              {dupP && <p className="error">Correo principal ya registrado</p>}
              <input
                placeholder="Correo de recuperación"
                type="email"
                value={correoR}
                onChange={(e) => setCorreoR(e.target.value)}
                required
              />
              {dupR && <p className="error">Correo de recuperación ya registrado</p>}
              <input
                placeholder="Contraseña"
                type="password"
                value={pwdReg}
                onChange={(e) => setPwdReg(e.target.value)}
                required
              />

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
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background-image: url('/auth-bg.jpg');
          background-size: cover;
          background-position: center;
          perspective: 1200px;
        }
        .flip-container {
          position: relative;
          width: 400px;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        .flip-container.flipped {
          transform: rotateY(180deg);
        }
        .face {
          position: absolute;
          width: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px);
          padding: 32px 24px;
          text-align: center;
        }
        .back {
          transform: rotateY(180deg);
        }
        .btn {
          margin-top: 10px;
          width: 100%;
          height: 46px;
          background: #a38147;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .row {
          display: flex;
          gap: 6px;
        }
        .error {
          color: red;
          font-size: 13px;
          margin-top: -6px;
          text-align: left;
        }
      `}</style>
    </>
  );
}