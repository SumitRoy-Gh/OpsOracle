import React from 'react';

function ChangelogTeam() {
  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Changelog & Team</h1>
      </header>

      <div className="dashboard-grid">
        <div className="neo-card col-span-8">
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Changelog</h2>
          
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '24px', marginBottom: 'var(--space-md)' }}>v2.4.0 <span className="neo-badge" style={{ backgroundColor: '#00C48C', color: '#111111', fontSize: '12px', verticalAlign: 'middle', marginLeft: 'var(--space-sm)' }}>LATEST</span></h3>
            <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <li className="data-mono"><span style={{ color: 'var(--primary)' }}>✦</span> Implemented Zero-Trust Architecture across all edge nodes.</li>
              <li className="data-mono"><span style={{ color: 'var(--primary)' }}>✦</span> Added Quantum-Resistant Encryption keys to Secret Vault.</li>
              <li className="data-mono"><span style={{ color: '#00C48C' }}>▲</span> Improved Log Streamer parsing speed by 400%.</li>
              <li className="data-mono"><span style={{ color: 'var(--error)' }}>✗</span> Fixed memory leak in automated vulnerability scanner module.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '24px', marginBottom: 'var(--space-md)' }}>v2.3.0</h3>
            <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <li className="data-mono"><span style={{ color: 'var(--primary)' }}>✦</span> Introduced AI-driven Risk Tracker predictions.</li>
              <li className="data-mono"><span style={{ color: '#00C48C' }}>▲</span> Optimized Docker container build pipeline.</li>
              <li className="data-mono"><span style={{ color: 'var(--error)' }}>✗</span> Resolved false positives in SAST scanning ruleset.</li>
            </ul>
          </div>
        </div>

        <div className="neo-card col-span-4" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Team Control</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <button className="neo-button ghost" style={{ border: 'var(--border-width) solid var(--border-color)', textAlign: 'left' }}>Manage Operators</button>
            <button className="neo-button ghost" style={{ border: 'var(--border-width) solid var(--border-color)', textAlign: 'left' }}>Access Logs</button>
            <button className="neo-button ghost" style={{ border: 'var(--border-width) solid var(--border-color)', textAlign: 'left' }}>Billing & Quotas</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChangelogTeam;
