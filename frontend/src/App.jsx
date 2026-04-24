import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

// Pages
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

/* ─────────────────────────────────────────────────────────
   Layout — sidebar wrapper for post-installation pages only
   ───────────────────────────────────────────────────────── */
function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OpsOracle</h2>
        </div>
        <nav>
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/repos"     className={`nav-item ${location.pathname === '/repos'     ? 'active' : ''}`}>Repos</Link>
          <Link to="/history"   className={`nav-item ${location.pathname === '/history'   ? 'active' : ''}`}>Scan History</Link>
          <Link to="/risk-tracker" className={`nav-item ${location.pathname === '/risk-tracker' ? 'active' : ''}`}>Risk Tracker</Link>
          <Link to="/ai-insights"  className={`nav-item ${location.pathname === '/ai-insights'  ? 'active' : ''}`}>AI Insights</Link>
          <Link to="/team"      className={`nav-item ${location.pathname === '/team'      ? 'active' : ''}`}>Team &amp; Log</Link>
          <Link to="/docs"      className={`nav-item ${location.pathname === '/docs'      ? 'active' : ''}`}>Docs</Link>
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Routing
   /            → LoginSignup  (no layout, GeometricBackground inside)
   /login       → LoginSignup  (same)
   /landing     → LandingPage  (post-login, no layout, GeometricBackground inside)
   /dashboard + → Layout-wrapped page components
   ───────────────────────────────────────────────────────── */
function App() {
  return (
    <Router>
      <Routes>
        {/* Auth & pre-install — no sidebar */}
        <Route path="/"       element={<LoginSignup />} />
        <Route path="/login"  element={<LoginSignup />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Post-installation — sidebar layout */}
        <Route path="/dashboard"   element={<Layout><Dashboard /></Layout>} />
        <Route path="/repos"       element={<Layout><Repositories /></Layout>} />
        <Route path="/history"     element={<Layout><ScanHistory /></Layout>} />
        <Route path="/scan/:id"    element={<Layout><ScanDetail /></Layout>} />
        <Route path="/risk-tracker" element={<Layout><RiskTracker /></Layout>} />
        <Route path="/ai-insights"  element={<Layout><AiInsights /></Layout>} />
        <Route path="/team"        element={<Layout><ChangelogTeam /></Layout>} />
        <Route path="/docs"        element={<Layout><Documentation /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
