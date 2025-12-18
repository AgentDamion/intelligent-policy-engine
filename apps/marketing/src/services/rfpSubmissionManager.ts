import { supabase } from '@/integrations/supabase/client';

interface CreateDraftParams {
  policyVersionId: string;
  workspaceId: string;
  distributionId?: string;
}

interface AnswerData {
  answer: string;
  evidence: Array<{
    type: string;
    description: string;
    file_url?: string;
  }>;
  self_assessment_score?: number;
  agent_metadata?: any;
}

export class RFPSubmissionManager {
  static async createDraftSubmission({ policyVersionId, workspaceId, distributionId }: CreateDraftParams) {
    try {
      // Get policy version details
      const { data: policyVersion, error: pvError } = await supabase
        .from('policy_versions')
        .select(`
          id,
          version_number,
          policies!inner (
            id,
            title,
            description,
            enterprise_id,
            rfp_template_data
          )
        `)
        .eq('id', policyVersionId)
        .single();

      if (pvError) throw pvError;

      // Parse RFP template data
      const rfpTemplateData = policyVersion.policies?.rfp_template_data 
        ? (typeof policyVersion.policies.rfp_template_data === 'string' 
            ? JSON.parse(policyVersion.policies.rfp_template_data) 
            : policyVersion.policies.rfp_template_data)
        : { questions: [] };

      // Create draft submission
      const { data: submission, error: subError } = await supabase
        .from('submissions')
        .insert({
          workspace_id: workspaceId,
          policy_version_id: policyVersionId,
          submission_type: 'rfp_response',
          status: 'draft',
          title: `RFP Response: ${policyVersion.policies.title}`,
          rfp_response_data: {
            distribution_id: distributionId,
            answers: [],
            metadata: {
              respondent_name: '',
              respondent_email: '',
              response_date: new Date().toISOString(),
              organization_name: '',
            },
            overall_compliance_score: 0,
            questions_answered: 0,
            total_questions: rfpTemplateData?.questions?.length || 0,
          },
        })
        .select()
        .single();

      if (subError) throw subError;

      return { submission, policyVersion: { ...policyVersion, rfp_template_data: rfpTemplateData } };
    } catch (error) {
      console.error('Error creating draft submission:', error);
      throw error;
    }
  }

  static async loadDraftSubmission(submissionId: string) {
    try {
      const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select(`
          *,
          policy_versions!inner (
            id,
            version_number,
            policies!inner (
              id,
              title,
              description,
              enterprise_id,
              rfp_template_data,
              enterprises (
                id,
                name
              )
            )
          )
        `)
        .eq('id', submissionId)
        .single();

      if (subError) throw subError;

      // Parse RFP template data
      const rfpTemplateData = submission.policy_versions?.policies?.rfp_template_data
        ? (typeof submission.policy_versions.policies.rfp_template_data === 'string'
            ? JSON.parse(submission.policy_versions.policies.rfp_template_data)
            : submission.policy_versions.policies.rfp_template_data)
        : { questions: [] };

      return {
        ...submission,
        policy_versions: {
          ...submission.policy_versions,
          rfp_template_data: rfpTemplateData,
        }
      };
    } catch (error) {
      console.error('Error loading draft submission:', error);
      throw error;
    }
  }

  static async saveAnswer(submissionId: string, questionId: string, answerData: AnswerData) {
    try {
      // Load current submission
      const { data: submission, error: loadError } = await supabase
        .from('submissions')
        .select('rfp_response_data')
        .eq('id', submissionId)
        .single();

      if (loadError) throw loadError;

      const rfpData = typeof submission.rfp_response_data === 'string'
        ? JSON.parse(submission.rfp_response_data)
        : (submission.rfp_response_data || { answers: [] });
      const answers = Array.isArray(rfpData.answers) ? rfpData.answers : [];

      // Find or create answer entry
      const existingIndex = answers.findIndex((a: any) => a.question_id === questionId);
      const answerEntry = {
        question_id: questionId,
        ...answerData,
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        answers[existingIndex] = answerEntry;
      } else {
        answers.push(answerEntry);
      }

      // Calculate questions answered
      const questionsAnswered = answers.filter((a: any) => a.answer && a.answer.trim().length > 0).length;

      // Update submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
        rfp_response_data: JSON.stringify({
          ...rfpData,
          answers,
          questions_answered: questionsAnswered,
        }) as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  }

  static async submitResponse(submissionId: string) {
    try {
      // Validate submission first
      const validation = await this.validateSubmission(submissionId);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Update status to submitted
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  static async validateSubmission(submissionId: string) {
    try {
      const submission = await this.loadDraftSubmission(submissionId);
      const rfpData = typeof submission.rfp_response_data === 'string'
        ? JSON.parse(submission.rfp_response_data)
        : (submission.rfp_response_data || {});
      const answers = Array.isArray(rfpData.answers) ? rfpData.answers : [];
      const totalQuestions = rfpData.total_questions || 0;

      // Check if all questions are answered
      const questionsAnswered = answers.filter(
        (a: any) => a.answer && a.answer.trim().length > 0
      ).length;

      if (questionsAnswered < totalQuestions) {
        return {
          valid: false,
          message: `Please answer all questions (${questionsAnswered}/${totalQuestions} completed)`,
        };
      }

      // Check minimum compliance score
      const avgScore = answers.reduce((sum: number, a: any) => 
        sum + (a.self_assessment_score || 0), 0) / answers.length;

      if (avgScore < 60) {
        return {
          valid: false,
          message: `Average compliance score (${avgScore.toFixed(0)}%) is below minimum threshold (60%)`,
        };
      }

      return { valid: true, message: 'Validation passed' };
    } catch (error) {
      console.error('Error validating submission:', error);
      return { valid: false, message: 'Validation failed' };
    }
  }

  static async updateMetadata(submissionId: string, metadata: any) {
    try {
      const { data: submission, error: loadError } = await supabase
        .from('submissions')
        .select('rfp_response_data')
        .eq('id', submissionId)
        .single();

      if (loadError) throw loadError;

      const rfpData = typeof submission.rfp_response_data === 'string'
        ? JSON.parse(submission.rfp_response_data)
        : (submission.rfp_response_data || {});

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          rfp_response_data: JSON.stringify({
            ...rfpData,
            metadata: {
              ...(rfpData.metadata || {}),
              ...metadata,
            },
          }) as any,
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  static async saveDraftPayload(submissionId: string, payload: any) {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ 
          rfp_response_data: JSON.stringify(payload) as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving draft payload:', error);
      throw error;
    }
  }
}
