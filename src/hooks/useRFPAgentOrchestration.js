/**
 * useRFPAgentOrchestration Hook
 * React hook for integrating RFP orchestration with UI components
 * Provides state management and agent coordination for RFP workflows
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const useRFPAgentOrchestration = (organizationId, userId) => {
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    submissions: [],
    currentSubmission: null,
    dashboard: null,
    agents: {
      context: null,
      policy: null,
      knowledge: null,
      compliance: null,
      negotiation: null,
      audit: null
    }
  });

  const supabase = useRef(null);
  const orchestrator = useRef(null);

  // Initialize Supabase client and orchestrator
  useEffect(() => {
    const initClient = async () => {
      try {
        // Initialize Supabase client
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || window.env?.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || window.env?.REACT_APP_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }

        supabase.current = createClient(supabaseUrl, supabaseKey);

        // Initialize RFP Orchestrator
        const { RFPOrchestrator } = await import('../../services/rfpOrchestrator');
        orchestrator.current = new RFPOrchestrator(supabaseUrl, supabaseKey);

        // Initialize with existing agents (mock for now)
        await orchestrator.current.initialize({});

        setState(prev => ({
          ...prev,
          isLoading: false
        }));

      } catch (error) {
        console.error('Failed to initialize RFP orchestration:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    };

    initClient();
  }, []);

  // Process RFP question
  const processRFPQuestion = useCallback(async (question) => {
    if (!orchestrator.current || !organizationId || !userId) {
      throw new Error('Orchestrator not initialized or missing required parameters');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await orchestrator.current.processRFPQuestion(question, organizationId, userId);
      
      if (result.success) {
        // Refresh submissions list
        await loadSubmissions();
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentSubmission: result.submissionId
        }));
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, [organizationId, userId]);

  // Score RFP response
  const scoreRFPResponse = useCallback(async (submissionId, responseText) => {
    if (!orchestrator.current || !organizationId) {
      throw new Error('Orchestrator not initialized or missing organization ID');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await orchestrator.current.scoreRFPResponse(submissionId, responseText, organizationId);
      
      if (result.success) {
        // Refresh submissions list
        await loadSubmissions();
      } else {
        throw new Error(result.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, [organizationId]);

  // Apply negotiation strategies
  const applyNegotiationStrategies = useCallback(async (submissionId) => {
    if (!orchestrator.current || !organizationId) {
      throw new Error('Orchestrator not initialized or missing organization ID');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await orchestrator.current.applyNegotiationStrategies(submissionId, organizationId);
      
      if (result.success) {
        // Refresh submissions list
        await loadSubmissions();
      } else {
        throw new Error(result.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, [organizationId]);

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    if (!supabase.current || !organizationId) return;

    try {
      const { data, error } = await supabase.current
        .from('submissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('submission_type', 'rfp_response')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        submissions: data || []
      }));
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [organizationId]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    if (!orchestrator.current || !organizationId) return;

    try {
      const result = await orchestrator.current.getRFPDashboard(organizationId);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          dashboard: result.dashboard
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [organizationId]);

  // Get submission by ID
  const getSubmission = useCallback(async (submissionId) => {
    if (!supabase.current || !organizationId) return null;

    try {
      const { data, error } = await supabase.current
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get submission:', error);
      return null;
    }
  }, [organizationId]);

  // Update submission
  const updateSubmission = useCallback(async (submissionId, updates) => {
    if (!supabase.current || !organizationId) return false;

    try {
      const { error } = await supabase.current
        .from('submissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Refresh submissions list
      await loadSubmissions();
      return true;
    } catch (error) {
      console.error('Failed to update submission:', error);
      return false;
    }
  }, [organizationId, loadSubmissions]);

  // Auto-save with conflict detection
  const autoSave = useCallback(async (submissionId, content) => {
    if (!supabase.current || !organizationId || !userId) return false;

    try {
      const { data, error } = await supabase.current
        .rpc('bump_draft_version', {
          p_submission_id: submissionId,
          p_organization_id: organizationId,
          p_user_id: userId,
          p_new_content: content
        });

      if (error) throw error;

      if (data.success) {
        // Refresh submissions list
        await loadSubmissions();
        return { success: true, version: data.new_version };
      } else {
        return { success: false, error: data.error, conflict: data.code === 'CONFLICT' };
      }
    } catch (error) {
      console.error('Failed to auto-save:', error);
      return { success: false, error: error.message };
    }
  }, [organizationId, userId, loadSubmissions]);

  // Load initial data
  useEffect(() => {
    if (organizationId) {
      loadSubmissions();
      loadDashboard();
    }
  }, [organizationId, loadSubmissions, loadDashboard]);

  return {
    // State
    ...state,
    
    // Actions
    processRFPQuestion,
    scoreRFPResponse,
    applyNegotiationStrategies,
    loadSubmissions,
    loadDashboard,
    getSubmission,
    updateSubmission,
    autoSave,
    
    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null })),
    setCurrentSubmission: (submissionId) => setState(prev => ({ ...prev, currentSubmission: submissionId }))
  };
};

export default useRFPAgentOrchestration;

