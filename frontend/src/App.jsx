import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './index.css';
import { api } from './api/client';

import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import LoginSignup from './pages/LoginSignup';
import Repositories from './pages/Repositories';
import ScanHistory from './pages/ScanHistory';
import ScanDetail from './pages/ScanDetail';
import RiskTracker from './pages/RiskTracker';
import AiInsights from './pages/AiInsights';
import Documentation from './pages/Documentation';
import ChangelogTeam from './pages/ChangelogTeam';

function RunScanButton() {
  const [scanning, setScanning] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [result, setResult] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [error, setError] = useState('');

  // Load repos when panel opens
  const openPanel = async () => {
    setShowPanel(true);
    setResult(null);
    setError('');
    setLoadingRepos(true);
    try {
      const data = await api.getUserRepos();
      const repoList = data.repos || [];
      setRepos(repoList);
      if (repoList.length > 0) {
        setSelectedRepo(repoList[0].full_name);
      }
    } catch (e) {
      setError('Could not load repos. Is the backend running?');
    }
    setLoadingRepos(false);
  };

  const runScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setResult(null);
    setError('');
    try {
      const data = await api.triggerScan(selectedRepo);
      setResult(data);
    } catch (e) {
      setError('Scan failed. Check backend logs.');
    }
    setScanning(false);
  };

  return (
    <>
      {/* The button itself in the sidebar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
        <button
          onClick={openPanel}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#FFD600',
            color: '#111',
            border: '2px solid #FFD600',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>radar</span>
          Run Scan
        </button>
      </div>

      {/* Overlay panel that appears when button is clicked */}
      {showPanel && (
        <div
          data-modal-overlay=""
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 99999,
            isolation: 'isolate',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPanel(false);
              setResult(null);
            }
          }}
        >
          <div style={{
            backgroundColor: '#fff8ef',
            border: '3px solid #111',
            boxShadow: '8px 8px 0 #111',
            padding: '32px',
            width: '480px',
            maxWidth: '90vw',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', textTransform: 'uppercase', color: '#111' }}>
                Run Manual Scan
              </h2>
              <button
                onClick={() => { setShowPanel(false); setResult(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', color: '#111' }}
              >
                ✕
              </button>
            </div>

            {/* Repo selector */}
            {!result && (
              <>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                  Select a repository to scan its infrastructure files right now.
                </p>

                {loadingRepos && (
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Loading repositories...</p>
                )}

                {!loadingRepos && repos.length === 0 && !error && (
                  <div style={{ marginBottom: '20px', padding: '16px', border: '1px dashed #ccc', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#ba1a1a' }}>No repositories found.</p>
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Make sure the GitHub App is installed.</p>
                  </div>
                )}

                {repos.length > 0 && (
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '14px',
                      border: '2px solid #111',
                      backgroundColor: '#fff',
                      marginBottom: '20px',
                      cursor: 'pointer',
                      color: '#111',
                    }}
                  >
                    {repos.map(r => (
                      <option key={r.full_name} value={r.full_name}>
                        {r.full_name}
                      </option>
                    ))}
                  </select>
                )}

                {error && (
                  <p style={{ color: '#ba1a1a', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                  </p>
                )}

                {/* Scan button */}
                <button
                  onClick={runScan}
                  disabled={scanning || !selectedRepo}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: scanning ? '#888' : '#111',
                    color: '#FFD600',
                    border: '2px solid #111',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    textTransform: 'uppercase',
                    cursor: scanning ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {scanning ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>autorenew</span>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                      Start Scan
                    </>
                  )}
                </button>

                {/* Spinner animation */}
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </>
            )}

            {/* Result display */}
            {result && (
              <div>
                {result.status === 'no_infra_files' ? (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#888' }}>folder_off</span>
                    <p style={{ marginTop: '12px', color: '#666' }}>No infrastructure files found in this repository.</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                      OpsOracle scans Terraform, Dockerfiles, K8s YAML, and GitHub Actions files.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Score display */}
                    <div style={{
                      backgroundColor: result.score >= 75 ? '#00C48C' : result.score >= 50 ? '#FFD600' : '#ba1a1a',
                      border: '2px solid #111',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: '16px',
                    }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: '56px', fontWeight: 900, lineHeight: 1, color: '#111' }}>
                        {result.score}
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px', color: '#111', marginTop: '4px' }}>
                        / 100 — {result.severity}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ flex: 1, border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Space Grotesk' }}>{result.findings}</div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Findings</div>
                      </div>
                      <div style={{ flex: 1, border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'IBM Plex Mono', wordBreak: 'break-all' }}>{result.branch}</div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Branch</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setShowPanel(false);
                          setResult(null);
                          window.location.href = '/history';
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#FFD600',
                          border: '2px solid #111',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 700,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        View in History
                      </button>
                      <button
                        onClick={() => { setResult(null); setError(''); }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: 'transparent',
                          border: '2px solid #111',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 700,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Scan Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Layout({ children, user }) {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <Link to="/landing" className="sidebar-header" style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
          <h2>OpsOracle</h2>
          <p className="data-mono" style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
            V2.4.0-STABLE
          </p>
        </Link>
        <nav>
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
            Dashboard
          </Link>
          <Link to="/repos" className={`nav-item ${location.pathname === '/repos' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
            Repos
          </Link>
          <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            Scan History
          </Link>
          <Link to="/risk-tracker" className={`nav-item ${location.pathname === '/risk-tracker' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_down</span>
            Security Health Tracker
          </Link>
          <Link to="/ai-insights" className={`nav-item ${location.pathname === '/ai-insights' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
            AI Insights
          </Link>
          <Link to="/team" className={`nav-item ${location.pathname === '/team' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
            Team & Log
          </Link>
          <Link to="/docs" className={`nav-item ${location.pathname === '/docs' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu_book</span>
            Docs
          </Link>
        </nav>

        {/* Run Scan Button */}
        <RunScanButton />

        <div style={{ marginTop: 'auto', borderTop: '1px solid #333', padding: '16px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #333' }}
                />
              )}
              <div>
                <p className="data-mono" style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                  {user.name || user.email}
                </p>
                <p className="data-mono" style={{ color: '#888', fontSize: '11px' }}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            className="neo-button ghost"
            style={{ width: '100%', border: '1px solid #333', color: '#888', fontSize: '12px' }}
            onClick={async () => {
              await api.logout();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff8ef',
        fontFamily: 'IBM Plex Mono',
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/landing" /> : <LoginSignup />} />
        <Route path="/" element={<Navigate to={user ? "/landing" : "/login"} />} />
        <Route path="/landing" element={user ? <LandingPage /> : <Navigate to="/login" />} />

        <Route path="/dashboard" element={
          user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/repos" element={
          user ? <Layout user={user}><Repositories /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/history" element={
          user ? <Layout user={user}><ScanHistory /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/scan/:id" element={
          user ? <Layout user={user}><ScanDetail /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/risk-tracker" element={
          user ? <Layout user={user}><RiskTracker /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/ai-insights" element={
          user ? <Layout user={user}><AiInsights /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/team" element={
          user ? <Layout user={user}><ChangelogTeam /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/docs" element={
          user ? <Layout user={user}><Documentation /></Layout> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
