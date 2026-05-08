import React, { useState } from 'react';
import { api } from '../api/client';

function CloudPosture() {
  const [provider, setProvider] = useState('aws');
  const [credentials, setCredentials] = useState({
    access_key: '', secret_key: '', region: 'us-east-1'
  });
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const SEVERITY_COLOR = {
    CRITICAL: 'var(--error)',
    HIGH: '#e65100',
    MEDIUM: 'var(--primary)',
    LOW: 'var(--on-surface-variant)',
  };

  const runScan = async () => {
    setScanning(true);
    setError('');
    setResult(null);
    try {
      const data = await api.cloudPostureScan(provider, credentials);
      setResult(data);
    } catch (e) {
      setError('Scan failed. Check your credentials and backend logs.');
    }
    setScanning(false);
  };

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>Cloud Posture</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Live cloud infrastructure security scan powered by CloudSploit + Gemini AI
        </p>
      </header>

      {/* Credentials Form */}
      <div className="neo-card" style={{ maxWidth: '600px' }}>
        <h3 className="neo-card-header">Cloud Credentials</h3>
        <p className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
          Credentials are used only for this scan and never stored.
        </p>

        {/* Provider selector */}
        <div style={{ marginBottom: '16px' }}>
          <label className="ui-label-sm" style={{ display: 'block', marginBottom: '8px' }}>Cloud Provider</label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            style={{
              width: '100%', padding: '12px',
              fontFamily: 'IBM Plex Mono', fontSize: '14px',
              border: '2px solid var(--border-color)',
              backgroundColor: 'var(--surface-container-lowest)',
            }}
          >
            <option value="aws">Amazon Web Services (AWS)</option>
            <option value="gcp">Google Cloud Platform (GCP)</option>
          </select>
        </div>

        {/* AWS fields */}
        {provider === 'aws' && (
          <>
            {[
              { key: 'access_key', label: 'AWS Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
              { key: 'secret_key', label: 'AWS Secret Access Key', placeholder: '••••••••••••••••••••' },
              { key: 'region', label: 'AWS Region', placeholder: 'us-east-1' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label className="ui-label-sm" style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                <input
                  type={key === 'secret_key' ? 'password' : 'text'}
                  value={credentials[key] || ''}
                  onChange={e => setCredentials(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '12px',
                    fontFamily: 'IBM Plex Mono', fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: 'var(--surface-container-lowest)',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </>
        )}

        {/* GCP fields */}
        {provider === 'gcp' && (
          <>
            {[
              { key: 'project_id', label: 'GCP Project ID', placeholder: 'my-project-123' },
              { key: 'client_email', label: 'Service Account Email', placeholder: 'sa@project.iam.gserviceaccount.com' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label className="ui-label-sm" style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                <input
                  type="text"
                  value={credentials[key] || ''}
                  onChange={e => setCredentials(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '12px',
                    fontFamily: 'IBM Plex Mono', fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: 'var(--surface-container-lowest)',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </>
        )}

        {error && (
          <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          onClick={runScan}
          disabled={scanning}
          className="neo-button"
          style={{ width: '100%', backgroundColor: scanning ? '#888' : '#111', color: '#FFD600' }}
        >
          {scanning ? '⏳ Scanning live cloud...' : '🔍 Run Cloud Posture Scan'}
        </button>
        <p className="data-mono" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '8px', textAlign: 'center' }}>
          Scan takes 2-5 minutes for a full cloud account audit
        </p>
      </div>

      {/* Results */}
      {result && (
        <div className="dashboard-grid" style={{ marginTop: '24px' }}>
          {/* Score */}
          <div className="neo-card col-span-4" style={{
            backgroundColor: result.score >= 75 ? 'var(--primary-container)' : 'var(--error-container)',
          }}>
            <h3 className="neo-card-header">Live Cloud Score</h3>
            <div style={{ fontSize: '64px', fontFamily: 'Space Grotesk', fontWeight: 900 }}>
              {result.score}
            </div>
            <div className="ui-label-sm">{result.severity} · {result.total} findings</div>
          </div>

          {/* Findings */}
          {(result.findings || []).map((finding, idx) => (
            <div key={idx} className="neo-card col-span-12" style={{
              borderLeft: `6px solid ${SEVERITY_COLOR[finding.severity] || 'var(--outline)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{finding.title}</h3>
                <span style={{
                  backgroundColor: SEVERITY_COLOR[finding.severity],
                  color: 'white', padding: '2px 10px', fontSize: '11px', fontWeight: 'bold',
                }}>
                  {finding.severity}
                </span>
              </div>
              <p className="data-mono" style={{ fontSize: '13px', marginBottom: '8px' }}>
                {finding.explanation}
              </p>
              <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '8px', marginBottom: '8px' }}>
                <span className="ui-label-sm" style={{ color: 'var(--primary)' }}>Fix: </span>
                <span className="data-mono" style={{ fontSize: '12px' }}>{finding.fix_suggestion}</span>
              </div>
              {finding.compliance?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {finding.compliance.map(c => (
                    <span key={c} className="neo-badge" style={{ fontSize: '10px' }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CloudPosture;
