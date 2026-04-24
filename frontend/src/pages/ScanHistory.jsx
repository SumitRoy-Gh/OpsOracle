import React from 'react';

function ScanHistory() {
  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Scan History</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Log of all recent security scans, vulnerabilities, and AI insights.
        </p>
      </header>

      <div className="dashboard-grid">
        <div className="neo-card col-span-8">
          <h3 className="neo-card-header">Scan Logs</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-md)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Timestamp</th>
                <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Repository</th>
                <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Issues</th>
                <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>2026-04-24 10:42</td>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>core-auth-service</td>
                <td style={{ padding: 'var(--space-sm)' }}>1 Warning</td>
                <td style={{ padding: 'var(--space-sm)' }}><span className="neo-badge warning">Review</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>2026-04-24 10:45</td>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>payment-gateway</td>
                <td style={{ padding: 'var(--space-sm)' }}>3 Critical</td>
                <td style={{ padding: 'var(--space-sm)' }}><span className="neo-badge critical">Failed</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>2026-04-24 11:00</td>
                <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>legacy-core-api</td>
                <td style={{ padding: 'var(--space-sm)' }}>0 Issues</td>
                <td style={{ padding: 'var(--space-sm)' }}><span className="neo-badge" style={{ backgroundColor: '#00C48C', color: '#111111' }}>Passed</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>
          <div className="neo-card" style={{ textAlign: 'center' }}>
            <h3 className="neo-card-header">Current Health Score</h3>
            <div className="stat-value" style={{ fontSize: '64px', color: '#00C48C' }}>94.2</div>
          </div>

          <div className="neo-card" style={{ backgroundColor: 'var(--error-container)', borderColor: 'var(--error)' }}>
            <h3 className="neo-card-header" style={{ color: 'var(--on-error-container)', borderColor: 'var(--error)' }}>AI Sentinel Advice</h3>
            <div style={{ marginBottom: '8px' }}>
              <span className="neo-badge critical" style={{ marginBottom: '8px' }}>Action Required: payment-gateway</span>
            </div>
            <p className="data-mono" style={{ color: 'var(--on-error-container)' }}>
              Sentinel detected 3 critical vulnerabilities in PR #883 related to SQL injection vectors in the new billing module. Immediate remediation recommended before merge.
            </p>
            <button className="neo-button critical" style={{ marginTop: '16px' }}>View Remediation</button>
          </div>
        </div>

        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">System Vulnerability Hotspots</h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-variant)', border: '1px dashed var(--border-color)' }}>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>[ HEATMAP RENDERER PLACEHOLDER ]</p>
          </div>
        </div>

      </div>
    </>
  );
}

export default ScanHistory;
