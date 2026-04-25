import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

function RiskTracker() {
  const [repos, setRepos] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAllRiskRepos(),
      api.getAlerts(),
    ]).then(([reposData, alertsData]) => {
      const repoList = reposData.repos || [];
      setRepos(repoList);
      setAlerts(alertsData.repos || []);
      if (repoList.length > 0) setSelectedRepo(repoList[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="data-mono" style={{ padding: '24px' }}>Loading risk data...</p>;

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Risk Tracker</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          10-PR sliding window risk analysis for all repositories.
        </p>
      </header>

      {alerts.length > 0 && (
        <div style={{ backgroundColor: 'var(--error-container)', border: '2px solid var(--error)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
          <span className="data-mono" style={{ color: 'var(--on-error-container)' }}>
            {alerts.length} repo(s) need immediate attention.
          </span>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">Priority Watchlist</h3>
          {repos.length === 0 ? (
            <p className="data-mono" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              No repos scanned yet. Data will appear after your first PR scan.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-md)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Repository</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Avg Score</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Latest</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Trend</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Scans</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {repos.map((repo, idx) => {
                  const trendColor = repo.trend === 'improving' ? '#00C48C' : repo.trend === 'degrading' ? 'var(--error)' : 'var(--on-surface)';
                  const trendIcon = repo.trend === 'improving' ? 'trending_up' : repo.trend === 'degrading' ? 'trending_down' : 'trending_flat';
                  const scoreColor = repo.average_score >= 75 ? '#00C48C' : repo.average_score >= 50 ? 'var(--primary)' : 'var(--error)';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: selectedRepo?.repo === repo.repo ? 'var(--surface-container-low)' : 'transparent' }}>
                      <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)' }}>{repo.repo}</td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span className="neo-badge" style={{ backgroundColor: scoreColor, color: '#111', borderColor: '#111' }}>
                          {repo.average_score}/100
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        {repo.latest_score}/100
                      </td>
                      <td style={{ padding: 'var(--space-md)', color: trendColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{trendIcon}</span>
                        <span className="data-mono" style={{ fontSize: '12px', textTransform: 'capitalize' }}>{repo.trend}</span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }}>
                        {repo.scans_in_window}/{repo.window_size}
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <button className="neo-button ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setSelectedRepo(repo)}>
                          View History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selectedRepo && selectedRepo.score_history && selectedRepo.score_history.length > 0 && (
          <div className="neo-card col-span-12">
            <h3 className="neo-card-header">Score History: {selectedRepo.repo}</h3>
            {selectedRepo.alert && (
              <div style={{ backgroundColor: 'var(--error-container)', border: '1px solid var(--error)', padding: '8px 12px', marginBottom: '12px' }}>
                <span className="data-mono" style={{ color: 'var(--on-error-container)', fontSize: '13px' }}>{selectedRepo.alert}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '16px 0', borderBottom: '2px solid var(--outline)' }}>
              {selectedRepo.score_history.map((point, idx) => {
                const barColor = point.score >= 75 ? '#00C48C' : point.score >= 50 ? 'var(--primary-container)' : 'var(--error)';
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span className="data-mono" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>{point.score}</span>
                    <div style={{
                      width: '100%',
                      height: `${point.score * 1.6}px`,
                      backgroundColor: barColor,
                      border: '1px solid var(--on-surface)',
                      transition: 'height 0.3s',
                    }} />
                    <span className="data-mono" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>#{point.pr}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
              <div className="data-mono" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                Average: {selectedRepo.average_score}/100 · Trend: {selectedRepo.trend}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default RiskTracker;
