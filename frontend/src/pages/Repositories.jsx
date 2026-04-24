import React from 'react';
import { Link } from 'react-router-dom';

function Repositories() {
  const repos = [
    { name: 'auth-service-v2', lastCommit: '14m ago', status: 'critical', score: '87/100' },
    { name: 'payment-gateway', lastCommit: '2h ago', status: 'warning', score: '65/100' },
    { name: 'legacy-core-api', lastCommit: '3d ago', status: 'success', score: '22/100' }
  ];

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Repositories</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Manage and monitor the security posture of your integrated codebases. Scan status, pull requests, and risk assessments are consolidated below.
        </p>
      </header>

      <div className="dashboard-grid">
        {repos.map((repo, idx) => (
          <div key={idx} className="neo-card col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '24px', marginBottom: 'var(--space-xs)' }}>{repo.name}</h3>
              <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>Last commit {repo.lastCommit}</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Risk Score</div>
                <span className={`neo-badge ${repo.status === 'success' ? '' : repo.status}`} 
                      style={repo.status === 'success' ? { backgroundColor: '#00C48C', color: '#111111' } : {}}>
                  {repo.score}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="neo-button ghost">View PRs</button>
                <Link to="/scan/latest" className="neo-button">Run Scan</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Repositories;
