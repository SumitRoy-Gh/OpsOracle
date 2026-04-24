import React from 'react';
import { Link } from 'react-router-dom';

function ScanDetail() {
  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <Link to="/history" className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>&larr; Back to Scans</Link>
        </div>
        <h1>Scan Detail</h1>
      </header>

      <div className="dashboard-grid">
        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">/DOCKERFILE</h3>
          
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ color: 'var(--error)', marginBottom: 'var(--space-xs)' }}>Root User Execution Privileges Detected</h4>
            <p className="data-mono" style={{ marginBottom: 'var(--space-md)' }}>
              The container is configured to run as the root user. This violates the principle of least privilege and significantly increases the blast radius if the container is compromised.
            </p>
            
            <div style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', border: 'var(--border-width) solid var(--border-color)' }}>
              <div style={{ color: 'var(--on-surface-variant)' }}>12 | RUN npm install --production</div>
              <div style={{ color: 'var(--on-surface-variant)' }}>13 | COPY . .</div>
              <div style={{ color: 'var(--error)' }}>- 14 | CMD ["node", "server.js"]</div>
              <div style={{ color: '#00C48C' }}>+ 14 | USER node</div>
              <div style={{ color: '#00C48C' }}>+ 15 | CMD ["node", "server.js"]</div>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--primary-container)', marginBottom: 'var(--space-xs)' }}>Missing Healthcheck Instruction</h4>
            <p className="data-mono">
              Adding a HEALTHCHECK instruction helps orchestrators determine if the container is functioning correctly, avoiding routing traffic to broken instances.
            </p>
          </div>
        </div>

        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">/SRC/CORE/AUTH.TS</h3>
          <div>
            <h4 style={{ color: 'var(--error)', marginBottom: 'var(--space-xs)' }}>Hardcoded API Key Detected</h4>
            <p className="data-mono">
              A high-entropy string resembling a Stripe Secret Key was found hardcoded in the authentication module. This must be migrated to environment variables immediately.
            </p>
          </div>
        </div>

        <div className="neo-card col-span-12" style={{ backgroundColor: 'var(--primary-container)', borderColor: 'var(--border-color)' }}>
          <h3 className="neo-card-header" style={{ color: 'var(--on-primary-container)' }}>Sentinel AI Explanation</h3>
          <p className="data-mono" style={{ color: 'var(--on-primary-container)', marginBottom: 'var(--space-md)' }}>
            Running a container as root means the processes inside the container have administrative privileges.
          </p>
          <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)', border: '1px solid var(--border-color)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>
            root
          </div>
          <p className="data-mono" style={{ color: 'var(--on-primary-container)' }}>
            If an attacker exploits a vulnerability in your Node.js app, they gain root access within the container environment, making it significantly easier to attempt container escapes to the host node.
          </p>
        </div>
      </div>
    </>
  );
}

export default ScanDetail;
