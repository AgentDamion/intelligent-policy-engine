# Phase 1, Step 5: Service Layer Extension

## Prompt to paste into Lovable:

```
Extend the existing src/services/rfp/rfpService.ts with tool disclosure management methods.

ADD the following methods to the EXISTING rfpService object (do not remove existing methods):

1. saveToolDisclosures(distributionId, disclosures)
   - Saves tool disclosures to rfp_tool_disclosures table
   - Returns saved disclosures with IDs

2. getToolDisclosures(distributionId)
   - Fetches all tool disclosures for an RFP
   - Returns array of ToolDisclosure objects

3. validateToolDisclosures(distributionId, disclosures, policyPackId?)
   - Calls the validate-rfp-disclosures edge function
   - Returns PolicyResolutionResult

4. getPolicyResolution(distributionId)
   - Fetches the most recent policy resolution for an RFP
   - Returns PolicyResolutionResult or null

Follow the same patterns as existing methods:
- Use JSDoc comments
- Proper error handling with supabase error checks
- TypeScript types from @/types/rfp
- Return structured data
```

## Expected Code:

```typescript
// ADD to existing src/services/rfp/rfpService.ts

import { ToolDisclosure, PolicyResolutionResult, RFPDistributionConfig, RFPTemplateData } from '@/types/rfp';
import { supabase } from '@/integrations/supabase/client';

export const rfpService = {
  /**
   * Generate RFP clauses from policy content using AI
   */
  async generateRFPClauses(policyId: string, policyContent: string, existingRules?: any): Promise<RFPTemplateData> {
    const { data, error } = await supabase.functions.invoke('generate-rfp-clauses', {
      body: {
        policyId,
        policyContent,
        existingRules,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error('Failed to generate RFP clauses');

    return data.rfpData;
  },

  /**
   * Distribute policy as RFP to selected workspaces
   */
  async distributeAsRFP(
    policyVersionId: string,
    config: RFPDistributionConfig
  ): Promise<{ distributions_created: number }> {
    const { data, error } = await supabase.functions.invoke('distribute_policy', {
      body: {
        policy_version_id: policyVersionId,
        workspace_ids: config.workspace_ids,
        note: config.custom_message || 'RFP: Please review and respond to governance requirements',
        rfp_config: {
          response_deadline: config.response_deadline,
          include_auto_scoring: config.include_auto_scoring,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get RFP distributions for a workspace
   */
  async getRFPDistributions(workspaceId: string) {
    const { data, error } = await supabase
      .from('policy_distributions')
      .select(`
        *,
        policy_versions (
          id,
          version,
          rfp_metadata,
          compliance_scoring_profile,
          policies (
            id,
            title,
            description,
            rfp_template_data
          )
        )
      `)
      .eq('target_workspace_id', workspaceId)
      .not('policy_versions.policies.rfp_template_data', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get RFP responses (submissions) for a policy
   */
  async getRFPResponses(policyVersionId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('policy_version_id', policyVersionId)
      .eq('submission_type', 'rfp_response')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Create a draft RFP response
   */
  async createRFPResponse(
    workspaceId: string,
    policyVersionId: string,
    responseDeadline?: string
  ) {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        workspace_id: workspaceId,
        policy_version_id: policyVersionId,
        submission_type: 'rfp_response',
        status: 'draft',
        title: 'RFP Response (Draft)',
        rfp_response_data: { answers: [], metadata: {} },
        response_deadline: responseDeadline,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update RFP response
   */
  async updateRFPResponse(submissionId: string, responseData: any) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        rfp_response_data: responseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Submit RFP response for review
   */
  async submitRFPResponse(submissionId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        title: 'RFP Response (Submitted)',
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Save tool disclosures for an RFP distribution
   */
  async saveToolDisclosures(
    distributionId: string,
    disclosures: Omit<ToolDisclosure, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<ToolDisclosure[]> {
    const { data, error } = await supabase
      .from('rfp_tool_disclosures')
      .insert(
        disclosures.map(d => ({
          distribution_id: distributionId,
          ...d
        }))
      )
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Get tool disclosures for an RFP distribution
   */
  async getToolDisclosures(distributionId: string): Promise<ToolDisclosure[]> {
    const { data, error } = await supabase
      .from('rfp_tool_disclosures')
      .select('*')
      .eq('distribution_id', distributionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Validate tool disclosures against policy pack
   */
  async validateToolDisclosures(
    distributionId: string,
    disclosures: ToolDisclosure[],
    policyPackId?: string
  ): Promise<PolicyResolutionResult> {
    const { data, error } = await supabase.functions.invoke('validate-rfp-disclosures', {
      body: {
        distribution_id: distributionId,
        disclosures,
        policy_pack_id: policyPackId
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Validation failed');

    return data.resolution;
  },

  /**
   * Get the most recent policy resolution for an RFP
   */
  async getPolicyResolution(distributionId: string): Promise<PolicyResolutionResult | null> {
    const { data, error } = await supabase
      .from('policy_resolutions')
      .select('*')
      .eq('distribution_id', distributionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      distribution_id: data.distribution_id,
      overall_score: data.overall_score,
      items: data.resolution_data?.items || [],
      created_at: data.created_at
    };
  },

  /**
   * Delete a tool disclosure
   */
  async deleteToolDisclosure(disclosureId: string): Promise<void> {
    const { error } = await supabase
      .from('rfp_tool_disclosures')
      .delete()
      .eq('id', disclosureId);

    if (error) throw error;
  }
};
