/**
 * useRFPAgentOrchestration Hook - Frontend integration for Cursor AI
 * Implements the hook mentioned in the analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const useRFPAgentOrchestration = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const { session, currentEnterprise } = useAuth();

  /**
   * Process document with Cursor AI agents
   */
  const processDocument = useCallback(async (parsedDoc, enterpriseId) => {
    if (!session || !currentEnterprise) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          agentName: 'cursor-ai',
          action: 'analyze_document',
          input: parsedDoc,
          context: {
            enterprise_id: enterpriseId || currentEnterprise.id,
            analysis_type: 'document_compliance'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const decision = result.data;
        setDecisions(prev => [decision, ...prev]);
        return decision;
      } else {
        throw new Error(result.error || 'Failed to process document');
      }

    } catch (err) {
      console.error('Document processing error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session, currentEnterprise]);

  /**
   * Process RFP question with Cursor AI orchestration
   */
  const processRFPQuestion = useCallback(async (question, organizationId, userId) => {
    if (!session) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          agentName: 'cursor-ai',
          action: 'process_rfp',
          input: question,
          context: {
            enterprise_id: organizationId,
            user_id: userId,
            analysis_type: 'rfp_question_analysis'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const submission = result.data;
        setDecisions(prev => [submission, ...prev]);
        return submission;
      } else {
        throw new Error(result.error || 'Failed to process RFP question');
      }

    } catch (err) {
      console.error('RFP processing error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Get agent status and metrics
   */
  const getAgentStatus = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          agentName: 'cursor-ai',
          action: 'get_status',
          input: {},
          context: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAgentStatus(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get agent status');
      }

    } catch (err) {
      console.error('Agent status error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Test Cursor AI system
   */
  const testSystem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          agentName: 'cursor-ai',
          action: 'test_system',
          input: {},
          context: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'System test failed');
      }

    } catch (err) {
      console.error('System test error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listen for real-time AI decisions
   */
  useEffect(() => {
    if (!session || !currentEnterprise) return;

    let unsubscribe;

    // Subscribe to Cursor AI agents via WebSocket
    const subscribeToCursorAgents = (callback) => {
      // In a real implementation, this would use Supabase Realtime
      // For now, we'll use custom events
      const handleAIDecision = (event) => {
        const decision = event.detail;
        if (decision.enterprise_id === currentEnterprise.id) {
          callback(decision);
        }
      };

      window.addEventListener('ai-decision', handleAIDecision);
      
      return () => {
        window.removeEventListener('ai-decision', handleAIDecision);
      };
    };

    unsubscribe = subscribeToCursorAgents((decision) => {
      setDecisions(prev => [decision, ...prev]);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [session, currentEnterprise]);

  /**
   * Load initial agent status
   */
  useEffect(() => {
    if (session) {
      getAgentStatus();
    }
  }, [session, getAgentStatus]);

  return {
    // State
    decisions,
    loading,
    error,
    agentStatus,
    
    // Actions
    processDocument,
    processRFPQuestion,
    getAgentStatus,
    testSystem,
    
    // Utilities
    clearError: () => setError(null),
    clearDecisions: () => setDecisions([])
  };
};

export default useRFPAgentOrchestration;
