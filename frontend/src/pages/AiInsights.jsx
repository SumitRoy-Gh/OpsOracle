import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

function AiInsights() {
  const [rollbackHistory, setRollbackHistory] = useState([]);
  const [triggerStats, setTriggerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getRollbackHistory(),
      api.getTriggerStats(),
    ]).then(([rollback, stats]) => {
      setRollbackHistory(rollback.history || []);
      setTriggerStats(stats.stats || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const data = await api.chat(chatInput, '', chatMessages.slice(-6));
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error reaching AI. Is the backend running?' }]);
    }
    setChatLoading(false);
  };

  return (
    <>
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <h1>AI Insights Engine</h1>
        <p className="data-mono" style={{ marginTop: 'var(--space-sm)', color: 'var(--on-surface-variant)' }}>
          Continuous security analysis, automated remediation tracking, and AI chat.
        </p>
      </header>

      <div className="dashboard-grid">
        {/* Trigger Agent Stats */}
        {triggerStats && (
          <div className="neo-card col-span-6">
            <h3 className="neo-card-header">Trigger Agent Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {[
                { label: 'Total AI Calls', value: triggerStats.calls },
                { label: 'Cache Hits (saved calls)', value: triggerStats.cache_hits },
                { label: 'Cooldown Skips', value: triggerStats.cooldown_skips },
                { label: 'Threshold Skips', value: triggerStats.threshold_skips },
                { label: 'Cache Size', value: triggerStats.cache_size },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--outline)', paddingBottom: '8px' }} className="data-mono">
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: 'bold' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rollback History */}
        <div className="neo-card col-span-6">
          <h3 className="neo-card-header">Auto-Rollback Decisions</h3>
          {rollbackHistory.length === 0 ? (
            <p className="data-mono" style={{ color: 'var(--on-surface-variant)', padding: '16px 0' }}>No rollback decisions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {rollbackHistory.slice(0, 5).map((event, idx) => (
                <div key={idx} style={{ border: '1px solid var(--outline)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="data-mono" style={{ fontSize: '12px', fontWeight: 'bold' }}>{event.repo}</span>
                    <span className="data-mono" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginLeft: '8px' }}>PR #{event.pr_number}</span>
                  </div>
                  <span className="neo-badge" style={{
                    backgroundColor: event.action === 'BLOCKED' ? 'var(--error)' : event.action === 'WARNED' ? 'var(--primary-container)' : '#00C48C',
                    color: event.action === 'BLOCKED' ? 'white' : '#111',
                    fontSize: '10px',
                  }}>
                    {event.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="neo-card col-span-12">
          <h3 className="neo-card-header">OpsOracle AI Chat</h3>
          <div style={{
            height: '300px',
            overflowY: 'auto',
            backgroundColor: 'var(--sidebar-bg)',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {chatMessages.length === 0 && (
              <p className="data-mono" style={{ color: '#666', fontSize: '12px' }}>
                Ask anything about your infrastructure security, findings, or DevOps...
              </p>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: msg.role === 'user' ? 'var(--primary-container)' : '#222',
                color: msg.role === 'user' ? '#111' : '#fff',
                padding: '8px 12px',
                border: '1px solid #333',
                fontFamily: 'IBM Plex Mono',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="data-mono" style={{ color: '#00C48C', fontSize: '12px' }}>Thinking...</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask OpsOracle AI..."
              style={{
                flex: 1,
                padding: '12px',
                fontFamily: 'IBM Plex Mono',
                fontSize: '14px',
                border: '2px solid var(--border-color)',
                backgroundColor: 'var(--surface-container-lowest)',
                outline: 'none',
              }}
            />
            <button className="neo-button" onClick={sendChat} disabled={chatLoading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AiInsights;
