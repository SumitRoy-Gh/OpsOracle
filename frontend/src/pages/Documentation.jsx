import React, { useState, useEffect } from 'react';

function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    const sections = document.querySelectorAll('main section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-xl)', width: '100%', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start' }}>

      {/* Table of Contents Navigation */}
      <nav style={{ width: '250px', flexShrink: 0, position: 'sticky', top: 'var(--space-margin)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)', overflowY: 'auto', paddingRight: 'var(--space-md)' }}>
        <h3 className="ui-label-lg" style={{ marginBottom: 'var(--space-lg)', textTransform: 'uppercase', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>Navigation</h3>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><a href="#getting-started" className={`doc-nav-link ${activeSection === 'getting-started' ? 'active' : ''}`}>Getting Started</a></li>
          <li><a href="#architecture" className={`doc-nav-link ${activeSection === 'architecture' ? 'active' : ''}`}>Architecture</a></li>
          <li><a href="#agents" className={`doc-nav-link ${activeSection === 'agents' ? 'active' : ''}`}>Agents Detail</a></li>
          <li><a href="#scanner-rules" className={`doc-nav-link ${activeSection === 'scanner-rules' ? 'active' : ''}`}>Scanner Rules</a></li>
          <li><a href="#api-reference" className={`doc-nav-link ${activeSection === 'api-reference' ? 'active' : ''}`}>API Reference</a></li>
          <li><a href="#webhook-setup" className={`doc-nav-link ${activeSection === 'webhook-setup' ? 'active' : ''}`}>Webhook Setup</a></li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '64px', paddingBottom: '128px' }}>

        <section id="getting-started" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h1 style={{ textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Documentation</h1>
          <p className="data-mono" style={{ maxWidth: '800px', fontSize: '16px', marginBottom: 'var(--space-sm)' }}>
            Comprehensive guide to integrating, configuring, and deploying the OpsOracle DevSecOps platform. Built for engineers who require zero-latency security intelligence.
          </p>
          <div className="neo-card" style={{ backgroundColor: 'var(--surface-container-lowest)', padding: 'var(--space-lg)' }}>
            <h3 style={{ textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>Core Philosophy</h3>
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.8 }}>
              OpsOracle is built on the principle of <strong>preventative security</strong>. Unlike traditional scanners that run asynchronously and report issues after they are merged, our Sentinel system evaluates diffs in real-time, executing policy engines, static analysis, and AI-driven heuristics before code ever hits your main branch. By shifting left to the absolute earliest point in the CI/CD pipeline, we eliminate the costly triage phase entirely.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            <div className="neo-card" style={{ backgroundColor: 'var(--primary-container)', padding: 'var(--space-md)' }}>
              <h4 style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Pre-Requisites</h4>
              <ul className="data-mono" style={{ listStylePosition: 'inside', color: 'var(--on-primary-container)', fontSize: '14px' }}>
                <li>Node.js 18+</li>
                <li>Docker Engine</li>
                <li>Admin VCS Access</li>
              </ul>
            </div>
            <div className="neo-card" style={{ backgroundColor: 'var(--on-surface)', color: 'white', padding: 'var(--space-md)' }}>
              <h4 style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Quick Install</h4>
              <code className="data-mono" style={{ color: '#00C48C', fontSize: '12px' }}>npm install -g @opsoracle/cli</code>
            </div>
          </div>
        </section>

        <section id="architecture" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>account_tree</span>
            <h2 style={{ textTransform: 'uppercase' }}>System Overview</h2>
          </div>
          <div className="neo-card" style={{ padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)', overflow: 'hidden' }}>
            <img 
              alt="OpsOracle System Architecture" 
              src="/architecture.png" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block',
                border: '2px solid var(--on-surface)',
                boxShadow: '4px 4px 0px 0px var(--on-surface)'
              }} 
            />
          </div>
        </section>

        <section id="agents" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>smart_toy</span>
            <h2 style={{ textTransform: 'uppercase' }}>Agents Detail</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)' }}>
            {/* TriggerAgent */}
            <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: 'var(--surface-container-lowest)' }}>
              <div style={{ borderBottom: '2px solid var(--on-surface)', padding: 'var(--space-md)', backgroundColor: 'var(--primary-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ textTransform: 'uppercase' }}>TriggerAgent</h3>
                <span className="data-mono" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--primary-container)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVE</span>
              </div>
              <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', flex: 1 }}>
                <p className="data-mono">Initiates analysis sequence upon webhook payload reception. Validates payload integrity and extracts core metadata.</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--on-surface)', fontSize: '12px' }} className="data-mono">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textAlign: 'left' }}>
                      <th style={{ border: '1px solid var(--on-surface)', padding: '8px', textTransform: 'uppercase' }}>Config Key</th>
                      <th style={{ border: '1px solid var(--on-surface)', padding: '8px', textTransform: 'uppercase' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid var(--on-surface)', padding: '8px', backgroundColor: 'var(--surface)' }}>WEBHOOK_SECRET</td>
                      <td style={{ border: '1px solid var(--on-surface)', padding: '8px', backgroundColor: 'var(--surface-container-lowest)' }}>String</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid var(--on-surface)', padding: '8px', backgroundColor: 'var(--surface)' }}>MAX_PAYLOAD_MB</td>
                      <td style={{ border: '1px solid var(--on-surface)', padding: '8px', backgroundColor: 'var(--surface-container-lowest)' }}>Integer</td>
                    </tr>
                  </tbody>
                </table>
                <div className="neo-card data-mono" style={{ backgroundColor: 'var(--sidebar-bg)', color: '#00C48C', padding: 'var(--space-md)', overflowX: 'auto', marginTop: 'auto' }}>
                  <pre style={{ margin: 0 }}><code>import {'{'} TriggerAgent {'}'} from '@opsoracle/core';

                    const agent = new TriggerAgent({'{'}
                    strictMode: true,
                    timeoutMs: 5000
                    {'}'});

                    agent.listen();</code></pre>
                </div>
              </div>
            </div>

            {/* AnalysisAgent */}
            <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: 'var(--surface-container-lowest)' }}>
              <div style={{ borderBottom: '2px solid var(--on-surface)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ textTransform: 'uppercase' }}>AnalysisAgent</h3>
                <span className="data-mono" style={{ backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', border: '2px solid var(--on-surface)' }}>IDLE</span>
              </div>
              <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', flex: 1 }}>
                <p className="data-mono">Processes diffs against active security rulesets. Interfaces with Gemini for heuristic vulnerability detection.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="data-mono" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-surface)', border: '2px solid var(--on-surface)', padding: '4px 8px', fontSize: '12px' }}>Model: gemini-pro-1.5</span>
                  <span className="data-mono" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface-container-lowest)', border: '2px solid var(--on-surface)', padding: '4px 8px', fontSize: '12px' }}>VectorDB: Pinecone</span>
                </div>
                <div className="neo-card data-mono" style={{ backgroundColor: 'var(--sidebar-bg)', color: '#00C48C', padding: 'var(--space-md)', overflowX: 'auto', marginTop: 'auto' }}>
                  <pre style={{ margin: 0 }}><code>const findings = await analysisAgent.scan({'{'}
                    target: pr.diff,
                    context: repo.securityContext
                    {'}'});

                    if(findings.critical &gt; 0) escalate();</code></pre>
                </div>
              </div>
            </div>

            {/* PatchAgent */}
            <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: 'var(--surface-container-lowest)' }}>
              <div style={{ borderBottom: '2px solid var(--on-surface)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ textTransform: 'uppercase' }}>PatchAgent</h3>
                <span className="data-mono" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-surface)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', border: '2px solid var(--on-surface)' }}>STANDBY</span>
              </div>
              <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', flex: 1 }}>
                <p className="data-mono">Generates automated remediation code for identified vulnerabilities. Validates patch compilation before PR suggestion.</p>
                <div className="data-mono" style={{ backgroundColor: 'var(--surface)', borderLeft: '4px solid var(--on-surface)', padding: '8px 16px', fontSize: '14px' }}>
                  Requires write-access token scoped to <code>pull_requests:write</code>.
                </div>
              </div>
            </div>

            {/* AutoRollback */}
            <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: 'var(--surface-container-lowest)', borderLeft: '8px solid var(--error)' }}>
              <div style={{ borderBottom: '2px solid var(--on-surface)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ textTransform: 'uppercase' }}>AutoRollback</h3>
                <span className="data-mono" style={{ backgroundColor: 'var(--error)', color: 'white', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', border: '2px solid var(--on-surface)' }}>CRITICAL</span>
              </div>
              <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', flex: 1 }}>
                <p className="data-mono">Executes immediate deployment reversion upon detection of severe SLA breaches or critical security regressions post-merge.</p>
                <button className="neo-button" style={{ backgroundColor: 'var(--error)', color: 'white', marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined">warning</span> CONFIGURE KILL SWITCH
                </button>
              </div>
            </div>

          </div>
        </section>

        <section id="scanner-rules" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>rule</span>
            <h2 style={{ textTransform: 'uppercase' }}>Scanner Rules</h2>
          </div>
          <div className="neo-card" style={{ overflowX: 'auto', padding: 0, backgroundColor: 'var(--surface-container-lowest)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr className="ui-label-lg" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', textTransform: 'uppercase' }}>
                  <th style={{ borderBottom: '2px solid var(--on-surface)', borderRight: '2px solid var(--on-surface)', padding: '16px', whiteSpace: 'nowrap' }}>Rule ID</th>
                  <th style={{ borderBottom: '2px solid var(--on-surface)', borderRight: '2px solid var(--on-surface)', padding: '16px' }}>Severity</th>
                  <th style={{ borderBottom: '2px solid var(--on-surface)', borderRight: '2px solid var(--on-surface)', padding: '16px' }}>Category</th>
                  <th style={{ borderBottom: '2px solid var(--on-surface)', borderRight: '2px solid var(--on-surface)', padding: '16px' }}>File Pattern</th>
                  <th style={{ borderBottom: '2px solid var(--on-surface)', padding: '16px', width: '100%' }}>Description</th>
                </tr>
              </thead>
              <tbody className="data-mono" style={{ backgroundColor: 'var(--surface-container-lowest)', fontSize: '14px' }}>
                <tr>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', fontWeight: 'bold' }}>SEC-001</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>
                    <span style={{ backgroundColor: 'var(--error)', color: 'white', padding: '4px 8px', border: '1px solid var(--on-surface)', display: 'block', textAlign: 'center' }}>HIGH</span>
                  </td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>Credentials</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', backgroundColor: 'var(--surface)' }}>.*\.env$</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', padding: '16px' }}>Detects hardcoded secrets or API keys in configuration files.</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', fontWeight: 'bold' }}>SEC-042</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>
                    <span style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-surface)', padding: '4px 8px', border: '1px solid var(--on-surface)', display: 'block', textAlign: 'center' }}>MED</span>
                  </td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>Injection</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', backgroundColor: 'var(--surface)' }}>.*\.ts$</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', padding: '16px' }}>Identifies raw SQL queries lacking parameterization.</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', fontWeight: 'bold' }}>SEC-105</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>
                    <span style={{ backgroundColor: 'var(--on-surface)', color: 'white', padding: '4px 8px', border: '1px solid var(--on-surface)', display: 'block', textAlign: 'center' }}>LOW</span>
                  </td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px' }}>Dependency</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', borderRight: '1px solid var(--on-surface)', padding: '16px', backgroundColor: 'var(--surface)' }}>package.json</td>
                  <td style={{ borderBottom: '1px solid var(--on-surface)', padding: '16px' }}>Flags outdated packages with known minor CVEs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="api-reference" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>api</span>
            <h2 style={{ textTransform: 'uppercase' }}>API Reference</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <span style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-surface)', fontFamily: 'var(--font-h3-family)', fontSize: '18px', padding: '8px 16px', border: '2px solid var(--on-surface)', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center' }}>GET</span>
              <code className="data-mono" style={{ fontSize: '16px', backgroundColor: 'var(--surface)', padding: '8px 16px', border: '1px solid var(--on-surface)' }}>/api/v2/scans/{'{scan_id}'}</code>
              <span className="data-mono" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>Retrieve details of a specific security scan.</span>
            </div>
            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <span style={{ backgroundColor: '#00C48C', color: 'var(--on-surface)', fontFamily: 'var(--font-h3-family)', fontSize: '18px', padding: '8px 16px', border: '2px solid var(--on-surface)', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center' }}>POST</span>
              <code className="data-mono" style={{ fontSize: '16px', backgroundColor: 'var(--surface)', padding: '8px 16px', border: '1px solid var(--on-surface)' }}>/api/v2/trigger</code>
              <span className="data-mono" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>Manually trigger an asynchronous repository scan.</span>
            </div>
            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <span style={{ backgroundColor: 'var(--on-surface)', color: 'white', fontFamily: 'var(--font-h3-family)', fontSize: '18px', padding: '8px 16px', border: '2px solid var(--on-surface)', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center' }}>DEL</span>
              <code className="data-mono" style={{ fontSize: '16px', backgroundColor: 'var(--surface)', padding: '8px 16px', border: '1px solid var(--on-surface)' }}>/api/v2/rules/{'{rule_id}'}</code>
              <span className="data-mono" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>Deactivate a custom security rule.</span>
            </div>
          </div>
        </section>

        <section id="webhook-setup" style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>webhook</span>
            <h2 style={{ textTransform: 'uppercase' }}>Webhook Setup</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
            <div className="neo-card" style={{ backgroundColor: 'var(--primary-container)', padding: 'var(--space-xl) var(--space-lg) var(--space-lg)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'var(--on-surface)', color: 'white', fontFamily: 'var(--font-h2-family)', fontSize: '24px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid var(--on-surface)', borderBottom: '2px solid var(--on-surface)' }}>1</div>
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Generate Secret</h3>
              <p className="data-mono" style={{ fontSize: '14px', marginBottom: 'var(--space-md)' }}>Run the sentinel CLI to generate a cryptographically secure webhook signature token.</p>
              <code style={{ display: 'block', backgroundColor: 'var(--sidebar-bg)', color: '#00C48C', padding: '12px', border: '2px solid var(--on-surface)', fontSize: '12px' }} className="data-mono">sentinel keys generate</code>
            </div>

            <div className="neo-card" style={{ backgroundColor: 'var(--primary-container)', padding: 'var(--space-xl) var(--space-lg) var(--space-lg)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'var(--on-surface)', color: 'white', fontFamily: 'var(--font-h2-family)', fontSize: '24px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid var(--on-surface)', borderBottom: '2px solid var(--on-surface)' }}>2</div>
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Configure VCS</h3>
              <p className="data-mono" style={{ fontSize: '14px', marginBottom: 'var(--space-md)' }}>Add the Webhook URL and Secret to your GitHub/GitLab repository settings under 'Webhooks'.</p>
              <div style={{ backgroundColor: 'var(--surface-container-lowest)', border: '2px solid var(--on-surface)', padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }} className="data-mono">
                https://api.opsoracle.com/hook
              </div>
            </div>

            <div className="neo-card" style={{ backgroundColor: 'var(--primary-container)', padding: 'var(--space-xl) var(--space-lg) var(--space-lg)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'var(--on-surface)', color: 'white', fontFamily: 'var(--font-h2-family)', fontSize: '24px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid var(--on-surface)', borderBottom: '2px solid var(--on-surface)' }}>3</div>
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Verify Ping</h3>
              <p className="data-mono" style={{ fontSize: '14px', marginBottom: 'var(--space-md)' }}>Send a test payload. OpsOracle will respond with a 200 OK and initialize the Risk Tracker baseline.</p>
              <span className="ui-label-sm" style={{ display: 'inline-block', backgroundColor: 'var(--surface-container-lowest)', border: '2px solid var(--on-surface)', padding: '4px 12px', textTransform: 'uppercase' }}>Status: Pending</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default Documentation;
