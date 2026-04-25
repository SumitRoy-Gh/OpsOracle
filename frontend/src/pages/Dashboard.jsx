import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getScans(null, 100),
      api.getAlerts(),
    ]).then(([scansData, alertsData]) => {
      setScans(scansData.scans || []);
      setAlerts(alertsData.repos || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Compute stats from real scan data
  const totalScans = scans.length;
  const totalIssues = scans.reduce((sum, s) => sum + (s.total_findings || 0), 0);
  const criticalIssues = scans.reduce((sum, s) => {
    const counts = s.severity_counts || {};
    return sum + (counts.CRITICAL || 0);
  }, 0);

  const avgScore = scans.length > 0
    ? Math.round(scans.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scans.length)
    : 0;

  const getGradeFromScore = (score) => {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  };

  // Group scans by repo for the repo health table
  const repoMap = {};
  scans.forEach(scan => {
    if (!repoMap[scan.repo]) {
      repoMap[scan.repo] = scan;
    }
  });
  const repoList = Object.values(repoMap).slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p className="data-mono">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-margin)', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
        <h1 style={{ margin: 0 }}>SYSTEMS STATUS</h1>
        <div className="neo-card" style={{ padding: '8px 16px', margin: 0 }}>
          <span className="ui-label-lg">ALL TIME</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid">
        <div className="neo-card col-span-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-surface-variant)' }}>Total Scans</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>radar</span>
          </div>
          <div className="stat-value">{totalScans.toLocaleString()}</div>
        </div>

        <div className="neo-card col-span-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-surface-variant)' }}>Issues Found</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>bug_report</span>
          </div>
          <div className="stat-value">{totalIssues.toLocaleString()}</div>
        </div>

        <div className="neo-card col-span-3" style={{ backgroundColor: 'var(--error-container)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-error-container)' }}>Critical Issues</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--on-error-container)' }}>{criticalIssues}</div>
        </div>

        <div className="neo-card col-span-3" style={{ backgroundColor: 'var(--primary-container)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-primary-container)' }}>Average Score</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>speed</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--on-primary-container)' }}>
            {scans.length > 0 ? getGradeFromScore(avgScore) : '—'}
          </div>
        </div>
      </div>

      {/* Alerts banner if any */}
      {alerts.length > 0 && (
        <div style={{ backgroundColor: 'var(--error-container)', border: '2px solid var(--error)', padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
          <span className="data-mono" style={{ color: 'var(--on-error-container)' }}>
            {alerts.length} repo(s) are actively degrading and need attention.
          </span>
        </div>
      )}

      {/* Repo Health Table */}
      <div className="neo-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ borderBottom: '2px solid var(--border-color)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>REPOSITORY HEALTH INDEX</h2>
        </div>
        {repoList.length === 0 ? (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>
              No scans yet. Install the GitHub App and open a PR to get started.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }} className="data-mono">
              <thead>
                <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--on-primary)' }}>
                  <th style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>Repo</th>
                  <th style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>Score</th>
                  <th style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>Grade</th>
                  <th style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>Last Scan</th>
                  <th style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>Issues</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'var(--surface-container-lowest)' }}>
                {repoList.map((scan, idx) => {
                  const score = scan.overall_score || 0;
                  const grade = scan.overall_grade || getGradeFromScore(score);
                  const gradeColor = ['A', 'B'].includes(grade) ? 'var(--primary)' : grade === 'C' ? 'var(--on-surface)' : 'var(--error)';
                  const counts = scan.severity_counts || {};
                  const critical = counts.CRITICAL || 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--outline)' }}>
                      <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
                        {scan.repo}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                        <div style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', height: '16px' }}>
                          <div style={{ backgroundColor: score >= 75 ? 'var(--primary-container)' : score >= 50 ? 'var(--primary-fixed)' : 'var(--error)', height: '100%', width: `${score}%` }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', fontWeight: 'bold', color: gradeColor }}>{grade}</td>
                      <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', color: 'var(--on-surface-variant)' }}>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                        {critical > 0 ? (
                          <span style={{ backgroundColor: 'var(--error)', color: 'white', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--on-surface)' }}>{critical} CRIT</span>
                        ) : (
                          <span style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--on-surface)' }}>{scan.total_findings || 0} total</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Scans */}
      <div className="dashboard-grid">
        <div className="col-span-12" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: '24px', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-xs)' }}>RECENT SCAN ACTIVITY</h2>
          <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, marginTop: '8px' }}>
            {scans.slice(0, 6).map((scan, idx) => {
              const passed = (scan.severity_counts?.CRITICAL || 0) === 0 && (scan.severity_counts?.HIGH || 0) === 0;
              return (
                <div key={idx} style={{ padding: 'var(--space-sm)', borderBottom: idx < 5 ? '1px solid var(--outline)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: passed ? 'var(--primary-container)' : 'var(--error)', border: '1px solid var(--on-surface)' }}></div>
                    <div>
                      <span className="data-mono" style={{ fontWeight: 'bold' }}>{scan.repo}</span>
                      <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: '8px' }}>
                        PR #{scan.pr_number || '—'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                      Score: {scan.overall_score || 0}/100
                    </span>
                    <div className="data-mono" style={{
                      backgroundColor: passed ? 'var(--surface)' : 'var(--error)',
                      color: passed ? 'var(--on-surface)' : 'var(--on-error)',
                      border: '2px solid var(--on-surface)',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {passed ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              );
            })}
            {scans.length === 0 && (
              <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>No scans yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
