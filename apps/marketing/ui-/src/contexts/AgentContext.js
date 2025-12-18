import React, { createContext, useContext, useState, useEffect } from 'react';

const AgentContext = createContext();

export const useAgents = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [agents, setAgents] = useState({
    context: { status: 'active', confidence: 0.95 },
    policy: { status: 'active', confidence: 0.88 },
    negotiation: { status: 'active', confidence: 0.92 },
    audit: { status: 'active', confidence: 0.97 },
    'conflict-detection': { status: 'active', confidence: 0.89 },
    'pre-flight': { status: 'active', confidence: 0.94 },
    'pattern-recognition': { status: 'active', confidence: 0.91 }
  });

  const [status, setStatus] = useState('active');
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [agentMetrics, setAgentMetrics] = useState({});
  const [agentInteractions, setAgentInteractions] = useState([]);

  useEffect(() => {
    // Initialize agent metrics
    const initializeMetrics = () => {
      const metrics = {};
      Object.keys(agents).forEach(agentName => {
        metrics[agentName] = {
          requestsProcessed: Math.floor(Math.random() * 1000) + 100,
          averageResponseTime: Math.floor(Math.random() * 500) + 50,
          successRate: Math.floor(Math.random() * 20) + 80,
          lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          errorCount: Math.floor(Math.random() * 10),
          uptime: Math.floor(Math.random() * 100) + 90
        };
      });
      setAgentMetrics(metrics);
    };

    initializeMetrics();

    // Set up real-time agent monitoring
    const interval = setInterval(() => {
      updateAgentStatuses();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updateAgentStatuses = () => {
    setAgents(prevAgents => {
      const updatedAgents = { ...prevAgents };
      Object.keys(updatedAgents).forEach(agentName => {
        // Simulate occasional status changes
        if (Math.random() < 0.1) {
          const statuses = ['active', 'processing', 'error'];
          updatedAgents[agentName].status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        
        // Update confidence slightly
        const currentConfidence = updatedAgents[agentName].confidence;
        const change = (Math.random() - 0.5) * 0.02; // ±1% change
        updatedAgents[agentName].confidence = Math.max(0.5, Math.min(1.0, currentConfidence + change));
      });
      return updatedAgents;
    });
  };

  const activateAgent = (agentName) => {
    setAgents(prev => ({
      ...prev,
      [agentName]: { ...prev[agentName], status: 'active' }
    }));
    console.log(`🤖 Activated agent: ${agentName}`);
  };

  const deactivateAgent = (agentName) => {
    setAgents(prev => ({
      ...prev,
      [agentName]: { ...prev[agentName], status: 'inactive' }
    }));
    console.log(`🤖 Deactivated agent: ${agentName}`);
  };

  const updateAgentConfidence = (agentName, confidence) => {
    setAgents(prev => ({
      ...prev,
      [agentName]: { ...prev[agentName], confidence }
    }));
    console.log(`🤖 Updated ${agentName} confidence: ${confidence}`);
  };

  const processAgentRequest = async (agentName, request) => {
    // Simulate agent processing
    setAgents(prev => ({
      ...prev,
      [agentName]: { ...prev[agentName], status: 'processing' }
    }));

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Update agent status and metrics
    setAgents(prev => ({
      ...prev,
      [agentName]: { 
        ...prev[agentName], 
        status: 'active',
        confidence: Math.min(1.0, prev[agentName].confidence + 0.01)
      }
    }));

    // Update metrics
    setAgentMetrics(prev => ({
      ...prev,
      [agentName]: {
        ...prev[agentName],
        requestsProcessed: (prev[agentName]?.requestsProcessed || 0) + 1,
        lastActive: new Date().toISOString()
      }
    }));

    // Log interaction
    const interaction = {
      id: Date.now(),
      agentName,
      request,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    setAgentInteractions(prev => [interaction, ...prev.slice(0, 49)]); // Keep last 50

    console.log(`🤖 Agent ${agentName} processed request:`, request);
    return { success: true, result: `Processed by ${agentName}` };
  };

  const getAgentStatus = (agentName) => {
    return agents[agentName] || { status: 'unknown', confidence: 0 };
  };

  const getAllAgentStatuses = () => {
    return agents;
  };

  const getSystemHealth = () => {
    const activeAgents = Object.values(agents).filter(agent => agent.status === 'active').length;
    const totalAgents = Object.keys(agents).length;
    const averageConfidence = Object.values(agents).reduce((sum, agent) => sum + agent.confidence, 0) / totalAgents;
    
    return {
      overallStatus: status,
      activeAgents,
      totalAgents,
      averageConfidence,
      healthScore: (activeAgents / totalAgents) * averageConfidence
    };
  };

  const addWorkflow = (workflow) => {
    setActiveWorkflows(prev => [...prev, workflow]);
    console.log('🔄 Added workflow:', workflow);
  };

  const removeWorkflow = (workflowId) => {
    setActiveWorkflows(prev => prev.filter(w => w.id !== workflowId));
    console.log('🔄 Removed workflow:', workflowId);
  };

  const getAgentMetrics = (agentName) => {
    return agentMetrics[agentName] || {};
  };

  const getAllMetrics = () => {
    return agentMetrics;
  };

  const getRecentInteractions = (limit = 10) => {
    return agentInteractions.slice(0, limit);
  };

  const value = {
    agents,
    status,
    setStatus,
    activeWorkflows,
    agentMetrics,
    agentInteractions,
    activateAgent,
    deactivateAgent,
    updateAgentConfidence,
    processAgentRequest,
    getAgentStatus,
    getAllAgentStatuses,
    getSystemHealth,
    addWorkflow,
    removeWorkflow,
    getAgentMetrics,
    getAllMetrics,
    getRecentInteractions
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

export { AgentContext }; 