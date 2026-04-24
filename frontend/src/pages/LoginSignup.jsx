import React from 'react';
import { Link } from 'react-router-dom';

function LoginSignup() {
  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }}>
      
      <div style={{ display: 'flex', gap: 'var(--space-lg)', maxWidth: '900px', width: '100%' }}>
        
        {/* Left Side: Login Form */}
        <div className="neo-card" style={{ flex: 1, padding: 'var(--space-xl)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h1 style={{ fontSize: '32px', marginBottom: 'var(--space-xs)' }}>OpsOracle</h1>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>V2.4.0-STABLE // AUTHENTICATE</p>
          </div>

          <h2 style={{ marginBottom: 'var(--space-md)' }}>Sign In</h2>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label className="ui-label-lg" htmlFor="email">Operator ID / Email</label>
              <input 
                type="email" 
                id="email" 
                style={{ 
                  padding: 'var(--space-md)', 
                  border: 'var(--border-width) solid var(--border-color)',
                  fontFamily: 'var(--font-data-mono-family)',
                  fontSize: '16px',
                  backgroundColor: 'var(--surface-container-lowest)'
                }} 
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="ui-label-lg" htmlFor="password">Access Key</label>
                <a href="#" className="ui-label-sm" style={{ color: 'var(--on-surface)' }}>Reset?</a>
              </div>
              <input 
                type="password" 
                id="password" 
                style={{ 
                  padding: 'var(--space-md)', 
                  border: 'var(--border-width) solid var(--border-color)',
                  fontFamily: 'var(--font-data-mono-family)',
                  fontSize: '16px',
                  backgroundColor: 'var(--surface-container-lowest)'
                }} 
              />
            </div>

            <Link to="/dashboard" className="neo-button" style={{ textAlign: 'center', marginTop: 'var(--space-md)', textDecoration: 'none' }}>
              INITIALIZE SESSION
            </Link>
          </form>
        </div>

        {/* Right Side: Sign Up Prompt */}
        <div className="neo-card" style={{ flex: 1, backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', borderColor: 'var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-xl)' }}>
          <h2 style={{ color: 'var(--primary-container)', marginBottom: 'var(--space-md)' }}>New Provision</h2>
          <p className="data-mono" style={{ marginBottom: 'var(--space-lg)', fontSize: '16px' }}>
            Switch view to initialize new operator.
          </p>
          <button className="neo-button" style={{ alignSelf: 'flex-start', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
            REQUEST ACCESS
          </button>
        </div>

      </div>
    </div>
  );
}

export default LoginSignup;
