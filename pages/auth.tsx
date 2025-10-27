import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

type Mode = 'login' | 'register' | 'verify';

export default function AuthPage() {
  // ===== Router =====
  const router = useRouter();

  // ===== Vistas =====
  const [mode, setMode] = useState<Mode>('login');

  // ===== LOGIN =====
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // ===== REGISTRO =====
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

  // ===== VERIFICACIÓN (OTP) =====
  const [pendingEmail, setPendingEmail] = useState(''); // correo principal lower
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // ===== UI & mensajes =====
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  // --------------------------
  // Helpers
  // --------------------------
  const debounce = (fn: Function, ms = 400) => {
    let t: any;
    return (...args: any[]) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Validadores
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isCell  = (s: string) => /^\d{9}$/.test(s); // Perú: 9 dígitos
  const isRegisterFormComplete = Boolean(
    nombres.trim() &&
    apellidos.trim() &&
    (tipoDoc === 'DNI' || tipoDoc === 'CE') &&
    numDoc.trim() &&
    isCell(celular.trim()) &&
    isEmail(correoP.trim()) &&
    isEmail(correoR.trim()) &&
    pwdReg.trim().length >= 6
  );
  const canSubmitRegister = Boolean(isRegisterFormComplete && !dupP && !dupR && !loading);

  // --------------------------
  // Detección de correos duplicados (VIEW: usuarios_email_check)
  // --------------------------
  const checkCorreo = useMemo(
    () =>
      debounce(async (correo: string, tipo: 'P' | 'R') => {
        if (!correo) return;
        const emailLC = correo.trim().toLowerCase();

        const { data } = await supabase
          .from('usuarios_email_check')
          .select('usuario, correo_recuperacion')
          .or(`usuario.eq.${emailLC},correo_recuperacion.eq.${emailLC}`);

        const exists = Array.isArray(data) && data.length > 0;
        if (tipo === 'P') setDupP(exists);
        else setDupR(exists);
      }, 300),
    []
  );

  useEffect(() => {
    if (mode === 'register' && correoP) checkCorreo(correoP, 'P');
  }, [correoP, mode, checkCorreo]);

  useEffect(() => {
    if (mode === 'register' && correoR) checkCorreo(correoR, 'R');
  }, [correoR, mode, checkCorreo]);

  // --------------------------
  // LOGIN
  // --------------------------
    async function onSubmitLogin(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setMsg(null);
      setLoading(true);

      try {
        // 1) Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });
        if (error || !data?.user) throw new Error('Usuario no reconocido.');

        // 2) Perfil de negocio
        const { data: perfil, error: qerr } = await supabase
          .from('usuarios')
          .select('estado')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (qerr) throw new Error('No se pudo validar tu perfil.');
        if (!perfil) throw new Error('Usuario no registrado en el sistema.');
        if (perfil.estado !== 'ACTIVO') {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta no está activa (Pendiente/Inactiva).');
        }

        
      // Redirección robusta: primero router, luego forzamos con location
      try {
        await router.replace('/');
      } finally {
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.assign('/'); // fuerza navegación aunque el Router falle
        }
      }
      return; // evita más renders en esta vista
      } catch (err: any) {
        setMsg(err?.message ?? 'Ocurrió un error.');
      } finally {
        setLoading(false);
      }
    }

  // --------------------------
  // REGISTRO (solo crea cuenta y envía OTP; NO escribe en `usuarios`)
  // --------------------------
  async function onSubmitRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitRegister) return;

    setMsg(null);
    setLoading(true);

    const emailP = correoP.trim().toLowerCase();
    const emailR = correoR.trim().toLowerCase();

    // Doble chequeo de duplicados
    {
      const { data: d1 } = await supabase
        .from('usuarios_email_check')
        .select('usuario').eq('usuario', emailP);
      if (Array.isArray(d1) && d1.length > 0) {
        setDupP(true); setMsg('Correo principal ya registrado.'); setLoading(false); return;
      }
    }
    {
      const { data: d2 } = await supabase
        .from('usuarios_email_check')
        .select('correo_recuperacion').eq('correo_recuperacion', emailR);
      if (Array.isArray(d2) && d2.length > 0) {
        setDupR(true); setMsg('Correo de recuperación ya registrado.'); setLoading(false); return;
      }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: emailP,
        password: pwdReg,
        options: {
          data: { nombres, apellidos, tipo_doc: tipoDoc, num_doc: numDoc, celular, correo_recuperacion: emailR },
          emailRedirectTo: undefined, // OTP por código
        },
      });
      if (error) throw error;

      setPendingEmail(emailP);
      setMode('verify');
      setMsg('Te enviamos un código de 6 dígitos a tu correo. Ingresa el código para completar el registro.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputsRef.current[0]?.focus(), 80);
    } catch (err: any) {
      setMsg(err.message ?? 'No se pudo iniciar el registro.');
    } finally {
      setLoading(false);
    }
  }

  // --------------------------
  // VERIFICACIÓN OTP
  // --------------------------
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // solo 0-9 y vacío
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length) {
      const next = text.split('');
      while (next.length < 6) next.push('');
      setOtp(next);
      setTimeout(() => inputsRef.current[5]?.focus(), 0);
    }
    e.preventDefault();
  };

  // --------------------------
  // VERIFICACIÓN OTP (confirma email e inserta en `usuarios` con ACTIVO)
  // --------------------------
  async function onSubmitVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6 || !pendingEmail) {
      setMsg('Ingresa los 6 dígitos.');
      return;
    }
    setLoading(true);
    setMsg(null);

    try {
      // 1) Confirmar la cuenta (crea sesión)
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token,
        type: 'signup',
      });
      if (vErr) throw vErr;

      // 2) Obtener user.id de la sesión
      const { data: gu } = await supabase.auth.getUser();
      const authUserId = gu?.user?.id;
      if (!authUserId) throw new Error('No hay sesión activa tras verificar el correo.');

      // 3) Insertar fila de negocio en `usuarios` con estado ACTIVO
      const { error: insErr } = await supabase.from('usuarios').insert([{
        auth_user_id: authUserId,
        nombres,
        apellidos,
        tipo_doc: tipoDoc,
        num_doc: numDoc,
        celular,
        usuario: pendingEmail,                    // correo principal
        correo_recuperacion: correoR.trim().toLowerCase(),
        estado: 'ACTIVO',                          // <<— ACTIVADO automáticamente
      }]);
      if (insErr) throw insErr;

      setMsg('¡Correo verificado! Tu cuenta fue creada correctamente.');
      setMode('login');

      // Limpiar form
      setNombres(''); setApellidos(''); setTipoDoc('DNI'); setNumDoc('');
      setCelular(''); setCorreoP(''); setCorreoR(''); setPwdReg('');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setMsg(err.message ?? 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <>
      <Head>
        <title>Acceso — Realty Grupo Inmobiliario</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className="wrap">
        <div className="overlay" />
        <div className={`glass ${mode !== 'login' ? 'isFlipped' : ''}`}>
          <div className="flip3d">
            {/* FRONT: LOGIN */}
            <div className="face front">
              <div className="logo" aria-hidden>
                <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority style={{ objectFit: 'contain' }} />
              </div>
              <h1>REALTY GRUPO INMOBILIARIO</h1>

              <form onSubmit={onSubmitLogin} className="form" noValidate>
                <label htmlFor="email">Correo Corporativo</label>
                <div className="field">
                  <input id="email" name="email" type="email"
                    placeholder="nombre.apellido@realtygi.pe" value={email}
                    onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>

                <label htmlFor="password">Contraseña</label>
                <div className="field pwdWrap">
                  <input id="password" name="password" type={showPwd ? 'text' : 'password'}
                    placeholder="Contraseña" value={pwd}
                    onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" required />
                  <button type="button" className="eyeBtn"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
                    title={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>

                <label className="remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Recuérdame</span>
                </label>

                {msg && mode === 'login' && <div className="msg">{msg}</div>}

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Procesando...' : 'Iniciar Sesión'}
                </button>

                <Link href="#" className="forgot">¿Olvidaste tu contraseña?</Link>

                <p className="cta">
                  ¿No tienes cuenta?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setMsg(null); setMode('register'); }}>
                    Regístrate aquí
                  </a>
                </p>
              </form>
            </div>

            {/* BACK: REGISTRO & VERIFICACIÓN */}
            <div className="face back">
              <div className="logo" aria-hidden>
                <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority style={{ objectFit: 'contain' }} />
              </div>

              {mode === 'register' && (
                <>
                  <h1>REGISTRO DE USUARIO</h1>
                  <form onSubmit={onSubmitRegister} className="form formRegister" noValidate>
                    <div className="g2">
                      <div className="field"><input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required /></div>
                      <div className="field"><input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required /></div>
                    </div>

                    <div className="g2">
                      <div className="field">
                        <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value as 'DNI' | 'CE')}>
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>
                      <div className="field"><input placeholder={tipoDoc} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} required /></div>
                    </div>

                    <div className="field"><input placeholder="Correo principal" type="email" value={correoP} onChange={(e) => setCorreoP(e.target.value)} required /></div>
                    <div className="errLine">{dupP && <span className="error">Correo principal ya registrado</span>}</div>

                    <div className="field"><input placeholder="Correo de recuperación" type="email" value={correoR} onChange={(e) => setCorreoR(e.target.value)} required /></div>
                    <div className="errLine">{dupR && <span className="error">Correo de recuperación ya registrado</span>}</div>

                    <div className="g2">
                      <div className="field"><input placeholder="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} required /></div>
                      <div className="field pwdWrap">
                        <input placeholder="Contraseña" type={showPwdReg ? 'text' : 'password'} value={pwdReg} onChange={(e) => setPwdReg(e.target.value)} required />
                        <button type="button" className="eyeBtn" onClick={() => setShowPwdReg((s) => !s)}>{showPwdReg ? '🙈' : '👁️'}</button>
                      </div>
                    </div>

                    {msg && mode === 'register' && <div className="msg">{msg}</div>}

                    <button className="btn" disabled={!canSubmitRegister}>
                      {loading ? 'Procesando…' : 'Registrarme'}
                    </button>

                    <p className="cta">
                      ¿Ya tienes cuenta?{' '}
                      <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setMsg(null); }}>Iniciar Sesión</a>
                    </p>
                  </form>
                </>
              )}

              {mode === 'verify' && (
                <>
                  <h1>CÓDIGO DE VERIFICACIÓN</h1>
                  <p style={{ marginTop: 6 }}>Hemos enviado un código de 6 dígitos a <b>{pendingEmail}</b></p>
                  <form onSubmit={onSubmitVerify} className="form" noValidate>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
                      {otp.map((v, i) => (
                        <input
                          key={i}
                          ref={(el) => {(inputsRef.current[i] = el)}}
                          inputMode="numeric"
                          maxLength={1}
                          value={v}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          style={{ width: 40, height: 46, textAlign: 'center', fontSize: 20, borderRadius: 8, border: '1px solid #d1c4a3' }}
                          required
                        />
                      ))}
                    </div>

                    {msg && mode === 'verify' && <div className="msg">{msg}</div>}

                    <button className="btn" disabled={loading}>
                      {loading ? 'Verificando…' : 'Confirmar código'}
                    </button>

                    <p className="cta" style={{ marginTop: 10 }}>
                      ¿Escribiste mal tu correo?{' '}
                      <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setMsg(null); }}>
                        Volver al registro
                      </a>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}