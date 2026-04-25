import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

const SEVERITY_COLOR = {
  CRITICAL: 'var(--error)',
  HIGH: '#e65100',
  MEDIUM: 'var(--primary)',
  LOW: 'var(--on-surface-variant)',
};

function ScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getScan(id).then(data => {
      setScan(data);
      setLoading(false);
    }).catch(e => {
      setError('Scan not found');
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="data-mono" style={{ padding: '24px' }}>Loading scan...</p>;
  if (error || !scan) return <p className="data-mono" style={{ padding: '24px', color: 'var(--error)' }}>{error || 'Scan not found'}</p>;

  const results = scan.results || {};
  const findings = results.findings || [];

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <Link to="/history" className="ui-label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>← Back to Scans</Link>
        </div>
        <h1>Scan Detail</h1>
        <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
          {scan.repo} · PR #{scan.pr_number || '—'} · Score: {scan.overall_score}/100 · Grade: {scan.overall_grade}
        </p>
      </header>

      <div className="dashboard-grid">
        {/* Score card */}
        <div className="neo-card col-span-4" style={{
          backgroundColor: scan.overall_score >= 75 ? 'var(--primary-container)' : 'var(--error-container)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <h3 className="neo-card-header">Risk Score</h3>
          <div style={{ fontFamily: 'var(--font-h1-family)', fontSize: '64px', fontWeight: 900, lineHeight: 1 }}>
            {scan.overall_score}
          </div>
          <div className="ui-label-sm">{scan.overall_severity} severity</div>
        </div>

        {/* Severity breakdown */}
        <div className="neo-card col-span-8">
          <h3 className="neo-card-header">Severity Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
              const count = (scan.severity_counts || {})[sev] || 0;
              return (
                <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="data-mono" style={{ width: '80px', color: SEVERITY_COLOR[sev], fontSize: '12px' }}>{sev}</span>
                  <div style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', height: '20px' }}>
                    <div style={{
                      backgroundColor: SEVERITY_COLOR[sev],
                      height: '100%',
                      width: `${Math.min(100, count * 10)}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span className="data-mono" style={{ width: '30px', textAlign: 'right', fontSize: '12px' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Findings list */}
        {findings.length === 0 ? (
          <div className="neo-card col-span-12" style={{ textAlign: 'center', padding: 'var(--space-xl)', backgroundColor: '#e8f5e9' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#00C48C' }}>check_circle</span>
            <p className="data-mono" style={{ marginTop: '8px' }}>No findings — this scan passed cleanly.</p>
          </div>
        ) : (
          findings.map((finding, idx) => (
            <div key={idx} className="neo-card col-span-12" style={{
              borderLeft: `6px solid ${SEVERITY_COLOR[finding.severity] || 'var(--outline)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase' }}>{finding.title}</h3>
                <span className="data-mono" style={{
                  backgroundColor: SEVERITY_COLOR[finding.severity],
                  color: 'white',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '1px solid var(--on-surface)',
                }}>
                  {finding.severity}
                </span>
              </div>

              <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '12px', fontSize: '13px' }}>
                File: {finding.file} · Line: {finding.line}
              </p>

              <p className="data-mono" style={{ marginBottom: '12px', lineHeight: 1.6 }}>{finding.explanation}</p>

              <div style={{ backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline)', padding: '12px', marginBottom: '8px' }}>
                <span className="ui-label-sm" style={{ color: 'var(--primary)' }}>Fix: </span>
                <span className="data-mono" style={{ fontSize: '13px' }}>{finding.fix_suggestion}</span>
              </div>

              {finding.patch && (
                <div style={{ backgroundColor: 'var(--sidebar-bg)', color: '#00C48C', padding: '12px', fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                  <pre style={{ margin: 0 }}>{finding.patch}</pre>
                </div>
              )}

              {finding.compliance && finding.compliance.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {finding.compliance.map(c => (
                    <span key={c} className="neo-badge" style={{ fontSize: '11px' }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default ScanDetail;
