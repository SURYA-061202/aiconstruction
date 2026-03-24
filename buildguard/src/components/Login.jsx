import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Shield, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      if (mode === 'register') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally { setLoading(false); }
  };

  const toggle = () => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setName(''); };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: 'hidden'
    }}>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .login-input {
                    width: 100%;
                    padding: 14px 16px 14px 44px;
                    background: #F8F9FA;
                    border: 1.5px solid #EAEAEA;
                    border-radius: 12px;
                    font-size: 14px;
                    color: #111;
                    font-family: 'Inter', sans-serif;
                    outline: none;
                    transition: all 0.2s;
                }
                .login-input:focus {
                    border-color: #111827;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(17,24,39,0.06);
                }
                .login-input::placeholder { color: #B0B7C3; }

                .login-btn {
                    width: 100%;
                    padding: 15px;
                    background: #111827;
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .login-btn:hover:not(:disabled) { background: #1F2937; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(17,24,39,0.2); }
                .login-btn:active:not(:disabled) { transform: translateY(0); }
                .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .ldots { display: inline-flex; gap: 4px; align-items: center; }
                .ldots i { display: block; width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: ldp 0.8s ease-in-out infinite; }
                .ldots i:nth-child(2) { animation-delay: 0.14s; }
                .ldots i:nth-child(3) { animation-delay: 0.28s; }
                @keyframes ldp {
                    0%,80%,100% { opacity: 0.25; transform: scale(0.6); }
                    40% { opacity: 1; transform: scale(1); }
                }
            `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D0D0D 0%, #1a1a2e 60%, #0D0D0D 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
        padding: '48px 64px 60px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '-5%',
          width: 240, height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64, position: 'relative' }}>
          <div style={{
            width: 36, height: 36, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            overflow: 'hidden'
          }}>
            <img src="/images/indianinfra.png" alt="Indianinfra Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>AI Construction</span>
        </div>

        {/* Main Content */}
        <div style={{ position: 'relative', marginTop: 120 }}>
          <h1 style={{
            fontSize: 44, fontWeight: 800, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.03em',
            marginBottom: 20
          }}>
            Hallucination-Aware<br />
            <span style={{ color: '#fff' }}>
              Validation Engine
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: '#C9D1D9', lineHeight: 1.75,
            fontWeight: 400, marginBottom: 48
          }}>
            BuildGuard leverages the RCK Engine to perform deep, multi-axis scans of blueprints, identifying potential compliance gaps that human reviewers might overlook.
          </p>

          {/* Feature Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Multi-axis blueprint scanning' },
              { label: 'Compliance gap detection' },
              { label: 'Real-time hallucination analysis' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#4B5563',
                  flexShrink: 0
                }} />
                <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 400 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        background: 'radial-gradient(circle at center, #FFFFFF 40%, #FAFBFC 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 64px',
        position: 'relative', overflow: 'hidden'
      }}>


        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            style={{ width: '100%', maxWidth: 400 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              border: '1px solid #F0F0F0',
              borderRadius: 16,
              padding: '28px 28px 24px',
              background: '#FCFCFC',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 4, textAlign: 'center' }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#9CA3AF', fontWeight: 400, marginBottom: 0, textAlign: 'center' }}>
                {mode === 'login'
                  ? 'Sign in to access your intelligence dashboard.'
                  : 'Create your account — no credit card required.'}
              </p>
              <div style={{ marginBottom: 20 }} />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: 10, padding: '10px 14px',
                      fontSize: 13, color: '#991B1B', marginBottom: 20
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#B0B7C3' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <input className="login-input" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#B0B7C3' }}>
                    <Mail size={16} />
                  </div>
                  <input className="login-input" type="email" placeholder="Business Email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#B0B7C3' }}>
                    <Lock size={16} />
                  </div>
                  <input
                    className="login-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#B0B7C3',
                      display: 'flex', padding: 4, transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#374151'}
                    onMouseLeave={e => e.currentTarget.style.color = '#B0B7C3'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {mode === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12.5, color: '#6B7280', fontFamily: 'Inter, sans-serif',
                      transition: 'color 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#111827'}
                      onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 4 }}>
                  {loading
                    ? <div className="ldots"><i /><i /><i /></div>
                    : <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={16} />
                    </>
                  }
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
                <span style={{ fontSize: 11.5, color: '#D1D5DB' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
              </div>

              {/* Toggle */}
              <p style={{ textAlign: 'center', fontSize: 13.5, color: '#9CA3AF' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={toggle} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 600, color: '#111827',
                  fontFamily: 'Inter, sans-serif',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.5'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}