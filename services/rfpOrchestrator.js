/**
 * RFP Orchestrator Service
 * 
 * This service coordinates RFP/RFI processing using the existing agent layer.
 * It keeps all "intelligence" in Cursor agents and provides a thin wrapper for UI integration.
 * 
 * Core principle: No duplicate logic in the UI - all intelligence stays in agents.
 */

import { createClient } from '@supabase/supabase-js';
import agentRegistry from '../agents/agent-registry.js';

class RFPOrchestrator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Agent references
    this.contextAgent = agentRegistry.getAgent('context');
    this.policyAgent = agentRegistry.getAgent('policy');
    this.complianceAgent = agentRegistry.getAgent('compliance-scoring');
    this.negotiationAgent = agentRegistry.getAgent('negotiation');
    this.auditAgent = agentRegistry.getAgent('audit');
  }

  /**
   * Orchestrate RFP answer generation using existing agents
   * @param {Object} params - { question, workspaceId, enterpriseId, policyVersionId }
   * @returns {Object} - { draft, evidenceRefs, eval: { score, gaps, breakdown }, suggestions }
   */
  async orchestrateRfpAnswer({ question, workspaceId, enterpriseId, policyVersionId }) {
    try {
      // Step 1: Context Agent routes and classifies the question
      const contextResult = await this.contextAgent.process({
        type: 'rfp_question',
        policyVersionId,
        questionId: question.id,
        questionText: question.question_text,
        workspaceId,
        enterpriseId
      });

      // Step 2: Knowledge Agent retrieves relevant evidence
      const evidenceRefs = await this.retrieveEvidence({
        questionId: question.id,
        workspaceId,
        clientScope: true,
        kbFilters: ['model_cards', 'attestations', 'compliance_docs']
      });

      // Step 3: Document Agent generates answer draft
      const draft = await this.generateAnswer({
        question: question.question_text,
        context: evidenceRefs,
        policyVersionId,
        questionType: question.question_type
      });

      // Step 4: Compliance Scoring Agent evaluates the answer
      const evaluation = await this.complianceAgent.score({
        policyVersionId,
        answer: draft,
        evidence: evidenceRefs,
        questionType: question.question_type
      });

      // Step 5: Negotiation Agent suggests mitigations if gaps exist
      let suggestions = null;
      if (evaluation.hasCriticalGap) {
        suggestions = await this.negotiationAgent.propose({
          gap: evaluation.topGap,
          policyVersionId,
          currentAnswer: draft
        });
      }

      // Step 6: Audit Agent logs the activity
      await this.auditAgent.log('rfp.answer.drafted', {
        questionId: question.id,
        score: evaluation.score,
        workspaceId,
        enterpriseId
      });

      return {
        draft,
        evidenceRefs,
        eval: {
          score: evaluation.score,
          gaps: evaluation.gaps,
          breakdown: evaluation.breakdown
        },
        suggestions
      };

    } catch (error) {
      console.error('RFP Orchestration Error:', error);
      throw new Error(`RFP orchestration failed: ${error.message}`);
    }
  }

  /**
   * Retrieve evidence from knowledge base
   */
  async retrieveEvidence({ questionId, workspaceId, clientScope, kbFilters }) {
    // This would integrate with your existing Knowledge/Document Agent
    // For now, return mock evidence references
    return [
      {
        type: 'model_card',
        id: 'mc_001',
        title: 'GPT-4 Model Card',
        relevance_score: 0.85,
        url: '/kb/model-cards/gpt4'
      },
      {
        type: 'attestation',
        id: 'att_001',
        title: 'SOC 2 Type II Report',
        relevance_score: 0.92,
        url: '/kb/attestations/soc2'
      }
    ];
  }

  /**
   * Generate answer using Document Agent
   */
  async generateAnswer({ question, context, policyVersionId, questionType }) {
    // This would integrate with your existing Document Agent
    // For now, return a mock generated answer
    return `Based on our comprehensive AI governance framework, we maintain detailed audit trails for all AI operations through our centralized logging system. Our SOC 2 Type II certification demonstrates our commitment to security and compliance standards.`;
  }

  /**
   * Parse uploaded RFP/RFI document
   */
  async parseRfiDocument({ file, workspaceId, distributionId }) {
    try {
      const fileBase64 = await this.fileToBase64(file);
      
      const { data, error } = await this.supabase.functions.invoke('rfi_document_parser', {
        body: {
          file_b64: fileBase64,
          file_mime: file.type,
          workspace_id: workspaceId,
          distribution_id: distributionId
        }
      });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('RFP Document Parsing Error:', error);
      throw new Error(`Document parsing failed: ${error.message}`);
    }
  }

  /**
   * Score RFP response using server-side function
   */
  async scoreRfpResponse({ submissionId }) {
    try {
      const { data, error } = await this.supabase.functions.invoke('rfp_score_response', {
        body: { submission_id: submissionId }
      });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('RFP Scoring Error:', error);
      throw new Error(`Response scoring failed: ${error.message}`);
    }
  }

  /**
   * Get urgency badges for workspace
   */
  async getUrgencyBadges({ workspaceId }) {
    try {
      const { data, error } = await this.supabase.rpc('rpc_get_rfp_badges', {
        workspace: workspaceId
      });

      if (error) throw error;
      return data[0]; // RPC returns array, we want first result

    } catch (error) {
      console.error('Urgency Badges Error:', error);
      throw new Error(`Failed to get urgency badges: ${error.message}`);
    }
  }

  /**
   * Save draft with version conflict detection
   */
  async saveDraft({ submissionId, payload, currentVersion }) {
    try {
      const { data, error } = await this.supabase.rpc('bump_draft_version', {
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

    } catch (error) {
      console.error('Draft Save Error:', error);
      throw error;
    }
  }

  /**
   * Get RFP distributions for workspace
   */
  async getRfpDistributions({ workspaceId }) {
    try {
      const { data, error } = await this.supabase.rpc('rpc_get_rfp_distributions', {
        workspace: workspaceId
      });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('RFP Distributions Error:', error);
      throw new Error(`Failed to get RFP distributions: ${error.message}`);
    }
  }

  /**
   * Get submission progress for distribution
   */
  async getSubmissionProgress({ distributionId }) {
    try {
      const { data, error } = await this.supabase.rpc('rpc_get_submission_progress', {
        distribution_id: distributionId
      });

      if (error) throw error;
      return data[0]; // RPC returns array, we want first result

    } catch (error) {
      console.error('Submission Progress Error:', error);
      throw new Error(`Failed to get submission progress: ${error.message}`);
    }
  }

  /**
   * Utility: Convert file to base64
   */
  async fileToBase64(file) {
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
}

export { RFPOrchestrator };