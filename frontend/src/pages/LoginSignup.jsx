import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────
   Interactive 3D Geometric Background (verbatim from LandingPage)
   ───────────────────────────────────────────────────────── */
const GeometricBackground = () => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);
  const [transform, setTransform] = useState({ rx: 55, ry: 0, t: 0 });

  const animate = useCallback(() => {
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    setTransform(prev => ({
      rx: 55 + my * 12,
      ry: mx * 12,
      t: prev.t + 0.008,
    }));
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    animRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [animate]);

  const blocks = useRef(
    Array.from({ length: 64 }, (_, i) => {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const isYellow = (row + col) % 3 === 0;
      const heightVar = 40 + Math.random() * 120;
      const phase = Math.random() * Math.PI * 2;
      const amplitude = 15 + Math.random() * 35;
      return { row, col, isYellow, heightVar, phase, amplitude };
    })
  ).current;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FFF8EF 0%, #FFF1D6 100%)',
        perspective: '1400px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '1600px',
          height: '1600px',
          transformStyle: 'preserve-3d',
          transform: `
            translate(-50%, -50%)
            rotateX(${transform.rx}deg)
            rotateZ(${transform.ry}deg)
          `,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          gap: '8px',
          padding: '20px',
        }}>
          {blocks.map((block, i) => {
            const elevation = Math.sin(transform.t * 2 + block.phase) * block.amplitude;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(${elevation}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  height: `${block.heightVar}px`,
                  backgroundColor: block.isYellow ? '#FFD600' : '#FFFFFF',
                  border: '2px solid rgba(17,17,17,0.25)',
                  boxShadow: block.isYellow
                    ? 'inset 0 0 20px rgba(255,214,0,0.2)'
                    : 'inset 0 0 15px rgba(0,0,0,0.02)',
                  transformOrigin: 'bottom',
                  opacity: 0.72,
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: '-1px',
                  width: '20px',
                  height: `${block.heightVar}px`,
                  backgroundColor: block.isYellow ? 'rgba(230,193,0,0.5)' : 'rgba(232,232,232,0.5)',
                  borderRight: '2px solid rgba(17,17,17,0.15)',
                  borderTop: '2px solid rgba(17,17,17,0.15)',
                  borderBottom: '2px solid rgba(17,17,17,0.15)',
                  transform: 'rotateY(90deg)',
                  transformOrigin: 'left',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: `${-20 + (block.heightVar)}px`,
                  left: 0,
                  width: '100%',
                  height: '20px',
                  backgroundColor: block.isYellow ? 'rgba(204,170,0,0.4)' : 'rgba(208,208,208,0.4)',
                  borderLeft: '2px solid rgba(17,17,17,0.15)',
                  borderRight: '2px solid rgba(17,17,17,0.15)',
                  borderBottom: '2px solid rgba(17,17,17,0.15)',
                  transform: 'rotateX(-90deg)',
                  transformOrigin: 'top',
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Light bloom */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '40%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(255,214,0,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        opacity: 0.5,
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, rgba(255,248,239,0.1) 0%, rgba(255,248,239,0.4) 55%, rgba(255,248,239,0.8) 80%, rgba(255,248,239,1) 100%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   OAuth Icon SVGs
   ───────────────────────────────────────────────────────── */
const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────
   Login / Signup Page
   ───────────────────────────────────────────────────────── */
function LoginSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Redirect to landing page after "login"
    navigate('/landing');
  };

  const inputStyle = {
    padding: 'var(--space-md)',
    border: 'var(--border-width) solid var(--border-color)',
    fontFamily: 'var(--font-data-mono-family)',
    fontSize: '15px',
    backgroundColor: 'var(--surface-container-lowest)',
    width: '100%',
    outline: 'none',
    transition: 'box-shadow 0.1s',
  };

  const oauthBtnBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    width: '100%',
    padding: 'var(--space-md)',
    border: 'var(--border-width) solid var(--border-color)',
    fontFamily: 'var(--font-ui-label-lg-family)',
    fontSize: 'var(--font-ui-label-lg-size)',
    fontWeight: 'var(--font-ui-label-lg-weight)',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    borderRadius: 0,
    boxShadow: 'var(--shadow-offset) var(--shadow-offset) 0 var(--shadow-color)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)',
      position: 'relative',
    }}>
      <GeometricBackground />

      {/* Two-panel card */}
      <div style={{
        display: 'flex',
        gap: 0,
        maxWidth: '920px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        border: 'var(--border-width) solid var(--border-color)',
        boxShadow: '8px 8px 0 var(--shadow-color)',
      }}>

        {/* ── Left Panel: Sign In ── */}
        <div style={{
          flex: 1,
          padding: 'var(--space-xl)',
          backgroundColor: 'rgba(255,248,239,0.92)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRight: 'var(--border-width) solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>OpsOracle</h1>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>
              V2.4.0-STABLE // AUTHENTICATE
            </p>
          </div>

          <h2 style={{ fontSize: '20px', marginBottom: 'var(--space-sm)' }}>Sign In</h2>

          {/* GitHub OAuth */}
          <button
            id="btn-github-login"
            style={{
              ...oauthBtnBase,
              backgroundColor: '#111111',
              color: '#ffffff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-2px,-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0 #111111';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0,0)';
              e.currentTarget.style.boxShadow = '4px 4px 0 #111111';
            }}
            onClick={() => navigate('/landing')}
          >
            <GitHubIcon />
            Continue with GitHub
          </button>

          {/* Google OAuth */}
          <button
            id="btn-google-login"
            style={{
              ...oauthBtnBase,
              backgroundColor: '#ffffff',
              color: '#111111',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-2px,-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0 #111111';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0,0)';
              e.currentTarget.style.boxShadow = '4px 4px 0 #111111';
            }}
            onClick={() => navigate('/landing')}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            margin: 'var(--space-xs) 0',
          }}>
            <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border-color)', opacity: 0.2 }} />
            <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', textTransform: 'lowercase' }}>or</span>
            <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border-color)', opacity: 0.2 }} />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label className="ui-label-sm" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@opsOracle.dev"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="ui-label-sm" htmlFor="login-password">Password</label>
                <a href="#" className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', fontSize: '11px' }}>Reset?</a>
              </div>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={inputStyle}
              />
            </div>

            <button
              id="btn-initialize-session"
              type="submit"
              className="neo-button"
              style={{ width: '100%', marginTop: 'var(--space-xs)', fontSize: '15px', padding: 'var(--space-md)' }}
            >
              Initialize Session
            </button>
          </form>

          {/* Bottom link */}
          <p className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 'var(--space-xs)' }}>
            No account?{' '}
            <a href="#" style={{ color: 'var(--on-surface)', fontWeight: 700, textDecoration: 'underline' }}>
              Request access
            </a>
          </p>
        </div>

        {/* ── Right Panel: New Provision ── */}
        <div style={{
          flex: 1,
          backgroundColor: 'rgba(17,17,17,0.9)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--space-xl)',
          gap: 'var(--space-md)',
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'var(--primary-container)',
            border: '2px solid #111',
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-data-mono-family)',
            color: '#111',
            fontWeight: 700,
            letterSpacing: '0.08em',
            width: 'fit-content',
          }}>
            NEW PROVISION
          </div>

          <h2 style={{ color: 'var(--primary-container)', fontSize: '28px' }}>
            New Provision
          </h2>

          <p className="data-mono" style={{ fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.72)' }}>
            Install OpsOracle on your GitHub repositories. Get automated security scanning, AI-powered patching, and real-time risk tracking — without changing your workflow.
          </p>

          <ul style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            margin: 'var(--space-sm) 0',
          }}>
            {['Instant PR scanning', 'AI-powered patch generation', 'SOC2 / ISO27001 mapping', 'Auto-rollback on drift'].map(item => (
              <li key={item} className="data-mono" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--primary-container)', fontSize: '16px', lineHeight: 1 }}>▸</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            id="btn-request-access"
            className="neo-button"
            style={{ alignSelf: 'flex-start', backgroundColor: 'var(--primary-container)', color: '#111' }}
          >
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
