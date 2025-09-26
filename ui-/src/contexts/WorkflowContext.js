import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = ({ children }) => {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [workflows, setWorkflows] = useState({
    'agency-tool-submission': {
      id: 'agency-tool-submission',
      name: 'Agency Tool Submission',
      description: 'Agency AI tool submission workflow with enterprise review',
      agents: ['pre-flight', 'context', 'policy', 'conflict-detection', 'negotiation', 'audit'],
      sla_hours: 48,
      auto_distribute: true,
      requires_human_review: false,
      status: 'idle',
      progress: 0,
      steps: [
        { id: 'pre-flight', name: 'Pre-Flight Check', status: 'pending' },
        { id: 'context', name: 'Context Analysis', status: 'pending' },
        { id: 'policy', name: 'Policy Evaluation', status: 'pending' },
        { id: 'conflict-detection', name: 'Conflict Detection', status: 'pending' },
        { id: 'negotiation', name: 'Negotiation', status: 'pending' },
        { id: 'audit', name: 'Audit Trail', status: 'pending' }
      ]
    },
    'enterprise-policy-creation': {
      id: 'enterprise-policy-creation',
      name: 'Enterprise Policy Creation',
      description: 'Enterprise policy creation with automatic distribution',
      agents: ['context', 'policy', 'conflict-detection', 'audit'],
      sla_hours: 24,
      auto_distribute: true,
      requires_human_review: false,
      status: 'idle',
      progress: 0,
      steps: [
        { id: 'context', name: 'Context Analysis', status: 'pending' },
        { id: 'policy', name: 'Policy Creation', status: 'pending' },
        { id: 'conflict-detection', name: 'Conflict Detection', status: 'pending' },
        { id: 'audit', name: 'Audit Trail', status: 'pending' }
      ]
    },
    'multi-client-conflict-resolution': {
      id: 'multi-client-conflict-resolution',
      name: 'Multi-Client Conflict Resolution',
      description: 'Multi-client conflict resolution with human oversight',
      agents: ['context', 'conflict-detection', 'negotiation', 'audit'],
      sla_hours: 72,
      auto_distribute: false,
      requires_human_review: true,
      status: 'idle',
      progress: 0,
      steps: [
        { id: 'context', name: 'Context Analysis', status: 'pending' },
        { id: 'conflict-detection', name: 'Conflict Detection', status: 'pending' },
        { id: 'negotiation', name: 'Negotiation', status: 'pending' },
        { id: 'audit', name: 'Audit Trail', status: 'pending' }
      ]
    },
    'compliance-audit-workflow': {
      id: 'compliance-audit-workflow',
      name: 'Compliance Audit Workflow',
      description: 'Scheduled compliance audit with automated reporting',
      agents: ['audit', 'pattern-recognition', 'policy'],
      sla_hours: null,
      auto_distribute: false,
      requires_human_review: false,
      status: 'idle',
      progress: 0,
      steps: [
        { id: 'audit', name: 'Audit Execution', status: 'pending' },
        { id: 'pattern-recognition', name: 'Pattern Analysis', status: 'pending' },
        { id: 'policy', name: 'Policy Review', status: 'pending' }
      ]
    }
  });

  const [orchestrationEngine, setOrchestrationEngine] = useState({
    status: 'active',
    activeWorkflows: 0,
    totalWorkflows: Object.keys(workflows).length,
    averageProcessingTime: 0,
    successRate: 0
  });

  useEffect(() => {
    // Initialize workflow metrics
    const initializeMetrics = () => {
      const totalWorkflows = Object.keys(workflows).length;
      const activeWorkflows = Object.values(workflows).filter(w => w.status === 'active').length;
      const averageProcessingTime = Math.floor(Math.random() * 5000) + 1000;
      const successRate = Math.floor(Math.random() * 20) + 80;

      setOrchestrationEngine({
        status: 'active',
        activeWorkflows,
        totalWorkflows,
        averageProcessingTime,
        successRate
      });
    };

    initializeMetrics();
  }, []);

  const startWorkflow = (workflowId, input) => {
    const workflow = workflows[workflowId];
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const newWorkflow = {
      ...workflow,
      status: 'active',
      progress: 0,
      startTime: new Date().toISOString(),
      input,
      currentStep: 0,
      steps: workflow.steps.map((step, index) => ({
        ...step,
        status: index === 0 ? 'active' : 'pending'
      }))
    };

    setCurrent(newWorkflow);
    setWorkflows(prev => ({
      ...prev,
      [workflowId]: newWorkflow
    }));

    // Add to history
    setHistory(prev => [newWorkflow, ...prev.slice(0, 9)]); // Keep last 10

    console.log(`🔄 Started workflow: ${workflowId}`, input);
    return newWorkflow;
  };

  const updateWorkflowProgress = (workflowId, progress, currentStep) => {
    setWorkflows(prev => {
      const workflow = prev[workflowId];
      if (!workflow) return prev;

      const updatedWorkflow = {
        ...workflow,
        progress,
        currentStep,
        steps: workflow.steps.map((step, index) => ({
          ...step,
          status: index < currentStep ? 'completed' : 
                  index === currentStep ? 'active' : 'pending'
        }))
      };

      // Update current if it's the active workflow
      if (current?.id === workflowId) {
        setCurrent(updatedWorkflow);
      }

      return {
        ...prev,
        [workflowId]: updatedWorkflow
      };
    });
  };

  const completeWorkflow = (workflowId, result) => {
    setWorkflows(prev => {
      const workflow = prev[workflowId];
      if (!workflow) return prev;

      const completedWorkflow = {
        ...workflow,
        status: 'completed',
        progress: 100,
        endTime: new Date().toISOString(),
        result,
        steps: workflow.steps.map(step => ({
          ...step,
          status: 'completed'
        }))
      };

      // Update current if it's the active workflow
      if (current?.id === workflowId) {
        setCurrent(null);
      }

      return {
        ...prev,
        [workflowId]: completedWorkflow
      };
    });

    console.log(`✅ Completed workflow: ${workflowId}`, result);
  };

  const pauseWorkflow = (workflowId) => {
    setWorkflows(prev => {
      const workflow = prev[workflowId];
      if (!workflow) return prev;

      const pausedWorkflow = {
        ...workflow,
        status: 'paused',
        pauseTime: new Date().toISOString()
      };

      // Update current if it's the active workflow
      if (current?.id === workflowId) {
        setCurrent(pausedWorkflow);
      }

      return {
        ...prev,
        [workflowId]: pausedWorkflow
      };
    });

    console.log(`⏸️ Paused workflow: ${workflowId}`);
  };

  const resumeWorkflow = (workflowId) => {
    setWorkflows(prev => {
      const workflow = prev[workflowId];
      if (!workflow) return prev;

      const resumedWorkflow = {
        ...workflow,
        status: 'active',
        resumeTime: new Date().toISOString()
      };

      // Update current if it's the active workflow
      setCurrent(resumedWorkflow);

      return {
        ...prev,
        [workflowId]: resumedWorkflow
      };
    });

    console.log(`▶️ Resumed workflow: ${workflowId}`);
  };

  const cancelWorkflow = (workflowId, reason) => {
    setWorkflows(prev => {
      const workflow = prev[workflowId];
      if (!workflow) return prev;

      const cancelledWorkflow = {
        ...workflow,
        status: 'cancelled',
        cancelTime: new Date().toISOString(),
        cancelReason: reason
      };

      // Update current if it's the active workflow
      if (current?.id === workflowId) {
        setCurrent(null);
      }

      return {
        ...prev,
        [workflowId]: cancelledWorkflow
      };
    });

    console.log(`❌ Cancelled workflow: ${workflowId}`, reason);
  };

  const getWorkflow = (workflowId) => {
    return workflows[workflowId];
  };

  const getAllWorkflows = () => {
    return workflows;
  };

  const getActiveWorkflows = () => {
    return Object.values(workflows).filter(w => w.status === 'active');
  };

  const getWorkflowHistory = () => {
    return history;
  };

  const getOrchestrationMetrics = () => {
    return orchestrationEngine;
  };

  const addToHistory = (workflow) => {
    setHistory(prev => [workflow, ...prev.slice(0, 9)]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const value = {
    current,
    setCurrent,
    history,
    workflows,
    orchestrationEngine,
    startWorkflow,
    updateWorkflowProgress,
    completeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    getWorkflow,
    getAllWorkflows,
    getActiveWorkflows,
    getWorkflowHistory,
    getOrchestrationMetrics,
    addToHistory,
    clearHistory
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export { WorkflowContext }; 