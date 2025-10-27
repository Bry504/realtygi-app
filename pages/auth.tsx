import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

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
        <div className={`glass ${mode !== 'login' ? 'isFlipped' : ''}`}>
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