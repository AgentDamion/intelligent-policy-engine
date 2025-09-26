console.log('JavaScript file started loading!');
// Agent configurations matching your actual system
const agentConfigs = {
    policy: {
      name: 'Policy Agent',
      icon: '📜',
      color: 'policy',
      description: 'Reviews and enforces compliance policies'
    },
    audit: {
      name: 'Audit Agent',
      icon: '🛡️',
      color: 'audit',
      description: 'Tracks all compliance decisions and creates audit trails'
    },
    negotiation: {
      name: 'Negotiation Agent',
      icon: '🤝',
      color: 'negotiation',
      description: 'Handles policy conflicts and negotiations'
    },
    'pre-flight': {
      name: 'Pre-Flight Agent',
      icon: '✈️',
      color: 'preflight',
      description: 'Validates submissions before processing'
    },
    'submission-state': {
      name: 'Submission Manager',
      icon: '📋',
      color: 'submission',
      description: 'Manages submission workflow states'
    }
  };
  
  // Agent state tracking
  const agentStates = {};
  
  // Initialize agent cards
  function initializeAgentCards() {
    const container = document.getElementById('agent-cards');
    
    Object.entries(agentConfigs).forEach(([key, config]) => {
      agentStates[key] = {
        status: 'idle',
        currentAction: 'Waiting for tasks...',
        lastAction: 'System initialized',
        processed: 0,
        successRate: 100
      };
      
      const card = document.createElement('div');
      card.className = `agent-card ${config.color}`;
      card.id = `agent-${key}`;
      card.innerHTML = `
        <div class="agent-header">
          <div class="agent-icon ${config.color}">${config.icon}</div>
          <div class="agent-title">${config.name}</div>
          <div class="agent-status idle" id="${key}-status">Idle</div>
        </div>
        <div class="agent-details">
          <div class="agent-action" id="${key}-action">Waiting for tasks...</div>
          <div class="agent-last" id="${key}-last">Last: System initialized</div>
          <div class="agent-metrics">
            <div class="metric-item">
              Processed: <span class="metric-value" id="${key}-processed">0</span>
            </div>
            <div class="metric-item">
              Success: <span class="metric-value" id="${key}-success">100%</span>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
  
  // Update agent card UI
  function updateAgentCard(agentKey, updates) {
    if (!agentStates[agentKey]) return;
    
    Object.assign(agentStates[agentKey], updates);
    
    if (updates.status) {
      const statusEl = document.getElementById(`${agentKey}-status`);
      statusEl.textContent = updates.status.charAt(0).toUpperCase() + updates.status.slice(1);
      statusEl.className = `agent-status ${updates.status}`;
    }
    
    if (updates.currentAction) {
      document.getElementById(`${agentKey}-action`).textContent = updates.currentAction;
    }
    
    if (updates.lastAction) {
      document.getElementById(`${agentKey}-last`).textContent = `Last: ${updates.lastAction}`;
    }
    
    if (updates.processed !== undefined) {
      document.getElementById(`${agentKey}-processed`).textContent = updates.processed;
    }
    
    if (updates.successRate !== undefined) {
      document.getElementById(`${agentKey}-success`).textContent = `${updates.successRate}%`;
    }
  }
  
  // Add insight to feed
  function addInsight(agentKey, message, type = 'info') {
    const feed = document.getElementById('insights-feed');
    const config = agentConfigs[agentKey] || { name: 'System', icon: '⚙️' };
    
    const insight = document.createElement('div');
    insight.className = 'insight-msg';
    insight.innerHTML = `
      <div style="flex: 1;">
        <div class="insight-time">${new Date().toLocaleTimeString()}</div>
        <div>
          <span class="insight-agent">${config.name}:</span>
          <span class="insight-text">${message}</span>
        </div>
      </div>
    `;
    
    // Add to feed (newest first)
    feed.insertBefore(insight, feed.children[1]);
    
    // Keep only last 20 insights
    while (feed.children.length > 21) {
      feed.removeChild(feed.lastChild);
    }
  }
  
  // Connect to WebSocket
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('Connected to AIComplyr Intelligence System');
    addInsight('system', 'Connected to real-time intelligence feed', 'success');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle submission state changes
      if (data.type === 'state-update' && data.data) {
        const { state, submissionId, metadata } = data.data;
        
        // Update submission state manager
        updateAgentCard('submission-state', {
          status: 'processing',
          currentAction: `Managing submission ${submissionId}`,
          lastAction: `State changed to: ${state}`,
          processed: (agentStates['submission-state'].processed || 0) + 1
        });
        
        addInsight('submission-state', `Submission ${submissionId} → ${state}`);
        
        // Trigger related agent activities based on state
        if (state === 'policy_review') {
          updateAgentCard('policy', {
            status: 'active',
            currentAction: 'Reviewing submission against policies'
          });
        } else if (state === 'audit_logged') {
          updateAgentCard('audit', {
            status: 'active',
            currentAction: 'Recording compliance decision'
          });
        }
      }
      
      // Handle context analysis (routing decisions)
      if (data.type === 'routing-decision' && data.data) {
        const { submissionId, analysis, workflow, confidence } = data.data;
        
        // Update pre-flight agent
        updateAgentCard('pre-flight', {
          status: 'active',
          currentAction: `Routing ${submissionId} to ${workflow?.name || 'default'}`,
          lastAction: `Confidence: ${confidence}%`,
          processed: (agentStates['pre-flight'].processed || 0) + 1
        });
        
        addInsight('pre-flight', 
          `Routed submission to ${workflow?.name || 'default'} workflow (${confidence}% confidence)`
        );
        
        // Update relevant workflow agent
        if (workflow?.name?.includes('negotiation')) {
          updateAgentCard('negotiation', {
            status: 'active',
            currentAction: 'Handling policy conflicts'
          });
        }
      }
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    addInsight('system', 'Connection error - retrying...', 'error');
  };
  
  ws.onclose = () => {
    addInsight('system', 'Disconnected from real-time feed', 'warning');
    // Implement reconnection logic
    setTimeout(() => location.reload(), 5000);
  };
  
  // Fetch initial metrics
  async function fetchMetrics() {
    try {
      const response = await fetch('/api/dashboard/metrics/workflows');
      const data = await response.json();
      
      // Update agent cards with real metrics
      if (data.totalDecisions) {
        // Distribute decisions across agents for demo
        const decisionsPerAgent = Math.floor(data.totalDecisions / 5);
        Object.keys(agentStates).forEach(key => {
          updateAgentCard(key, { processed: decisionsPerAgent });
        });
      }
      
      // Draw activity chart
      drawActivityChart(data.workflowBreakdown);
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }
  
  // Draw activity chart
  function drawActivityChart(workflowData) {
    const canvas = document.getElementById('activityChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars for workflow distribution
    const workflows = Object.entries(workflowData || {});
    const barWidth = 80;
    const maxHeight = 150;
    
    workflows.forEach(([name, percentage], index) => {
      const x = 50 + (index * (barWidth + 40));
      const height = (percentage / 100) * maxHeight;
      const y = 170 - height;
      
      // Draw bar
      ctx.fillStyle = ['#f18c25', '#7d8eb2', '#f4a555', '#9daac5'][index % 4];
      ctx.fillRect(x, y, barWidth, height);
      
      // Draw label
      ctx.fillStyle = '#7d8eb2';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(name, x + barWidth/2, 190);
      ctx.fillText(`${percentage}%`, x + barWidth/2, y - 5);
    });
  }
  
  // Simulate some agent activity for demo
  function simulateActivity() {
    const agents = Object.keys(agentConfigs);
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    const actions = [
      'Processing new submission',
      'Validating compliance rules',
      'Checking policy conflicts',
      'Generating audit trail',
      'Analyzing content risk'
    ];
    
    updateAgentCard(randomAgent, {
      status: 'active',
      currentAction: actions[Math.floor(Math.random() * actions.length)]
    });
    
    setTimeout(() => {
      updateAgentCard(randomAgent, {
        status: 'idle',
        lastAction: agentStates[randomAgent].currentAction,
        currentAction: 'Waiting for tasks...'
      });
    }, 3000);
  }
  
// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing AIComplyr Agent Dashboard...');
    
    // Initialize the agent cards
    initializeAgentCards();
    
    // Fetch initial metrics
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    setInterval(fetchMetrics, 30000);
    
    // Simulate activity every 10 seconds (remove in production)
    setInterval(simulateActivity, 10000);
    
    // Initial welcome message
    setTimeout(() => {
      addInsight('system', 'AIComplyr Agent Dashboard initialized successfully');
    }, 1000);
  });