/**
 * RFP Orchestrator Service
 * Coordinates existing agents for RFP/RFI processing
 * Maintains the Policy → Submissions → Audit → Meta-Loop spine
 */

const { createClient } = require('@supabase/supabase-js');

class RFPOrchestrator {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.agents = {
      context: null,
      policy: null,
      knowledge: null,
      compliance: null,
      negotiation: null,
      audit: null
    };
  }

  /**
   * Initialize the orchestrator with existing agents
   */
  async initialize(agentRegistry) {
    try {
      // Get existing agents from the registry
      this.agents.context = agentRegistry.getAgent('context-agent');
      this.agents.policy = agentRegistry.getAgent('policy-agent');
      this.agents.knowledge = agentRegistry.getAgent('knowledge-agent');
      this.agents.compliance = agentRegistry.getAgent('compliance-scoring-agent');
      this.agents.negotiation = agentRegistry.getAgent('negotiation-agent');
      this.agents.audit = agentRegistry.getAgent('audit-agent');

      console.log('RFP Orchestrator initialized with agents:', Object.keys(this.agents));
      return true;
    } catch (error) {
      console.error('Failed to initialize RFP Orchestrator:', error);
      return false;
    }
  }

  /**
   * Process an RFP question through the agent pipeline
   */
  async processRFPQuestion(question, organizationId, userId) {
    try {
      const processId = `rfp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 1. Context Agent: Route and classify the question
      const contextResult = await this.agents.context?.process({
        input: question.question_text,
        type: 'rfp_question_classification',
        metadata: {
          category: question.category,
          priority: question.priority,
          requirements: question.requirements
        }
      });

      // 2. Policy Agent: Convert policies into RFP requirements profiles
      const policyProfiles = await this.agents.policy?.process({
        input: question.requirements || [],
        type: 'rfp_requirements_mapping',
        organizationId,
        context: contextResult
      });

      // 3. Knowledge Agent: Retrieve evidence from shared KB
      const knowledgeResult = await this.agents.knowledge?.process({
        input: question.question_text,
        type: 'rfp_evidence_retrieval',
        organizationId,
        context: {
          category: question.category,
          requirements: question.requirements
        }
      });

      // 4. Create initial submission
      const submission = await this.createSubmission({
        organizationId,
        userId,
        question,
        contextResult,
        policyProfiles,
        knowledgeResult,
        processId
      });

      return {
        success: true,
        submissionId: submission.id,
        processId,
        nextSteps: [
          'Review generated response',
          'Score against compliance requirements',
          'Apply negotiation strategies if needed'
        ]
      };

    } catch (error) {
      console.error('Error processing RFP question:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Score an RFP response using ComplianceScoringAgent
   */
  async scoreRFPResponse(submissionId, responseText, organizationId) {
    try {
      // Get the submission and question details
      const { data: submission, error: submissionError } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('organization_id', organizationId)
        .single();

      if (submissionError || !submission) {
        throw new Error('Submission not found');
      }

      // Use ComplianceScoringAgent to score the response
      const scoringResult = await this.agents.compliance?.process({
        input: responseText,
        type: 'rfp_response_scoring',
        organizationId,
        context: {
          question: submission.question_id,
          requirements: submission.scoring_results?.requirements || [],
          policyProfiles: submission.scoring_results?.policy_profiles || []
        }
      });

      // Update submission with scoring results
      const { error: updateError } = await this.supabase
        .from('submissions')
        .update({
          response_text: responseText,
          scoring_results: {
            ...submission.scoring_results,
            scoring: scoringResult,
            scored_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        throw new Error('Failed to update submission with scoring results');
      }

      // Log scoring activity for audit
      await this.logActivity('rfp_scoring', {
        submissionId,
        score: scoringResult.score,
        percentage: scoringResult.percentage,
        organizationId
      });

      return {
        success: true,
        scoringResult,
        submissionId
      };

    } catch (error) {
      console.error('Error scoring RFP response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply negotiation strategies for compliance gaps
   */
  async applyNegotiationStrategies(submissionId, organizationId) {
    try {
      const { data: submission, error: submissionError } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('organization_id', organizationId)
        .single();

      if (submissionError || !submission) {
        throw new Error('Submission not found');
      }

      const scoringResults = submission.scoring_results?.scoring;
      if (!scoringResults || !scoringResults.compliance_gaps?.length) {
        return {
          success: true,
          message: 'No compliance gaps found, no negotiation needed'
        };
      }

      // Use NegotiationAgent to propose mitigations
      const negotiationResult = await this.agents.negotiation?.process({
        input: scoringResults.compliance_gaps,
        type: 'rfp_gap_mitigation',
        organizationId,
        context: {
          submissionId,
          originalResponse: submission.response_text,
          requirements: submission.scoring_results?.requirements || []
        }
      });

      // Update submission with negotiation suggestions
      const { error: updateError } = await this.supabase
        .from('submissions')
        .update({
          scoring_results: {
            ...submission.scoring_results,
            negotiation: negotiationResult,
            negotiated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        throw new Error('Failed to update submission with negotiation results');
      }

      // Log negotiation activity
      await this.logActivity('rfp_negotiation', {
        submissionId,
        gapsAddressed: negotiationResult.gaps_addressed?.length || 0,
        organizationId
      });

      return {
        success: true,
        negotiationResult,
        submissionId
      };

    } catch (error) {
      console.error('Error applying negotiation strategies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new submission record
   */
  async createSubmission({ organizationId, userId, question, contextResult, policyProfiles, knowledgeResult, processId }) {
    const { data: submission, error } = await this.supabase
      .from('submissions')
      .insert({
        organization_id: organizationId,
        submission_type: 'rfp_response',
        title: `RFP Response: ${question.question_text.substring(0, 100)}...`,
        description: `Response to RFP question: ${question.category}`,
        rfi_id: question.rfi_id,
        question_id: question.id,
        response_text: '', // Will be filled when user provides response
        scoring_results: {
          process_id: processId,
          question: question,
          context: contextResult,
          policy_profiles: policyProfiles,
          knowledge: knowledgeResult,
          created_at: new Date().toISOString()
        },
        created_by: userId,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }

    return submission;
  }

  /**
   * Log activity for audit and Meta-Loop learning
   */
  async logActivity(activityType, data) {
    try {
      await this.supabase
        .from('agent_activities')
        .insert({
          organization_id: data.organizationId,
          agent_type: 'rfp_orchestrator',
          activity_type: activityType,
          activity_data: data,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log RFP activity:', error);
    }
  }

  /**
   * Get RFP dashboard data
   */
  async getRFPDashboard(organizationId) {
    try {
      // Get submission progress
      const { data: progress } = await this.supabase
        .rpc('rpc_get_submission_progress', {
          p_organization_id: organizationId,
          p_submission_type: 'rfp_response'
        });

      // Get urgency badges
      const { data: badges } = await this.supabase
        .rpc('rpc_get_rfp_badges', {
          p_organization_id: organizationId,
          p_timezone: 'UTC'
        });

      // Get recent activities
      const { data: activities } = await this.supabase
        .from('agent_activities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('agent_type', 'rfp_orchestrator')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        dashboard: {
          progress: progress?.[0] || {},
          badges: badges || [],
          recentActivities: activities || []
        }
      };

    } catch (error) {
      console.error('Error getting RFP dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RFPOrchestrator;

