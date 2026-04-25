import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getScans(null, 50).then(data => {
      setScans(data.scans || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const avgScore = scans.length > 0
    ? (scans.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scans.length).toFixed(1)
    : 0;

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Scan History</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Log of all security scans, vulnerabilities, and AI insights.
        </p>
      </header>

      {loading ? (
        <p className="data-mono">Loading...</p>
      ) : (
        <div className="dashboard-grid">
          <div className="neo-card col-span-8">
            <h3 className="neo-card-header">Scan Logs</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-md)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Timestamp</th>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Repository</th>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>PR</th>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Score</th>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Status</th>
                  <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--on-surface-variant)' }} className="data-mono">
                      No scans yet. Open a PR in an installed repo.
                    </td>
                  </tr>
                ) : scans.map((scan, idx) => {
                  const counts = scan.severity_counts || {};
                  const hasCritical = (counts.CRITICAL || 0) > 0;
                  const hasHigh = (counts.HIGH || 0) > 0;
                  const status = hasCritical || hasHigh ? 'failed' : 'passed';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        {new Date(scan.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        {scan.repo}
                      </td>
                      <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        #{scan.pr_number || '—'}
                      </td>
                      <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        {scan.overall_score || 0}/100
                      </td>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        <span className={`neo-badge ${status === 'failed' ? 'critical' : ''}`}
                          style={status === 'passed' ? { backgroundColor: '#00C48C', color: '#111' } : {}}>
                          {status === 'passed' ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        <Link to={`/scan/${scan.id}`} className="neo-button ghost" style={{ padding: '2px 8px', fontSize: '11px' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>
            <div className="neo-card" style={{ textAlign: 'center' }}>
              <h3 className="neo-card-header">Average Health Score</h3>
              <div className="stat-value" style={{ fontSize: '64px', color: avgScore >= 75 ? '#00C48C' : avgScore >= 50 ? 'var(--primary)' : 'var(--error)' }}>
                {avgScore}
              </div>
            </div>

            <div className="neo-card">
              <h3 className="neo-card-header">Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="data-mono">
                  <span>Total Scans</span>
                  <span style={{ fontWeight: 'bold' }}>{scans.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="data-mono">
                  <span>Total Issues</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {scans.reduce((s, sc) => s + (sc.total_findings || 0), 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="data-mono">
                  <span style={{ color: 'var(--error)' }}>Critical</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--error)' }}>
                    {scans.reduce((s, sc) => s + (sc.severity_counts?.CRITICAL || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ScanHistory;
