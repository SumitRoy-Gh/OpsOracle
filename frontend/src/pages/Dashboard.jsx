import React from 'react';

function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-margin)', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid var(--on-surface)', paddingBottom: 'var(--space-sm)' }}>
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>SYSTEMS STATUS</h1>
        <div className="neo-card" style={{ padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="ui-label-lg" style={{ marginRight: '8px', textTransform: 'uppercase' }}>LAST 7 DAYS</span>
          <span className="material-symbols-outlined">arrow_drop_down</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Total Scans */}
        <div className="neo-card col-span-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Total Scans</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>radar</span>
          </div>
          <div className="stat-value">14,209</div>
        </div>
        
        {/* Card 2: Issues Found */}
        <div className="neo-card col-span-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Issues Found</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>bug_report</span>
          </div>
          <div className="stat-value">3,842</div>
        </div>

        {/* Card 3: Critical Issues */}
        <div className="neo-card col-span-3" style={{ backgroundColor: 'var(--error-container)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '64px', height: '64px', backgroundColor: 'var(--error)', opacity: 0.1, transform: 'rotate(45deg) translate(32px, -32px)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-error-container)', textTransform: 'uppercase' }}>Critical Issues</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--on-error-container)', position: 'relative', zIndex: 10 }}>47</div>
        </div>

        {/* Card 4: Average Score */}
        <div className="neo-card col-span-3" style={{ backgroundColor: 'var(--primary-container)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="ui-label-lg" style={{ color: 'var(--on-primary-container)', textTransform: 'uppercase' }}>Average Score</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>speed</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--on-primary-container)' }}>B+</div>
        </div>
      </div>

      {/* Repos Health Table Section */}
      <div className="neo-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ borderBottom: '2px solid var(--border-color)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ textTransform: 'uppercase', margin: 0, fontSize: '24px' }}>REPOSITORY HEALTH INDEX</h2>
          <button className="neo-button ghost" style={{ backgroundColor: 'var(--surface-container-lowest)', fontSize: '12px', padding: '4px 12px' }}>
            VIEW ALL REPOS
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }} className="data-mono">
            <thead>
              <tr style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--on-primary)' }}>
                <th style={{ padding: '12px', borderRight: '1px solid var(--outline)', textTransform: 'uppercase', fontWeight: 'normal' }}>Repo</th>
                <th style={{ padding: '12px', borderRight: '1px solid var(--outline)', textTransform: 'uppercase', fontWeight: 'normal' }}>Health Score</th>
                <th style={{ padding: '12px', borderRight: '1px solid var(--outline)', textTransform: 'uppercase', fontWeight: 'normal' }}>Grade</th>
                <th style={{ padding: '12px', borderRight: '1px solid var(--outline)', textTransform: 'uppercase', fontWeight: 'normal' }}>Last Scan</th>
                <th style={{ padding: '12px', borderRight: '1px solid var(--outline)', textTransform: 'uppercase', fontWeight: 'normal' }}>Issues</th>
                <th style={{ padding: '12px', textTransform: 'uppercase', fontWeight: 'normal' }}>Trend</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>
              <tr style={{ borderBottom: '1px solid var(--outline)' }}>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
                  api-gateway-core
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <div style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', height: '16px' }}>
                    <div style={{ backgroundColor: 'var(--error)', height: '100%', width: '45%', borderRight: '1px solid var(--outline)' }}></div>
                  </div>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', fontWeight: 'bold', color: 'var(--error)' }}>D</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', color: 'var(--on-surface-variant)' }}>2 mins ago</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <span style={{ backgroundColor: 'var(--error)', color: 'var(--on-error)', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--on-surface)' }}>12 CRIT</span>
                </td>
                <td style={{ padding: '12px', color: 'var(--error)' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_down</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--outline)' }}>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
                  auth-service-v2
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <div style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', height: '16px' }}>
                    <div style={{ backgroundColor: 'var(--primary-container)', height: '100%', width: '88%', borderRight: '1px solid var(--outline)' }}></div>
                  </div>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', fontWeight: 'bold', color: 'var(--primary)' }}>A-</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', color: 'var(--on-surface-variant)' }}>1 hr ago</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <span style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--on-surface)' }}>0 CRIT</span>
                </td>
                <td style={{ padding: '12px', color: 'var(--primary)' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_up</span></td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder</span>
                  payment-processor
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <div style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', height: '16px' }}>
                    <div style={{ backgroundColor: 'var(--primary-fixed)', height: '100%', width: '72%', borderRight: '1px solid var(--outline)' }}></div>
                  </div>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', fontWeight: 'bold', color: 'var(--on-surface)' }}>C+</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)', color: 'var(--on-surface-variant)' }}>3 hrs ago</td>
                <td style={{ padding: '12px', borderRight: '1px solid var(--outline)' }}>
                  <span style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--on-surface)', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--on-surface)' }}>2 HIGH</span>
                </td>
                <td style={{ padding: '12px', color: 'var(--outline)' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_flat</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="dashboard-grid">
        {/* Left Col: Critical Risks */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-xs)' }}>CRITICAL RISKS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: '8px' }}>
            
            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', margin: 0 }}>
              <div style={{ backgroundColor: 'var(--error)', color: 'var(--on-error)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--on-surface)', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bomb</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 className="ui-label-lg" style={{ margin: 0 }}>CVE-2024-3094</h3>
                  <span className="data-mono" style={{ backgroundColor: 'var(--error)', color: 'var(--on-error)', padding: '2px 8px', fontSize: '12px', border: '1px solid var(--on-surface)' }}>CVSS 10.0</span>
                </div>
                <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>Malicious code discovered in upstream xz/liblzma leading to unauthenticated RCE.</p>
                <div className="data-mono" style={{ fontSize: '12px', color: 'var(--outline)' }}>AFFECTS: api-gateway-core, base-image-alpine</div>
              </div>
            </div>

            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', margin: 0 }}>
              <div style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--on-surface)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">policy</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 className="ui-label-lg" style={{ margin: 0 }}>S3 Bucket Public Access</h3>
                  <span className="data-mono" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', padding: '2px 8px', fontSize: '12px', border: '1px solid var(--on-surface)' }}>MISCONFIG</span>
                </div>
                <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>Production asset bucket modified to allow public Read/List permissions.</p>
                <div className="data-mono" style={{ fontSize: '12px', color: 'var(--outline)' }}>AFFECTS: prod-user-assets-eu-west-1</div>
              </div>
            </div>

            <div className="neo-card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', margin: 0 }}>
              <div style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--on-surface)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 className="ui-label-lg" style={{ margin: 0 }}>Outdated JWT Dependency</h3>
                  <span className="data-mono" style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)', padding: '2px 8px', fontSize: '12px', border: '1px solid var(--on-surface)' }}>DEPENDENCY</span>
                </div>
                <p className="data-mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>Library jsonwebtoken v8.5.1 is vulnerable to algorithmic confusion.</p>
                <div className="data-mono" style={{ fontSize: '12px', color: 'var(--outline)' }}>AFFECTS: auth-service-v2 (package.json)</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Col: Recent Scan Activity */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: '24px', textTransform: 'uppercase', borderBottom: '2px solid var(--on-surface)', paddingBottom: 'var(--space-xs)' }}>RECENT SCAN ACTIVITY</h2>
          <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, marginTop: '8px' }}>
            
            <div style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary-container)', border: '1px solid var(--on-surface)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="data-mono" style={{ fontWeight: 'bold' }}>frontend-webapp</span>
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Commit: 8f9a2c1</span>
                </div>
              </div>
              <div className="data-mono" style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--on-surface)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>PASS</div>
            </div>

            <div style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(255, 218, 214, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--error)', border: '1px solid var(--on-surface)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="data-mono" style={{ fontWeight: 'bold' }}>api-gateway-core</span>
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Commit: 3b11e9f</span>
                </div>
              </div>
              <div className="data-mono" style={{ backgroundColor: 'var(--error)', color: 'var(--on-error)', border: '2px solid var(--on-surface)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>FAIL</div>
            </div>

            <div style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary-container)', border: '1px solid var(--on-surface)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="data-mono" style={{ fontWeight: 'bold' }}>worker-queue-node</span>
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Commit: c9001a4</span>
                </div>
              </div>
              <div className="data-mono" style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--on-surface)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>PASS</div>
            </div>

            <div style={{ padding: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--outline)', border: '1px solid var(--on-surface)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="data-mono" style={{ fontWeight: 'bold' }}>legacy-billing-db</span>
                  <span className="data-mono" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Scheduled Scan</span>
                </div>
              </div>
              <div className="data-mono" style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)', border: '2px solid var(--outline)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>WARN</div>
            </div>

            <div className="ui-label-sm" style={{ padding: 'var(--space-sm)', borderTop: '2px solid var(--on-surface)', backgroundColor: 'var(--surface-variant)', textAlign: 'center', cursor: 'pointer' }}>
              View Activity Log -&gt;
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="dashboard-grid">
        {/* Automate Triage */}
        <div className="neo-card col-span-6" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--on-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-lg)', boxShadow: '4px 4px 0px 0px var(--inverse-primary)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ color: 'var(--primary-container)', textTransform: 'uppercase', fontSize: '32px', margin: 0 }}>AUTOMATE TRIAGE</h3>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--primary-container)' }}>auto_awesome</span>
            </div>
            <p className="data-mono" style={{ color: 'var(--surface-dim)', maxWidth: '400px' }}>
              Enable AI-driven categorization to automatically route non-critical misconfigurations to the backlog, reducing alert fatigue by 40%.
            </p>
          </div>
          <button className="neo-button" style={{ marginTop: 'var(--space-xl)', alignSelf: 'flex-start', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
            CONFIGURE RULES
          </button>
        </div>

        {/* Compliance Score */}
        <div className="neo-card col-span-6" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--on-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-32px', bottom: '-64px', fontSize: '180px', fontWeight: '900', color: 'var(--surface-variant)', opacity: 0.1, lineHeight: 1, pointerEvents: 'none', fontFamily: 'var(--font-h1-family)' }}>SOC2</div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h3 style={{ textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>COMPLIANCE SCORE</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div style={{ fontFamily: 'var(--font-h1-family)', fontSize: '72px', lineHeight: 1, color: 'var(--surface-container-lowest)', letterSpacing: '-0.02em', fontWeight: '700' }}>94<span style={{ fontSize: '24px' }}>%</span></div>
              <div className="data-mono" style={{ paddingBottom: '8px', color: 'var(--surface-dim)', textTransform: 'uppercase' }}>PASSING</div>
            </div>
            <div style={{ marginTop: 'var(--space-md)', width: '100%', backgroundColor: 'var(--surface-variant)', height: '8px', border: '1px solid var(--outline)' }}>
              <div style={{ backgroundColor: 'var(--primary-container)', height: '100%', width: '94%' }}></div>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 10, marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--outline)', paddingTop: 'var(--space-md)' }}>
            <span className="data-mono" style={{ fontSize: '14px', color: 'var(--surface-dim)' }}>Next Audit: 14 Days</span>
            <button style={{ color: 'var(--primary-container)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: 'bold' }} className="ui-label-sm">GENERATE REPORT</button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
