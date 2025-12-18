import React, { useEffect, useState, useRef } from 'react';

const AGENT_ICONS = {
  context: <span role="img" aria-label="Owl">🦉</span>,
  policy: <span role="img" aria-label="Scroll">📜</span>,
  audit: <span role="img" aria-label="Shield">🛡️</span>,
  negotiation: <span role="img" aria-label="Handshake">🤝</span>,
  'pre-flight': <span role="img" aria-label="Hummingbird">🕊️</span>,
};

const AGENT_COLORS = {
  context: '#9daac5',
  policy: '#f4a555',
  audit: '#f18c25',
  negotiation: '#9daac5',
  'pre-flight': '#7d8eb2',
};

const agentList = [
  { key: 'context', name: 'Context Agent', status: 'Active', last: 'Context detected (Client Presentation)', action: 'Analyzing submission...' },
  { key: 'policy', name: 'Policy Agent', status: 'Learning', last: 'Approved social media policy', action: 'Reviewing rule updates' },
  { key: 'audit', name: 'Audit Agent', status: 'Idle', last: 'Logged new request', action: 'No open audits' },
];

const sidebarNav = [
  { icon: '🕊️', color: '#f18c25' },
  { icon: '🏠', color: '#9daac5' },
  { icon: '🦉', color: '#f18c25' },
  { icon: '📜', color: '#7d8eb2' },
  { icon: '🛡️', color: '#f4a555' },
  { icon: '🤝', color: '#9daac5' },
];

const marketTools = [
  { name: 'AI Image Tool', color: '#9daac5' },
  { name: 'Audit Helper', color: '#f18c25' },
  { name: 'Policy Score', color: '#f4a555' },
];

const IntelligenceDashboard = () => {
  const [metrics, setMetrics] = useState({ insights: {}, workflows: {} });
  const [liveFeed, setLiveFeed] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    wsRef.current = new window.WebSocket('ws://localhost:3001');
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'routing-decision') {
        setLiveFeed(prev => [{
          time: new Date().toLocaleTimeString(),
          type: data.data.analysis?.type?.primary,
          risk: data.data.analysis?.riskLevel?.level,
          workflow: data.data.workflow?.name,
          confidence: data.data.confidence
        }, ...prev].slice(0, 30));
      }
    };
    return () => {
      clearInterval(interval);
      wsRef.current && wsRef.current.close();
    };
  }, []);

  async function fetchMetrics() {
    const res = await fetch('/api/metrics/workflows');
    const data = await res.json();
    setMetrics(data);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f7', fontFamily: 'Inter, Nunito, Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 100, background: '#fff', boxShadow: '2px 0 12px #e0e6f0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ background: '#f18c25', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>🕊️</span>
          </div>
        </div>
        {sidebarNav.map((nav, i) => (
          <div key={i} style={{ background: nav.color, borderRadius: 20, width: 60, height: 60, margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 }}>{nav.icon}</span>
          </div>
        ))}
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: '0 0 0 0', position: 'relative' }}>
        {/* Header */}
        <div style={{ height: 80, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', boxShadow: '0 2px 12px #e0e6f0' }}>
          <div style={{ fontSize: 32, color: '#7d8eb2', fontWeight: 700 }}>Dashboard Overview</div>
          <button style={{ background: '#f18c25', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 32px', fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px #f4a55555', cursor: 'pointer' }}>Create Policy</button>
        </div>
        {/* Agent Cards Grid */}
        <div style={{ display: 'flex', gap: 32, margin: '40px 0 0 40px' }}>
          {agentList.map(agent => (
            <div key={agent.key} style={{ width: 320, height: 180, borderRadius: 28, background: '#fff', boxShadow: '0 4px 24px #e0e6f0', border: `3px solid ${AGENT_COLORS[agent.key] || '#7d8eb2'}`, padding: 24, position: 'relative' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: AGENT_COLORS[agent.key] }}>{agent.name}</div>
              <div style={{ position: 'absolute', top: 24, right: 24 }}>
                <div style={{ background: AGENT_COLORS[agent.key], borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, color: '#fff' }}>{AGENT_ICONS[agent.key]}</span>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 16, color: AGENT_COLORS[agent.key], fontWeight: 600 }}>{agent.status}</div>
              <div style={{ marginTop: 8, fontSize: 15, color: '#7d8eb2' }}>{agent.action}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#9daac5' }}>Last action: {agent.last}</div>
            </div>
          ))}
        </div>
        {/* User Graph */}
        <div style={{ margin: '40px 0 0 40px', background: '#fff', borderRadius: 24, width: 680, height: 180, boxShadow: '0 4px 24px #e0e6f0', padding: 24 }}>
          <div style={{ fontSize: 22, color: '#7d8eb2', fontWeight: 700, marginBottom: 16 }}>User Graph: AI Agent Activity</div>
          {/* Simple bar chart mockup */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 24 }}>
            <div style={{ width: 40, height: 80, background: '#f18c25', borderRadius: 10 }}></div>
            <div style={{ width: 40, height: 60, background: '#9daac5', borderRadius: 10 }}></div>
            <div style={{ width: 40, height: 50, background: '#7d8eb2', borderRadius: 10 }}></div>
            <div style={{ width: 40, height: 40, background: '#f4a555', borderRadius: 10 }}></div>
            <div style={{ width: 40, height: 70, background: '#bdc6d8', borderRadius: 10 }}></div>
            <div style={{ width: 40, height: 40, background: '#f18c25', borderRadius: 10 }}></div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8, color: '#9daac5', fontSize: 13 }}>
            <div>Jan</div><div>Feb</div><div>Mar</div><div>Apr</div><div>May</div><div>Jun</div>
          </div>
        </div>
        {/* Marketplace/Tools Preview */}
        <div style={{ margin: '40px 0 0 40px', background: '#fff', borderRadius: 24, width: 680, height: 120, boxShadow: '0 4px 24px #e0e6f0', padding: 24, display: 'flex', gap: 32 }}>
          <div style={{ fontSize: 22, color: '#7d8eb2', fontWeight: 700, marginRight: 32 }}>Marketplace Tools</div>
          {marketTools.map(tool => (
            <div key={tool.name} style={{ background: tool.color, borderRadius: 14, width: 120, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 16, marginRight: 16 }}>{tool.name}</div>
          ))}
        </div>
        {/* Metrics and Workflows */}
        <div style={{ margin: '40px 0 0 40px', display: 'flex', gap: 32 }}>
          {/* Metrics */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e6f0', padding: 24, minWidth: 180 }}>
                <div style={{ fontSize: 18, color: '#7d8eb2', fontWeight: 700 }}>Fast Track Rate</div>
                <div style={{ fontSize: 36, color: '#f18c25', fontWeight: 700 }}>{metrics.insights?.fastTrackPercentage || 0}%</div>
                <div style={{ color: '#9daac5', fontSize: 14 }}>Submissions using express lane</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e6f0', padding: 24, minWidth: 180 }}>
                <div style={{ fontSize: 18, color: '#7d8eb2', fontWeight: 700 }}>Risk Detection</div>
                <div style={{ fontSize: 36, color: '#7d8eb2', fontWeight: 700 }}>{(metrics.insights?.riskDetectionAccuracy * 100 || 0).toFixed(0)}%</div>
                <div style={{ color: '#9daac5', fontSize: 14 }}>Accuracy in identifying high-risk content</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e6f0', padding: 24, minWidth: 180 }}>
                <div style={{ fontSize: 18, color: '#7d8eb2', fontWeight: 700 }}>False Positives</div>
                <div style={{ fontSize: 36, color: '#f4a555', fontWeight: 700 }}>↓ {(metrics.insights?.falsePositiveReduction * 100 || 0).toFixed(0)}%</div>
                <div style={{ color: '#9daac5', fontSize: 14 }}>Reduction with smart routing</div>
              </div>
            </div>
            {/* Workflow Distribution */}
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 20, color: '#7d8eb2', fontWeight: 700, marginBottom: 12 }}>Workflow Distribution</div>
              {Object.entries(metrics.workflows || {}).map(([name, data]) => (
                <div key={name} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#7d8eb2' }}>{name}</div>
                  <div style={{ background: '#e0e0e0', height: 24, borderRadius: 8, overflow: 'hidden', margin: '6px 0' }}>
                    <div style={{ background: '#f18c25', height: '100%', width: `${Math.min(data.count, 100)}%`, borderRadius: 8, transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ color: '#9daac5', fontSize: 13 }}>{data.count} submissions | {data.avgDuration} avg | Success: {(data.successRate * 100).toFixed(0)}% | Confidence: {data.avgConfidence}%</div>
                </div>
              ))}
            </div>
          </div>
          {/* Agent Insights Feed */}
          <div style={{ width: 340, background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px #e0e6f0', padding: 24, minHeight: 400 }}>
            <div style={{ fontSize: 22, color: '#7d8eb2', fontWeight: 700, marginBottom: 16 }}>Agent Insights</div>
            {/* Example agent messages, could be dynamic in the future */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ background: '#f4a555', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><span style={{ fontSize: 16 }}>📜</span></div>
              <div style={{ background: '#f18c25', borderRadius: 10, padding: '8px 16px', color: '#7d8eb2', fontSize: 15, fontWeight: 500, opacity: 0.9 }}>Policy Agent: New draft detected. Suggest update.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ background: '#9daac5', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><span style={{ fontSize: 16 }}>🦉</span></div>
              <div style={{ background: '#9daac5', borderRadius: 10, padding: '8px 16px', color: '#7d8eb2', fontSize: 15, fontWeight: 500, opacity: 0.9 }}>Context Agent: No risk detected in latest submission.</div>
            </div>
            {/* Live Routing Feed */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 16, color: '#7d8eb2', fontWeight: 600, marginBottom: 8 }}>Live Routing Decisions</div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {liveFeed.map((entry, i) => (
                  <div key={i} style={{ marginBottom: 8, fontFamily: 'monospace', color: '#7d8eb2', background: '#f0f0f0', borderRadius: 8, padding: '6px 10px' }}>
                    [{entry.time}] <b>{entry.type}</b> | Risk: <b>{entry.risk}</b> | Workflow: <b>{entry.workflow}</b> | Confidence: <b>{entry.confidence}%</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Polygon Watermarks */}
        <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
          <polygon points="150,770 300,650 400,760" fill="#f18c25" opacity="0.07" />
          <polygon points="1000,770 1100,650 1150,760" fill="#9daac5" opacity="0.07" />
        </svg>
      </div>
    </div>
  );
};

export default IntelligenceDashboard; 