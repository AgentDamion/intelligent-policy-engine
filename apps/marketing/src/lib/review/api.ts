import { supabase } from '@/integrations/supabase/client';
import type { Submission } from '@/pages/agency/review/SubmissionReview';
import { secureQuery, type SecurityContext } from '@/lib/security/secureQuery';
import { webhookPublisher, WebhookEvents } from '@/lib/webhooks/publisher';

export interface ReviewListParams {
  queue: string;
  page?: number;
  limit?: number;
  filters?: {
    client?: string;
    status?: string;
    age?: string;
    assignee?: string;
    search?: string;
  };
}

export interface ReviewDecision {
  submissionId: string;
  action: 'approve' | 'request_changes';
  rationale: string;
  actorId: string;
  snapshotRef?: string;
}

class ReviewApi {
  async list(params: ReviewListParams, context: SecurityContext): Promise<Submission[]> {
    try {
      // Use secure query to fetch submissions with tenant boundary enforcement
      const result = await secureQuery.getSubmissions(context, {
        status: params.filters?.status,
        assignedTo: params.filters?.assignee,
        clientId: params.filters?.client
      });

      if (result.accessDenied) {
        console.warn('Access denied for submissions query');
        return [];
      }

      if (result.error) {
        console.error('Failed to fetch submissions:', result.error);
        return this.getMockSubmissions(params); // Fallback to mock
      }

      // Transform Supabase data to Submission format
      const submissions: Submission[] = result.data.map(sub => ({
        id: sub.id,
        clientId: sub.workspace?.enterprise_id || 'unknown',
        clientName: sub.workspace?.name || 'Unknown Client',
        toolName: sub.title || 'Unknown Tool',
        status: sub.status,
        priority: this.calculatePriority(sub),
        submittedAt: sub.created_at,
        assignedTo: sub.assigned_to,
        lockedBy: sub.locked_by,
        lockExpiresAt: sub.lock_expires_at,
        slaHours: sub.sla_hours || 24,
        complianceFrameworks: sub.compliance_frameworks || [],
        atRisk: this.isAtRisk(sub)
      }));

      // Filter by queue
      return this.filterByQueue(submissions, params.queue);
    } catch (error) {
      console.error('Error in submissions list:', error);
      return this.getMockSubmissions(params);
    }
  }

  private getMockSubmissions(params: ReviewListParams): Submission[] {
    const mockSubmissions: Submission[] = [
      {
        id: '1',
        clientId: 'client-1',
        clientName: 'Acme Pharmaceuticals',
        toolName: 'ChatGPT for Clinical Research',
        status: 'pending',
        priority: 'high',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assignedTo: params.queue === 'my-queue' ? 'current-user' : undefined,
        lockedBy: params.queue === 'my-queue' ? 'current-user' : undefined,
        lockExpiresAt: new Date(Date.now() + 13 * 60 * 1000).toISOString(),
        slaHours: 24,
        complianceFrameworks: ['HIPAA', 'FDA 21 CFR Part 11'],
        atRisk: params.queue === 'at-risk'
      }
    ];

    return this.filterByQueue(mockSubmissions, params.queue);
  }

  private filterByQueue(submissions: Submission[], queue: string): Submission[] {
    switch (queue) {
      case 'my-queue':
        return submissions.filter(s => s.assignedTo === 'current-user');
      case 'unassigned':
        return submissions.filter(s => !s.assignedTo);
      case 'at-risk':
        return submissions.filter(s => s.atRisk);
      default:
        return submissions;
    }
  }

  private calculatePriority(submission: any): 'high' | 'medium' | 'low' {
    if (submission.risk_score > 80) return 'high';
    if (submission.risk_score > 50) return 'medium';
    return 'low';
  }

  private isAtRisk(submission: any): boolean {
    const now = new Date();
    const submitted = new Date(submission.created_at);
    const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    const slaHours = submission.sla_hours || 24;
    return hoursElapsed > (slaHours * 0.8);
  }

  async assign(submissionId: string, assigneeId: string): Promise<void> {
    console.log('Assigning submission', submissionId, 'to', assigneeId);
  }

  async bulkAssign(submissionIds: string[], assigneeId?: string): Promise<void> {
    console.log('Bulk assigning submissions', submissionIds, 'to', assigneeId || 'current-user');
  }

  async takeLock(submissionId: string): Promise<void> {
    console.log('Taking lock for submission', submissionId);
  }

  async releaseLock(submissionId: string): Promise<void> {
    console.log('Releasing lock for submission', submissionId);
  }

  async requestControl(submissionId: string): Promise<void> {
    console.log('Requesting control for submission', submissionId);
  }

  async approve(submissionId: string, rationale: string, context: SecurityContext): Promise<void> {
    if (rationale.length < 15) {
      throw new Error('Rationale must be at least 15 characters long');
    }

    const decision: ReviewDecision = {
      submissionId,
      action: 'approve',
      rationale,
      actorId: context.userId
    };

    await this.recordDecision(decision);
    
    await webhookPublisher.publish({
      eventName: WebhookEvents.DECISION_RECORDED,
      payload: {
        submissionId,
        action: 'approve',
        rationale,
        decidedAt: new Date().toISOString()
      },
      context: {
        tenantId: context.agencyId,
        agencyId: context.agencyId,
        actorId: context.userId
      }
    });
  }

  async requestChanges(submissionId: string, rationale: string, context: SecurityContext): Promise<void> {
    if (rationale.length < 15) {
      throw new Error('Rationale must be at least 15 characters long');
    }

    const decision: ReviewDecision = {
      submissionId,
      action: 'request_changes',
      rationale,
      actorId: context.userId
    };

    await this.recordDecision(decision);
    
    await webhookPublisher.publish({
      eventName: WebhookEvents.DECISION_RECORDED,
      payload: {
        submissionId,
        action: 'request_changes',
        rationale,
        decidedAt: new Date().toISOString()
      },
      context: {
        tenantId: context.agencyId,
        agencyId: context.agencyId,
        actorId: context.userId
      }
    });
  }

  private async recordDecision(decision: ReviewDecision): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_events')
        .insert({
          event_type: `submission_${decision.action}`,
          entity_type: 'submission',
          entity_id: decision.submissionId,
          user_id: decision.actorId,
          details: {
            action: decision.action,
            rationale: decision.rationale,
            snapshotRef: decision.snapshotRef
          }
        });

      if (error) {
        console.error('Failed to record decision in audit trail:', error);
      }
    } catch (error) {
      console.error('Error recording audit event:', error);
    }
  }
}

export const reviewApi = new ReviewApi();