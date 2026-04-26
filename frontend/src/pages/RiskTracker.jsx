import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function SecurityHealthTracker() {
  const [repos, setRepos] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
        <h1>Security Health Tracker</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          10-PR sliding window health analysis for all repositories.
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
                        <Link to="/history" className="neo-button ghost" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}>
                          Scan History
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selectedRepo && selectedRepo.score_history && selectedRepo.score_history.length > 0 && (
          <div id="graph-section" className="neo-card col-span-12">
            <h3 className="neo-card-header">Score History: {selectedRepo.repo}</h3>
            {selectedRepo.alert && (
              <div style={{ backgroundColor: 'var(--error-container)', border: '1px solid var(--error)', padding: '8px 12px', marginBottom: '12px' }}>
                <span className="data-mono" style={{ color: 'var(--on-error-container)', fontSize: '13px' }}>{selectedRepo.alert}</span>
              </div>
            )}
            <div style={{ position: 'relative', height: '500px', padding: '16px 0', borderBottom: '2px solid var(--outline)', marginTop: 'var(--space-md)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedRepo.score_history} margin={{ top: 30, right: 20, bottom: 5, left: 0 }} onMouseLeave={() => setHoveredPoint(null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" vertical={false} />
                  <XAxis 
                    dataKey="pr" 
                    tickFormatter={(tick) => `#${tick}`} 
                    stroke="var(--on-surface-variant)" 
                    style={{ fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="var(--on-surface-variant)" 
                    style={{ fontFamily: 'var(--font-data-mono-family)', fontSize: '12px' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--primary)" 
                    strokeWidth={4}
                    dot={(props) => {
                      const { cx, cy, payload, key } = props;
                      return (
                        <circle 
                          key={key} 
                          cx={cx} 
                          cy={cy} 
                          r={8} 
                          fill="var(--surface)" 
                          stroke="var(--primary)" 
                          strokeWidth={2} 
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                          onMouseEnter={() => setHoveredPoint({ cx, cy, payload })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    }}
                    activeDot={false} 
                    label={{ position: 'top', fill: 'var(--on-surface)', fontSize: 14, fontWeight: 'bold', fontFamily: 'var(--font-data-mono-family)', dy: -15 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {hoveredPoint && (
                <div style={{
                  position: 'absolute',
                  left: hoveredPoint.cx,
                  top: hoveredPoint.cy - 50,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--surface-container-high)',
                  border: '1px solid var(--outline)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  color: 'var(--on-surface)',
                  fontFamily: 'var(--font-data-mono-family)',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  PR #{hoveredPoint.payload.pr} — Score: {hoveredPoint.payload.score}/100
                </div>
              )}
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

export default SecurityHealthTracker;
