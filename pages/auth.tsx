import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import '../styles/auth.css';

type Mode = 'login' | 'register' | 'verify';

export default function AuthPage() {
  const router = useRouter();
  const nextParam = typeof router.query.next === 'string' ? router.query.next : '/';
  const safeNext = nextParam?.startsWith('/') ? nextParam : '/';
  const supabase = useSupabaseClient(); // 👈 ESTE cliente escribe cookies

  // vistas
  const [mode, setMode] = useState<Mode>('login');

  // login
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // registro
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDoc, setTipoDoc] = useState<'DNI' | 'CE'>('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [celular, setCelular] = useState('');
  const [correoP, setCorreoP] = useState('');
  const [correoR, setCorreoR] = useState('');
  const [pwdReg, setPwdReg] = useState('');
  const [showPwdReg, setShowPwdReg] = useState(false);

  // verificación
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // ui
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // helpers
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isCell  = (s: string) => /^\d{9}$/.test(s);

  // ⬇⬇⬇ AGREGA ESTO
  useEffect(() => {
    console.log('[Auth] Componente montado. query.next =', router.query.next, 'safeNext =', safeNext);
  }, [router.query.next, safeNext]);

  useEffect(() => {
    const hStart = (url: string) => console.log('[Router] routeChangeStart ->', url);
    const hErr = (err: any, url: string) => console.warn('[Router] routeChangeError ->', url, err);
    router.events.on('routeChangeStart', hStart);
    router.events.on('routeChangeError', hErr);
    return () => {
      router.events.off('routeChangeStart', hStart);
      router.events.off('routeChangeError', hErr);
    };
  }, [router.events]);

  useEffect(() => {
    router.prefetch(safeNext).catch(()=>{});
  }, [router, safeNext]);
  // ⬆⬆⬆

  // -------------- LOGIN --------------
  async function onSubmitLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
      console.log('[Auth] onSubmitLogin triggered'); // 👈 agrega esto
      console.log('[Auth] onSubmitLogin TRIGGER');            // <-- NUEVO
    setMsg(null);
    setLoading(true);
    try {
      console.log('[Auth] onSubmitLogin START', { email }); // ⬅️ AGREGA
      console.log('[Auth] START', { email });               // <-- NUEVO
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      console.log('[Auth] RESULT', { user: data?.user, error }); // <-- NUEVO
      console.log('[Auth] signInWithPassword result:', { user: data?.user, error }); // ⬅️ mantiene
      console.log('signInWithPassword -> data:', data, 'error:', error);
      if (error || !data?.user) throw error ?? new Error('Usuario no reconocido.');

      // Intento (no bloqueante) de leer perfil
      try {
        const { data: perfil, error: perr } = await supabase
          .from('usuarios')
          .select('estado')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        console.log('perfil usuarios:', { perfil, perr });

        // Si existe y no está ACTIVO, puedes decidir bloquear. Dejo NO bloqueante:
        if (perfil && perfil.estado !== 'ACTIVO') {
          console.warn('Estado de cuenta != ACTIVO:', perfil.estado);
        }
      } catch (e) {
        console.warn('Lectura de perfil falló (RLS/políticas). No se bloquea el login.', e);
      }

       console.log('[Auth] Redirigiendo a', safeNext); // ⬅️ AGREGA

      // Redirigir (primero Router, luego por si acaso)
      try {
        console.log('[Auth] Redirigiendo a', safeNext);
        await router.replace(safeNext);
      } finally {
        if (typeof window !== 'undefined' && window.location.pathname !== safeNext) {
          window.location.assign(safeNext);
        }
      }
      return;
    } catch (err: any) {
      console.error('[Auth] Login error:', err); // ⬅️ Asegura prefijo
      setMsg(err?.message ?? 'Error iniciando sesión.');
    } finally {
      setLoading(false);
      console.log('[Auth] onSubmitLogin END'); // ⬅️ AGREGA
    }
  }

  // -------------- REGISTRO --------------
  const canSubmitRegister =
    nombres.trim() &&
    apellidos.trim() &&
    (tipoDoc === 'DNI' || tipoDoc === 'CE') &&
    numDoc.trim() &&
    isCell(celular.trim()) &&
    isEmail(correoP.trim()) &&
    isEmail(correoR.trim()) &&
    pwdReg.trim().length >= 6;

  async function onSubmitRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitRegister) return;

    setMsg(null);
    setLoading(true);

    const emailP = correoP.trim().toLowerCase();
    const emailR = correoR.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signUp({
        email: emailP,
        password: pwdReg,
        options: {
          data: {
            nombres,
            apellidos,
            tipo_doc: tipoDoc,
            num_doc: numDoc,
            celular,
            correo_recuperacion: emailR,
          },
          emailRedirectTo: undefined,
        },
      });
      if (error) throw error;

      setPendingEmail(emailP);
      setMode('verify');
      setMsg('Te enviamos un código de 6 dígitos a tu correo.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputsRef.current[0]?.focus(), 80);
    } catch (err: any) {
      console.error('signUp error:', err);
      setMsg(err?.message ?? 'No se pudo iniciar el registro.');
    } finally {
      setLoading(false);
    }
  }

  // -------------- VERIFICACIÓN OTP --------------
  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  async function onSubmitVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6 || !pendingEmail) {
      setMsg('Ingresa los 6 dígitos.'); return;
    }
    setMsg(null);
    setLoading(true);

    try {
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token,
        type: 'signup',
      });
      if (vErr) throw vErr;

      const { data: gu } = await supabase.auth.getUser();
      const authUserId = gu?.user?.id;
      if (!authUserId) throw new Error('No hay sesión tras verificar.');

      const { error: insErr } = await supabase.from('usuarios').insert([{
        auth_user_id: authUserId,
        nombres,
        apellidos,
        tipo_doc: tipoDoc,
        num_doc: numDoc,
        celular,
        usuario: pendingEmail,
        correo_recuperacion: correoR.trim().toLowerCase(),
        estado: 'ACTIVO',
      }]);
      if (insErr) console.warn('Insert usuarios warning:', insErr); // si RLS bloquea, no impedimos el login

      setMsg('¡Correo verificado! Ya puedes iniciar sesión.');
      setMode('login');
      // Limpio
      setNombres(''); setApellidos(''); setTipoDoc('DNI'); setNumDoc('');
      setCelular(''); setCorreoP(''); setCorreoR(''); setPwdReg(''); setOtp(['','','','','','']);
    } catch (err: any) {
      console.error('verifyOtp error:', err);
      setMsg(err?.message ?? 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Acceso — Realty Grupo Inmobiliario</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className="wrap">
        <div className="overlay" />
        <div className={`auth-glass ${mode !== 'login' ? 'isFlipped' : ''}`}>
          <div className="flip3d">
            {/* LOGIN */}
            <div className="face front">
              <div className="logo" aria-hidden>
                <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority style={{ objectFit: 'contain' }} />
              </div>
              <h1>REALTY GRUPO INMOBILIARIO</h1>

              <form onSubmit={onSubmitLogin} className="form" noValidate>
                <label htmlFor="email">Correo Corporativo</label>
                <div className="field">
                  <input id="email" type="email" placeholder="nombre.apellido@realtygi.pe"
                    value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
                </div>

                <label htmlFor="password">Contraseña</label>
                <div className="field pwdWrap">
                  <input id="password" type={showPwd ? 'text' : 'password'} placeholder="Contraseña"
                    value={pwd} onChange={(e)=>setPwd(e.target.value)} autoComplete="current-password" required />
                  <button type="button" className="eyeBtn" onClick={()=>setShowPwd(s=>!s)}>{showPwd ? '🙈' : '👁️'}</button>
                </div>

                {msg && mode === 'login' && <div className="msg">{msg}</div>}

                <button
                    type="submit"
                    className="btn"
                    disabled={loading}
                    onClick={(e) => {
                      console.log('[Auth] BUTTON CLICK');
                      // fuerza el evento submit del form (por si el click no lo dispara)
                      e.currentTarget.form?.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                      );
                    }}
                  >
                    {loading ? 'Procesando...' : 'Iniciar Sesión'}
                  </button>

                <p className="cta">¿No tienes cuenta?{' '}
                  <a href="#" onClick={(e)=>{e.preventDefault(); setMsg(null); setMode('register');}}>Regístrate aquí</a>
                </p>
              </form>
            </div>

            {/* REVERSO: REGISTRO + OTP */}
            <div className="face back">
              <div className="logo" aria-hidden>
                <Image src="/logo.png" alt="Logo Realty GI" width={64} height={64} priority style={{ objectFit: 'contain' }} />
              </div>

              {mode === 'register' && (
                <>
                  <h1>REGISTRO DE USUARIO</h1>
                  <form onSubmit={onSubmitRegister} className="form formRegister">
                    <div className="g2">
                      <div className="field"><input placeholder="Nombres" value={nombres} onChange={(e)=>setNombres(e.target.value)} required /></div>
                      <div className="field"><input placeholder="Apellidos" value={apellidos} onChange={(e)=>setApellidos(e.target.value)} required /></div>
                    </div>

                    <div className="g2">
                      <div className="field">
                        <select value={tipoDoc} onChange={(e)=>setTipoDoc(e.target.value as 'DNI'|'CE')}>
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>
                      <div className="field"><input placeholder={tipoDoc} value={numDoc} onChange={(e)=>setNumDoc(e.target.value)} required /></div>
                    </div>

                    <div className="field"><input placeholder="Correo principal" type="email" value={correoP} onChange={(e)=>setCorreoP(e.target.value)} required /></div>
                    <div className="field"><input placeholder="Correo de recuperación" type="email" value={correoR} onChange={(e)=>setCorreoR(e.target.value)} required /></div>

                    <div className="g2">
                      <div className="field"><input placeholder="Celular" value={celular} onChange={(e)=>setCelular(e.target.value)} required /></div>
                      <div className="field pwdWrap">
                        <input placeholder="Contraseña" type={showPwdReg ? 'text' : 'password'} value={pwdReg} onChange={(e)=>setPwdReg(e.target.value)} required />
                        <button type="button" className="eyeBtn" onClick={()=>setShowPwdReg(s=>!s)}>{showPwdReg ? '🙈' : '👁️'}</button>
                      </div>
                    </div>

                    {msg && mode === 'register' && <div className="msg">{msg}</div>}

                    <button className="btn" disabled={!canSubmitRegister || loading}>
                      {loading ? 'Procesando…' : 'Registrarme'}
                    </button>

                    <p className="cta">¿Ya tienes cuenta?{' '}
                      <a href="#" onClick={(e)=>{e.preventDefault(); setMode('login'); setMsg(null);}}>Iniciar Sesión</a>
                    </p>
                  </form>
                </>
              )}

              {mode === 'verify' && (
                <>
                  <h1>CÓDIGO DE VERIFICACIÓN</h1>
                  <p>Hemos enviado un código a <b>{pendingEmail}</b></p>
                  <form onSubmit={onSubmitVerify} className="form" noValidate>
                    <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'16px 0' }}>
                      {otp.map((v,i)=>(
                        <input key={i} ref={(el)=>{inputsRef.current[i]=el}}
                          inputMode="numeric" maxLength={1} value={v}
                          onChange={(e)=>handleOtpChange(i,e.target.value)}
                          style={{ width:40, height:46, textAlign:'center', fontSize:20, borderRadius:8, border:'1px solid #d1c4a3' }}
                          required />
                      ))}
                    </div>
                    {msg && mode === 'verify' && <div className="msg">{msg}</div>}
                    <button className="btn" disabled={loading}>{loading ? 'Verificando…' : 'Confirmar código'}</button>
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
    background: rgba(255, 255, 255, 0.12);
    z-index: 0;
  }

  .glass {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
    height: 560px;
    padding: 0;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(14px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
    color: #222;
    text-align: center;
    animation: fadeUp 0.7s ease-out both;
    perspective: 1400px;
    overflow: hidden;
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

  .g2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .formRegister {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field, .pwdWrap {
    margin: 0;
  }

  .errLine { min-height: 14px; line-height: 14px; }
  .error { color: #c81e1e; font-size: 12px; display: inline-block; }
`}</style>