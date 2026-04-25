import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────
   Interactive 3D Geometric Background
   Pure CSS 3D transforms + requestAnimationFrame.
   Replicates the Spline floating-cubes aesthetic with
   mouse-driven parallax — zero external dependencies.
   ───────────────────────────────────────────────────────── */
const GeometricBackground = () => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);
  const [transform, setTransform] = useState({ rx: 55, ry: 0, t: 0 });

  // Smooth mouse tracking via rAF
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

  // Pre-generate block configs once
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
      {/* 3D Tilted Grid Container */}
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
        {/* Grid floor plane with lines */}
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
                {/* Top face */}
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

                {/* Right face (3D depth) */}
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

                {/* Bottom face (3D depth) */}
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

      {/* Light bloom / glow effect */}
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

      {/* Vignette fade — stronger to push focus to content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at center, rgba(255,248,239,0.1) 0%, rgba(255,248,239,0.4) 55%, rgba(255,248,239,0.8) 80%, rgba(255,248,239,1) 100%)
        `,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      <GeometricBackground />

      {/* ── SECTION 1: Hero — scale adjusted ── */}
      <section
        style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          padding: 'var(--space-xl) var(--space-md)',
          textAlign: 'center',
        }}
      >
        {/* Pill badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--primary-container)',
            border: '2px solid #111111',
            borderRadius: '999px',
            padding: '6px 20px',
            marginBottom: '40px',
            boxShadow: '4px 4px 0 #111111',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui-label-sm-family)',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#111111',
            }}
          >
            AI-Powered DevSecOps
          </span>
        </div>

        {/* Main heading - Massive & Bold */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '140px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.06em',
            lineHeight: 0.9,
            maxWidth: '1100px',
            marginBottom: '40px',
            color: 'var(--on-surface)',
            filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.05))',
          }}
        >
          OpsOracle
        </h1>

        {/* Subheading line 1 */}
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '32px',
            fontWeight: 600,
            color: 'var(--on-surface)',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}
        >
          Stop merging broken infrastructure
        </p>

        {/* Subheading line 2 */}
        <p
          className="data-mono"
          style={{
            fontSize: '18px',
            color: 'var(--on-surface-variant)',
            maxWidth: '640px',
            marginBottom: '56px',
            lineHeight: 1.6,
          }}
        >
          The precision-engineered DevSecOps agent that autonomously scans,
          analyzes, and patches vulnerabilities before they reach production.
          Build with absolute structural integrity.
        </p>

        {/* CTA buttons - Larger */}
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="neo-button"
            style={{ fontSize: '18px', padding: '20px 40px' }}
            onClick={() => {
              const appName = 'your-app-slug-here'; // replace with your actual app slug
              window.location.href = `https://github.com/apps/Opsoracle/installations/new`;
            }}
          >
            Install on GitHub
          </button>
          <Link
            to="/dashboard"
            className="neo-button"
            style={{
              textDecoration: 'none',
              fontSize: '18px',
              padding: '20px 40px',
              backgroundColor: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '2px solid #111111',
              color: '#111111',
            }}
          >
            View Demo Dashboard
          </Link>
        </div>
      </section>

      {/* ── SECTION 2: Tactical Capabilities + Neural Pipeline ── */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 var(--space-md) var(--space-xl)',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'none',
          gap: 'var(--space-xl)',
        }}
      >
        {/* Tactical Capabilities */}
        <div className="dashboard-grid" style={{ maxWidth: '1200px', width: '100%' }}>
          <div className="col-span-12" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2>Tactical Capabilities</h2>
          </div>

          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>analytics</span>
            <h3 className="neo-card-header">Unified Context</h3>
            <p className="data-mono">Analyzes Terraform, Kubernetes manifests, Dockerfiles, and cloud formation scripts simultaneously with unified context.</p>
          </div>
          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>translate</span>
            <h3 className="neo-card-header">Plain English</h3>
            <p className="data-mono">Plain English translation of complex security vulnerabilities, pinpointing exact code lines and root causes.</p>
          </div>
          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>payments</span>
            <h3 className="neo-card-header">Cost Prediction</h3>
            <p className="data-mono">Predicts infrastructure cost anomalies introduced in PRs before they inflate your cloud bill.</p>
          </div>
          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>auto_fix_high</span>
            <h3 className="neo-card-header">Auto-Remediation</h3>
            <p className="data-mono">Generates ready-to-merge remediation patches for identified vulnerabilities, tested against current state.</p>
          </div>
          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>verified_user</span>
            <h3 className="neo-card-header">Compliance Mapping</h3>
            <p className="data-mono">Real-time mapping of infrastructure changes against SOC2, ISO27001, and CIS benchmarks.</p>
          </div>
          <div className="neo-card neo-hover col-span-4" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>history</span>
            <h3 className="neo-card-header">Risk Memory</h3>
            <p className="data-mono">Retains context of past decisions, exceptions, and custom policies using advanced vector similarity.</p>
          </div>
        </div>

        {/* The Neural Pipeline */}
        <div
          className="neo-card neo-hover"
          style={{
            maxWidth: '800px',
            width: '100%',
            backgroundColor: 'rgba(255,214,0,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#111111' }}>hub</span>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>The Neural Pipeline</h2>
          <p className="ui-label-lg" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            Powered by RiskTracker Memory System
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[
              { title: 'Trigger Agent', icon: 'input', desc: 'Intercepts PRs, identifies context boundaries, and retrieves relevant historical state.' },
              { title: 'Analysis Agent', icon: 'search', desc: 'Deep semantic inspection against security baselines and organizational policies.' },
              { title: 'Patch Agent', icon: 'precision_manufacturing', desc: 'Synthesizes precise remediation code and tests against localized environment replicas.' },
              { title: 'AutoRollback', icon: 'history_toggle_off', desc: 'Monitors post-merge health metrics; initiates immediate reversion upon drift detection.' },
            ].map(({ title, icon, desc }) => (
              <div
                key={title}
                className="neo-hover"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: '2px solid var(--border-color)',
                  padding: 'var(--space-md)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: 'var(--shadow-offset) var(--shadow-offset) 0 var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-md)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginTop: '4px' }}>{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p className="data-mono">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: 'var(--border-width) solid var(--border-color)',
          padding: 'var(--space-xl) var(--space-lg)',
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h2 style={{ color: 'var(--primary-container)' }}>OpsOracle</h2>
            <p className="data-mono">Precision DevSecOps automation.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link to="/features" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">Features</Link>
              <Link to="/pricing" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">Pricing</Link>
              <Link to="/team" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">Changelog</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link to="/docs" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">Documentation</Link>
              <Link to="/docs/api" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">API Reference</Link>
              <Link to="/security" style={{ color: 'var(--sidebar-text)', textDecoration: 'none' }} className="ui-label-sm">Security Whitepaper</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
