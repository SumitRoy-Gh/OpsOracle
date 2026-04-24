import React from 'react';

function AiInsights() {
  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>AI Insights Engine</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Continuous security analysis and automated remediation tracking.
        </p>
      </header>

      <div className="dashboard-grid">
        
        <div className="neo-card col-span-6">
          <h3 className="neo-card-header">Agent Activity Monitor</h3>
          <div style={{ height: '200px', backgroundColor: 'var(--surface-variant)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>[ ACTIVITY GRAPH ]</p>
          </div>
        </div>

        <div className="neo-card col-span-6">
          <h3 className="neo-card-header">Pinecone Memory</h3>
          <div style={{ height: '200px', backgroundColor: 'var(--surface-variant)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)' }}>[ VECTOR INDEX STATUS ]</p>
          </div>
        </div>

        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">Top Recurring Patterns</h3>
          <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)' }}>
            <div style={{ minWidth: '250px', padding: 'var(--space-md)', border: 'var(--border-width) solid var(--border-color)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <h4 style={{ marginBottom: 'var(--space-xs)' }}>Hardcoded Secrets</h4>
              <p className="data-mono" style={{ color: 'var(--error)' }}>14 incidents</p>
            </div>
            <div style={{ minWidth: '250px', padding: 'var(--space-md)', border: 'var(--border-width) solid var(--border-color)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <h4 style={{ marginBottom: 'var(--space-xs)' }}>Open S3 Buckets</h4>
              <p className="data-mono" style={{ color: 'var(--error)' }}>8 incidents</p>
            </div>
            <div style={{ minWidth: '250px', padding: 'var(--space-md)', border: 'var(--border-width) solid var(--border-color)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <h4 style={{ marginBottom: 'var(--space-xs)' }}>Root Containers</h4>
              <p className="data-mono" style={{ color: 'var(--primary-container)' }}>5 incidents</p>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <h2 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            Gemini Recommendations
          </h2>
          
          <div className="neo-card" style={{ marginBottom: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)' }}>
            <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--primary)' }}>Enforce Non-Root Containers</h3>
            <p className="data-mono">
              Pattern detected across 3 microservices. Recommend implementing a Kyverno policy to block root containers globally.
            </p>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <button className="neo-button">Generate Policy</button>
            </div>
          </div>

          <div className="neo-card" style={{ backgroundColor: 'var(--surface-container-low)' }}>
            <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--primary)' }}>Refactor IAM Roles</h3>
            <p className="data-mono">
              High frequency of wildcards in <code>dev-env</code> Terraform. AI suggests generating least-privilege roles based on CloudTrail logs.
            </p>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <button className="neo-button ghost" style={{ border: 'var(--border-width) solid var(--border-color)' }}>Analyze Logs</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default AiInsights;
