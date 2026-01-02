import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const EventBus = require('../../core/event-bus.js');

/**
 * Human-in-the-Loop (HIL) Approval System
 *
 * Provides approval workflow for high-liability AI agent decisions.
 * Integrates with AICOMPLYR's audit and approval systems.
 */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Approval Request Status
 */
export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ESCALATED: 'escalated'
};

/**
 * Approval Priority Levels
 */
export const ApprovalPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Human-in-the-Loop Approval Manager
 */
export class HumanInTheLoopManager {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 24 * 60 * 60 * 1000; // 24 hours
    this.maxRetries = options.maxRetries || 3;
    this.approvalCallbacks = new Map();
    this.pendingApprovals = new Map();
  }

  /**
   * Request human approval for a high-liability decision
   */
  async requestApproval(approvalRequest) {
    const {
      decisionId,
      agentType = 'policy-agent',
      decision,
      requestContext,
      enterpriseId,
      userId,
      priority = ApprovalPriority.MEDIUM,
      timeout = this.defaultTimeout,
      reviewers = [],
      justification,
      metadata = {}
    } = approvalRequest;

    console.log(`[HIL] Requesting approval for decision ${decisionId} (${priority} priority)`);

    // Create approval record in database
    const approvalRecord = {
      id: decisionId,
      agent_type: agentType,
      decision_data: decision,
      request_context: requestContext,
      enterprise_id: enterpriseId,
      requested_by: userId,
      status: ApprovalStatus.PENDING,
      priority,
      reviewers: reviewers.length > 0 ? reviewers : await this.getDefaultReviewers(enterpriseId, priority),
      justification,
      metadata: {
        ...metadata,
        requested_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + timeout).toISOString()
      }
    };

    // Store in database
    const { data, error } = await supabase
      .from('human_approvals')
      .insert(approvalRecord)
      .select()
      .single();

    if (error) {
      console.error('[HIL] Failed to create approval record:', error);
      throw new Error(`Failed to create approval request: ${error.message}`);
    }

    // Store pending approval
    this.pendingApprovals.set(decisionId, {
      ...data,
      timeoutId: setTimeout(() => this.handleTimeout(decisionId), timeout)
    });

    // Emit event for notification systems
    EventBus.emit('approval:requested', {
      approvalId: decisionId,
      approval: data
    });

    console.log(`[HIL] Approval request created: ${decisionId}`);
    return {
      approvalId: decisionId,
      status: ApprovalStatus.PENDING,
      reviewers: data.reviewers,
      expiresAt: data.metadata.expires_at
    };
  }

  /**
   * Approve a pending decision
   */
  async approveDecision(approvalId, reviewerId, comments = '', metadata = {}) {
    console.log(`[HIL] Approving decision ${approvalId} by reviewer ${reviewerId}`);

    // Update approval record
    const { data, error } = await supabase
      .from('human_approvals')
      .update({
        status: ApprovalStatus.APPROVED,
        approved_by: reviewerId,
        approved_at: new Date().toISOString(),
        reviewer_comments: comments,
        metadata: supabase.sql`metadata || ${JSON.stringify({
          ...metadata,
          approved_at: new Date().toISOString()
        })}`
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('[HIL] Failed to approve decision:', error);
      throw new Error(`Failed to approve decision: ${error.message}`);
    }

    // Clear timeout
    const pendingApproval = this.pendingApprovals.get(approvalId);
    if (pendingApproval?.timeoutId) {
      clearTimeout(pendingApproval.timeoutId);
    }
    this.pendingApprovals.delete(approvalId);

    // Emit approval event
    EventBus.emit('approval:approved', {
      approvalId,
      approval: data
    });

    // Call any registered callbacks
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback) {
      try {
        await callback.approveCallback(data);
      } catch (error) {
        console.error('[HIL] Error in approval callback:', error);
      }
      this.approvalCallbacks.delete(approvalId);
    }

    console.log(`[HIL] Decision ${approvalId} approved successfully`);
    return data;
  }

  /**
   * Reject a pending decision
   */
  async rejectDecision(approvalId, reviewerId, reason, comments = '', metadata = {}) {
    console.log(`[HIL] Rejecting decision ${approvalId} by reviewer ${reviewerId}: ${reason}`);

    // Update approval record
    const { data, error } = await supabase
      .from('human_approvals')
      .update({
        status: ApprovalStatus.REJECTED,
        approved_by: reviewerId,
        approved_at: new Date().toISOString(),
        reviewer_comments: comments,
        rejection_reason: reason,
        metadata: supabase.sql`metadata || ${JSON.stringify({
          ...metadata,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })}`
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('[HIL] Failed to reject decision:', error);
      throw new Error(`Failed to reject decision: ${error.message}`);
    }

    // Clear timeout
    const pendingApproval = this.pendingApprovals.get(approvalId);
    if (pendingApproval?.timeoutId) {
      clearTimeout(pendingApproval.timeoutId);
    }
    this.pendingApprovals.delete(approvalId);

    // Emit rejection event
    EventBus.emit('approval:rejected', {
      approvalId,
      approval: data
    });

    // Call any registered callbacks
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback) {
      try {
        await callback.rejectCallback(data);
      } catch (error) {
        console.error('[HIL] Error in rejection callback:', error);
      }
      this.approvalCallbacks.delete(approvalId);
    }

    console.log(`[HIL] Decision ${approvalId} rejected successfully`);
    return data;
  }

  /**
   * Register callbacks for approval outcomes
   */
  registerCallbacks(approvalId, approveCallback, rejectCallback, timeoutCallback = null) {
    this.approvalCallbacks.set(approvalId, {
      approveCallback,
      rejectCallback,
      timeoutCallback
    });
  }

  /**
   * Handle approval timeout
   */
  async handleTimeout(approvalId) {
    console.log(`[HIL] Approval ${approvalId} timed out`);

    // Update status to expired
    const { data, error } = await supabase
      .from('human_approvals')
      .update({
        status: ApprovalStatus.EXPIRED,
        metadata: supabase.sql`metadata || ${JSON.stringify({
          expired_at: new Date().toISOString()
        })}`
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('[HIL] Failed to expire approval:', error);
      return;
    }

    // Remove from pending
    this.pendingApprovals.delete(approvalId);

    // Emit timeout event
    EventBus.emit('approval:expired', {
      approvalId,
      approval: data
    });

    // Call timeout callback if registered
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback?.timeoutCallback) {
      try {
        await callback.timeoutCallback(data);
      } catch (error) {
        console.error('[HIL] Error in timeout callback:', error);
      }
    }

    this.approvalCallbacks.delete(approvalId);
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId, enterpriseId = null) {
    let query = supabase
      .from('human_approvals')
      .select('*')
      .eq('status', ApprovalStatus.PENDING)
      .contains('reviewers', [userId]);

    if (enterpriseId) {
      query = query.eq('enterprise_id', enterpriseId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[HIL] Failed to fetch pending approvals:', error);
      throw new Error(`Failed to fetch pending approvals: ${error.message}`);
    }

    return data;
  }

  /**
   * Get default reviewers for an enterprise and priority level
   */
  async getDefaultReviewers(enterpriseId, priority) {
    // This would typically query user roles and permissions
    // For now, return some default reviewers based on priority

    const defaultReviewers = {
      [ApprovalPriority.LOW]: ['compliance-officer', 'manager'],
      [ApprovalPriority.MEDIUM]: ['senior-compliance-officer', 'department-head'],
      [ApprovalPriority.HIGH]: ['chief-compliance-officer', 'legal-counsel'],
      [ApprovalPriority.CRITICAL]: ['ceo', 'board-member', 'external-auditor']
    };

    // In a real implementation, this would query the database for actual users
    // For now, we'll simulate with user IDs
    const reviewers = defaultReviewers[priority] || defaultReviewers[ApprovalPriority.MEDIUM];

    // Simulate user lookup - replace with actual user service call
    return reviewers.map(role => `${role}@${enterpriseId}`);
  }

  /**
   * Escalate an approval to higher authority
   */
  async escalateApproval(approvalId, reason, escalatedBy) {
    console.log(`[HIL] Escalating approval ${approvalId}: ${reason}`);

    // Get current approval
    const { data: currentApproval, error: fetchError } = await supabase
      .from('human_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (fetchError || !currentApproval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }

    // Determine escalation path based on current reviewers and priority
    const escalatedReviewers = await this.getEscalatedReviewers(
      currentApproval.enterprise_id,
      currentApproval.priority
    );

    // Update approval record
    const { data, error } = await supabase
      .from('human_approvals')
      .update({
        status: ApprovalStatus.ESCALATED,
        reviewers: escalatedReviewers,
        metadata: supabase.sql`metadata || ${JSON.stringify({
          escalated_at: new Date().toISOString(),
          escalated_by: escalatedBy,
          escalation_reason: reason,
          previous_reviewers: currentApproval.reviewers
        })}`
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('[HIL] Failed to escalate approval:', error);
      throw new Error(`Failed to escalate approval: ${error.message}`);
    }

    // Emit escalation event
    EventBus.emit('approval:escalated', {
      approvalId,
      approval: data,
      reason,
      escalatedBy
    });

    console.log(`[HIL] Approval ${approvalId} escalated successfully`);
    return data;
  }

  /**
   * Get escalated reviewers (higher authority)
   */
  async getEscalatedReviewers(enterpriseId, currentPriority) {
    const escalationPaths = {
      [ApprovalPriority.LOW]: [ApprovalPriority.MEDIUM],
      [ApprovalPriority.MEDIUM]: [ApprovalPriority.HIGH],
      [ApprovalPriority.HIGH]: [ApprovalPriority.CRITICAL],
      [ApprovalPriority.CRITICAL]: [ApprovalPriority.CRITICAL] // Max escalation
    };

    const nextPriority = escalationPaths[currentPriority] || [ApprovalPriority.CRITICAL];
    return await this.getDefaultReviewers(enterpriseId, nextPriority[0]);
  }

  /**
   * Get approval statistics for an enterprise
   */
  async getApprovalStats(enterpriseId, timeRange = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const { data, error } = await supabase
      .from('human_approvals')
      .select('status, priority, created_at')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('[HIL] Failed to fetch approval stats:', error);
      throw new Error(`Failed to fetch approval stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: data.filter(a => a.status === ApprovalStatus.PENDING).length,
      approved: data.filter(a => a.status === ApprovalStatus.APPROVED).length,
      rejected: data.filter(a => a.status === ApprovalStatus.REJECTED).length,
      expired: data.filter(a => a.status === ApprovalStatus.EXPIRED).length,
      escalated: data.filter(a => a.status === ApprovalStatus.ESCALATED).length,
      byPriority: {
        low: data.filter(a => a.priority === ApprovalPriority.LOW).length,
        medium: data.filter(a => a.priority === ApprovalPriority.MEDIUM).length,
        high: data.filter(a => a.priority === ApprovalPriority.HIGH).length,
        critical: data.filter(a => a.priority === ApprovalPriority.CRITICAL).length
      }
    };

    return stats;
  }
}

/**
 * Singleton instance for global use
 */
export const hilManager = new HumanInTheLoopManager();

/**
 * Convenience functions for common HIL operations
 */
export async function requestApproval(approvalRequest) {
  return await hilManager.requestApproval(approvalRequest);
}

export async function approveDecision(approvalId, reviewerId, comments = '', metadata = {}) {
  return await hilManager.approveDecision(approvalId, reviewerId, comments, metadata);
}

export async function rejectDecision(approvalId, reviewerId, reason, comments = '', metadata = {}) {
  return await hilManager.rejectDecision(approvalId, reviewerId, reason, comments, metadata);
}

export default HumanInTheLoopManager;
