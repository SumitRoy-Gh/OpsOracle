import React from 'react';

function RiskTracker() {
  return (
    <>
      <header>
        <h1>Risk Tracker</h1>
      </header>

      <div className="dashboard-grid">
        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">Priority Watchlist</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-md)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Repository</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Risk Score</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Trend</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>auth-service-v2</td>
                <td style={{ padding: 'var(--space-md)' }}><span className="neo-badge critical">87/100</span></td>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', color: 'var(--error)' }}>+12% (Degrading)</td>
                <td style={{ padding: 'var(--space-md)' }}><button className="neo-button ghost" style={{ padding: '4px 8px' }}>Analyze</button></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>payment-gateway</td>
                <td style={{ padding: 'var(--space-md)' }}><span className="neo-badge warning">65/100</span></td>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', color: 'var(--on-surface)' }}>Stable</td>
                <td style={{ padding: 'var(--space-md)' }}><button className="neo-button ghost" style={{ padding: '4px 8px' }}>Analyze</button></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>user-profiles</td>
                <td style={{ padding: 'var(--space-md)' }}><span className="neo-badge" style={{ backgroundColor: '#00C48C', color: '#111111' }}>22/100</span></td>
                <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', color: '#00C48C' }}>-5% (Improving)</td>
                <td style={{ padding: 'var(--space-md)' }}><button className="neo-button ghost" style={{ padding: '4px 8px' }}>Analyze</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="neo-card col-span-12">
          <h3 className="neo-card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span>Score History: auth-service-v2</span>
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-variant)', border: '1px dashed var(--border-color)' }}>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>[ CHART RENDERER PLACEHOLDER ]</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
            <button className="neo-button ghost">Export CSV</button>
            <button className="neo-button critical">Force Rollback</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RiskTracker;
