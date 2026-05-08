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
import CloudPosture from './pages/CloudPosture';
import Documentation from './pages/Documentation';
import ChangelogTeam from './pages/ChangelogTeam';


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
          <Link to="/cloud-posture" className={`nav-item ${location.pathname === '/cloud-posture' ? 'active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_done</span>
            Cloud Posture
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
        <Route path="/cloud-posture" element={
          user ? <Layout user={user}><CloudPosture /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/docs" element={
          user ? <Layout user={user}><Documentation /></Layout> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
