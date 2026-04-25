import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function Repositories() {
  const [repos, setRepos] = useState([]);
  const [scanData, setScanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.getUserRepos(),
      api.getScans(null, 100),
    ]).then(([reposData, scansData]) => {
      const fetchedRepos = reposData.repos || [];
      const fetchedRepoNames = new Set(fetchedRepos.map(r => r.full_name));

      // Build a map of repo → latest scan data
      const scanMap = {};
      (scansData.scans || []).forEach(scan => {
        if (!scanMap[scan.repo]) {
          scanMap[scan.repo] = scan;
        }

        // If this repo from scans is not in our GitHub API response, add it manually
        if (!fetchedRepoNames.has(scan.repo)) {
          fetchedRepos.push({
            name: scan.repo.split('/')[1] || scan.repo,
            full_name: scan.repo,
            private: false,
            description: "Repository identified from scan history.",
            default_branch: "main",
            html_url: `https://github.com/${scan.repo}`
          });
          fetchedRepoNames.add(scan.repo);
        }
      });

      setRepos(fetchedRepos);
      setScanData(scanMap);
      
      // If we found repos from scans, consider it installed even if API says no
      if (fetchedRepos.length > 0) {
        setInstalled(true);
      } else {
        setInstalled(reposData.installed !== false);
      }

      setMessage(reposData.message || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getScoreColor = (score) => {
    if (score >= 75) return '#00C48C';
    if (score >= 50) return 'var(--primary-container)';
    return 'var(--error)';
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'Never scanned';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <>
        <header style={{ marginBottom: 'var(--space-md)' }}>
          <h1>Repositories</h1>
        </header>
        <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>Loading repositories...</p>
      </>
    );
  }

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Repositories</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Repositories where OpsOracle is installed and actively monitoring pull requests.
        </p>
      </header>

      {/* Not installed banner */}
      {!installed && (
        <div style={{
          backgroundColor: 'var(--primary-container)',
          border: '2px solid var(--border-color)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '4px 4px 0 var(--shadow-color)',
        }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>GitHub App Not Installed</h3>
            <p className="data-mono" style={{ fontSize: '13px' }}>
              Install OpsOracle on your repositories to start scanning pull requests automatically.
            </p>
          </div>
          <button
            className="neo-button"
            style={{ backgroundColor: '#111', color: '#fff', flexShrink: 0, marginLeft: '24px' }}
            onClick={() => window.open('https://github.com/apps/Opsoracle/installations/new', '_blank')}
          >
            Install GitHub App
          </button>
        </div>
      )}

      {/* Repos list */}
      <div className="dashboard-grid">
        {repos.length === 0 && installed && (
          <div className="neo-card col-span-12" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--on-surface-variant)' }}>folder_off</span>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginTop: '12px' }}>
              {message || 'No repositories found in your GitHub App installation.'}
            </p>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)', fontSize: '12px', marginTop: '8px' }}>
              Make sure you selected at least one repository when installing the GitHub App.
            </p>
          </div>
        )}

        {repos.map((repo, idx) => {
          const latestScan = scanData[repo.full_name];
          const score = latestScan?.overall_score;
          const grade = latestScan?.overall_grade;
          const counts = latestScan?.severity_counts || {};
          const critical = counts.CRITICAL || 0;
          const high = counts.HIGH || 0;
          const lastScanTime = latestScan?.created_at;
          const scoreColor = score != null ? getScoreColor(score) : 'var(--on-surface-variant)';

          return (
            <div key={idx} className="neo-card col-span-12" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-lg)',
              gap: 'var(--space-lg)',
            }}>
              {/* Left: Repo info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>
                    {repo.private ? 'lock' : 'folder'}
                  </span>
                  <h3 style={{ fontSize: '20px', margin: 0 }}>{repo.full_name}</h3>
                  {repo.private && (
                    <span className="neo-badge" style={{ fontSize: '10px', backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}>
                      PRIVATE
                    </span>
                  )}
                </div>

                {repo.description && (
                  <p className="data-mono" style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginBottom: '8px', marginLeft: '32px' }}>
                    {repo.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', marginLeft: '32px' }}>
                  {repo.language && (
                    <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>code</span>
                      {repo.language}
                    </span>
                  )}
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>radar</span>
                    Last scan: {getTimeSince(lastScanTime)}
                  </span>
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fork_right</span>
                    {repo.default_branch}
                  </span>
                </div>
              </div>

              {/* Middle: Scan stats */}
              <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
                {latestScan ? (
                  <>
                    {/* Score badge */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Score</div>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: scoreColor,
                        border: '2px solid var(--border-color)',
                        boxShadow: '3px 3px 0 var(--shadow-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '18px', color: '#111', lineHeight: 1 }}>{score}</span>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '10px', color: '#111' }}>/100</span>
                      </div>
                    </div>

                    {/* Grade */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Grade</div>
                      <div style={{
                        fontFamily: 'Space Grotesk',
                        fontWeight: 900,
                        fontSize: '32px',
                        color: scoreColor,
                        lineHeight: 1,
                      }}>
                        {grade || '—'}
                      </div>
                    </div>

                    {/* Issues */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Issues</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {critical > 0 && (
                          <span style={{ backgroundColor: 'var(--error)', color: 'white', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                            {critical} CRIT
                          </span>
                        )}
                        {high > 0 && (
                          <span style={{ backgroundColor: 'var(--primary-fixed)', color: '#111', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                            {high} HIGH
                          </span>
                        )}
                        {critical === 0 && high === 0 && (
                          <span style={{ backgroundColor: '#00C48C', color: '#111', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                            CLEAN
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '0 16px' }}>
                    <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                      No scans yet
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flexShrink: 0 }}>
                <a
                  href={`${repo.html_url}/pulls`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button ghost"
                  style={{ border: 'var(--border-width) solid var(--border-color)', textDecoration: 'none', textAlign: 'center', fontSize: '13px' }}
                >
                  View PRs on GitHub
                </a>
                {latestScan && (
                  <Link
                    to={`/scan/${latestScan.id}`}
                    className="neo-button"
                    style={{ textDecoration: 'none', textAlign: 'center', fontSize: '13px' }}
                  >
                    View Latest Scan
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box at bottom */}
      {repos.length > 0 && (
        <div style={{
          border: '1px solid var(--outline)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--surface-container-low)',
          marginTop: 'var(--space-md)',
        }}>
          <p className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>info</span>
            Scans run automatically when a pull request is opened, updated, or reopened in any of these repositories.
            Results appear in Scan History after each scan completes.
          </p>
        </div>
      )}
    </>
  );
}

export default Repositories;
