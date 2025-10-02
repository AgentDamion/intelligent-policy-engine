/**
 * useRFPAgentOrchestration Hook
 * 
 * React hook for RFP/RFI processing that integrates with the agent orchestration layer.
 * This hook provides a clean interface for UI components while keeping all intelligence
 * in the backend agents.
 */

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export function useRFPAgentOrchestration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Orchestrate RFP answer generation using agents
   */
  const orchestrateRfpAnswer = useCallback(async ({ question, workspaceId, enterpriseId, policyVersionId }) => {
    setLoading(true);
    setError(null);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/agent-coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'rfp_answer',
          payload: { question, workspaceId, enterpriseId, policyVersionId }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Coordinator error: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Parse uploaded RFP/RFI document
   */
  const parseRfiDocument = useCallback(async ({ file, workspaceId, distributionId }) => {
    setLoading(true);
    setError(null);

    try {
      const fileBase64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('rfi_document_parser', {
        body: {
          file_b64: fileBase64,
          file_mime: file.type,
          workspace_id: workspaceId,
          distribution_id: distributionId
        }
      });

      if (error) throw error;
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Score RFP response
   */
  const scoreRfpResponse = useCallback(async ({ submissionId }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('rfp_score_response', {
        body: { submission_id: submissionId }
      });

      if (error) throw error;
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get urgency badges
   */
  const getUrgencyBadges = useCallback(async ({ workspaceId }) => {
    try {
      const { data, error } = await supabase.rpc('rpc_get_rfp_badges', {
        workspace: workspaceId
      });

      if (error) throw error;
      return data[0];

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Save draft with version conflict detection
   */
  const saveDraft = useCallback(async ({ submissionId, payload, currentVersion }) => {
    try {
      const { data, error } = await supabase.rpc('bump_draft_version', {
        submission_id: submissionId,
        new_payload: payload,
        if_match_version: currentVersion
      });

      if (error) {
        if (error.message.includes('version_conflict')) {
          throw new Error('VERSION_CONFLICT');
        }
        throw error;
      }
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get RFP distributions
   */
  const getRfpDistributions = useCallback(async ({ workspaceId }) => {
    try {
      const { data, error } = await supabase.rpc('rpc_get_rfp_distributions', {
        workspace: workspaceId
      });

      if (error) throw error;
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get submission progress
   */
  const getSubmissionProgress = useCallback(async ({ distributionId }) => {
    try {
      const { data, error } = await supabase.rpc('rpc_get_submission_progress', {
        distribution_id: distributionId
      });

      if (error) throw error;
      return data[0];

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    orchestrateRfpAnswer,
    parseRfiDocument,
    scoreRfpResponse,
    getUrgencyBadges,
    saveDraft,
    getRfpDistributions,
    getSubmissionProgress,
    cancel,
    clearError
  };
}

/**
 * Utility: Convert file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:type;base64, prefix
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export default useRFPAgentOrchestration;