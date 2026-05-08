const BASE_URL = 'http://localhost:8000';

export const api = {
  // Auth
  getMe: () =>
    fetch(`${BASE_URL}/auth/me`, { credentials: 'include' }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }),

  logout: () =>
    fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then(r => r.json()),

  // Scans
  getScans: (repo, limit = 50) =>
    fetch(`${BASE_URL}/api/scans?limit=${limit}${repo ? `&repo=${repo}` : ''}`, {
      credentials: 'include',
    }).then(r => r.json()),

  getScan: (id) =>
    fetch(`${BASE_URL}/api/scans/${id}`, { credentials: 'include' }).then(r => r.json()),

  // Risk Tracker
  getAllRiskRepos: () =>
    fetch(`${BASE_URL}/api/risk-tracker/repos`, { credentials: 'include' }).then(r => r.json()),

  getRiskRepo: (repo) =>
    fetch(`${BASE_URL}/api/risk-tracker/repo/${repo}`, { credentials: 'include' }).then(r => r.json()),

  getAlerts: () =>
    fetch(`${BASE_URL}/api/risk-tracker/alerts`, { credentials: 'include' }).then(r => r.json()),

  // Chat
  chat: (message, context = '', history = []) =>
    fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, context, history }),
    }).then(r => r.json()),

  // Rollback history
  getRollbackHistory: () =>
    fetch(`${BASE_URL}/api/rollback-history`, { credentials: 'include' }).then(r => r.json()),

  // Trigger stats
  getTriggerStats: () =>
    fetch(`${BASE_URL}/api/trigger-stats`, { credentials: 'include' }).then(r => r.json()),

  // Repos
  getUserRepos: () =>
    fetch(`${BASE_URL}/auth/github/repos`, { credentials: 'include' }).then(r => r.json()),


  // Cloud Posture
  cloudPostureScan: (provider, credentials) =>
    fetch(`${BASE_URL}/api/cloud-posture-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, credentials }),
    }).then(r => r.json()),
};
