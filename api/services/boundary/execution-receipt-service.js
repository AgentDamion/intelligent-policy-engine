/**
 * Execution Receipt Service
 * 
 * Manages Execution Receipts (ERs) - attestations that authorized AI tools
 * were actually executed. ERs complete the proof chain and enable regulatory
 * verification of compliant usage.
 * 
 * Supports both:
 * - Enterprise-run mode: Enterprise executes the tool directly
 * - Partner-run mode: Partner executes after confirmation
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { DecisionTokenService } from './decision-token-service.js';
import { PartnerConfirmationService } from './partner-confirmation-service.js';

/**
 * ExecutionReceiptService - Records execution attestations for governed AI tool usage
 */
export class ExecutionReceiptService {
  constructor(options = {}) {
    // Signing configuration (matches DecisionTokenService)
    this.signingMethod = process.env.DT_SIGNING_METHOD || 'HMAC';
    this.hmacSecret = process.env.DT_HMAC_SECRET || 'development-secret-change-in-production';
    
    // Supabase client
    this.supabase = options.supabase || createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );
    
    // Related services
    this.dtService = options.dtService || new DecisionTokenService();
    this.pcService = options.pcService || new PartnerConfirmationService();
  }

  /**
   * Submit an Execution Receipt
   * 
   * @param {Object} params - Receipt parameters
   * @param {string} params.dtId - Decision Token ID
   * @param {string} params.pcId - Partner Confirmation ID (optional, required for partner-run)
   * @param {string} params.executorType - 'enterprise' or 'partner'
   * @param {string} params.executorId - Executing enterprise ID
   * @param {string} params.executorUserId - User who performed execution (optional)
   * @param {Date} params.executionStartedAt - When execution started
   * @param {Date} params.executionCompletedAt - When execution completed (optional)
   * @param {Object} params.outcome - Execution outcome details
   * @param {string} params.traceId - Trace context ID (optional)
   * @returns {Promise<Object>} Created Execution Receipt
   */
  async submitReceipt(params) {
    const {
      dtId,
      pcId = null,
      executorType,
      executorId,
      executorUserId = null,
      executionStartedAt,
      executionCompletedAt = null,
      outcome = {},
      traceId = null
    } = params;

    logger.info('Submitting Execution Receipt', { 
      dtId, 
      pcId, 
      executorType, 
      executorId, 
      traceId 
    });

    try {
      // Validate required fields
      if (!dtId || !executorType || !executorId || !executionStartedAt) {
        throw new Error('Missing required fields: dtId, executorType, executorId, executionStartedAt');
      }

      // Validate executor type
      if (!['enterprise', 'partner'].includes(executorType)) {
        throw new Error('executorType must be "enterprise" or "partner"');
      }

      // Verify the Decision Token
      const dtVerification = await this.dtService.verifyDecisionToken(dtId);
      if (!dtVerification.valid) {
        throw new Error(`Invalid Decision Token: ${dtVerification.reason}`);
      }

      // For partner-run mode, verify Partner Confirmation exists
      if (executorType === 'partner') {
        if (!pcId) {
          // Try to find existing PC
          const existingPC = await this.pcService.getConfirmationByDT(dtId);
          if (!existingPC) {
            throw new Error('Partner Confirmation required for partner-run execution');
          }
          params.pcId = existingPC.pc_id;
        } else {
          // Verify the provided PC
          const pcVerification = await this.pcService.verifyConfirmation(pcId);
          if (!pcVerification.valid) {
            throw new Error(`Invalid Partner Confirmation: ${pcVerification.reason}`);
          }
        }
      }

      // Calculate execution duration
      const startTime = new Date(executionStartedAt);
      const endTime = executionCompletedAt ? new Date(executionCompletedAt) : new Date();
      const executionDurationMs = endTime.getTime() - startTime.getTime();

      // Build the payload to be signed (attestation)
      const payload = {
        dtId,
        pcId: params.pcId || pcId,
        executorType,
        executorId,
        executorUserId,
        executionStartedAt: startTime.toISOString(),
        executionCompletedAt: endTime.toISOString(),
        outcomeHash: this.hashOutcome(outcome)
      };

      // Sign the attestation
      const attestation = await this.signPayload(payload);

      // Store in database
      const { data: er, error } = await this.supabase
        .from('boundary_execution_receipts')
        .insert({
          dt_id: dtId,
          pc_id: params.pcId || pcId,
          executor_type: executorType,
          executor_id: executorId,
          executor_user_id: executorUserId,
          execution_started_at: startTime.toISOString(),
          execution_completed_at: endTime.toISOString(),
          execution_duration_ms: executionDurationMs,
          outcome: outcome,
          attestation: attestation,
          signing_method: this.signingMethod,
          trace_id: traceId
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to store Execution Receipt', { error: error.message, traceId });
        throw new Error(`Failed to store Execution Receipt: ${error.message}`);
      }

      // Mark the Decision Token as consumed (if configured to do so)
      // Note: You may want to allow multiple executions per DT in some cases
      if (outcome.consumeToken !== false) {
        await this.dtService.consumeDecisionToken(dtId);
      }

      logger.info('Execution Receipt submitted successfully', { 
        erId: er.er_id, 
        dtId, 
        executorType,
        executionDurationMs,
        traceId 
      });

      return {
        er_id: er.er_id,
        dt_id: er.dt_id,
        pc_id: er.pc_id,
        executor_type: er.executor_type,
        executor_id: er.executor_id,
        executor_user_id: er.executor_user_id,
        execution_started_at: er.execution_started_at,
        execution_completed_at: er.execution_completed_at,
        execution_duration_ms: er.execution_duration_ms,
        outcome: er.outcome,
        attestation: er.attestation,
        signing_method: er.signing_method,
        trace_id: er.trace_id,
        created_at: er.created_at,
        // Include proof chain summary
        proof_chain: {
          decision_token: {
            dt_id: dtVerification.dt_id,
            enterprise_id: dtVerification.enterprise_id,
            tool_name: dtVerification.tool_name,
            tool_version: dtVerification.tool_version
          },
          partner_confirmation: params.pcId || pcId ? { pc_id: params.pcId || pcId } : null,
          execution_receipt: { er_id: er.er_id },
          chain_complete: true
        }
      };

    } catch (error) {
      logger.error('Error submitting Execution Receipt', { 
        error: error.message, 
        dtId, 
        executorType, 
        traceId 
      });
      throw error;
    }
  }

  /**
   * Get an Execution Receipt by ID
   * 
   * @param {string} erId - Execution Receipt ID
   * @returns {Promise<Object|null>} Execution Receipt or null
   */
  async getReceipt(erId) {
    try {
      const { data: er, error } = await this.supabase
        .from('boundary_execution_receipts')
        .select('*')
        .eq('er_id', erId)
        .single();

      if (error || !er) {
        return null;
      }

      return er;

    } catch (error) {
      logger.error('Error fetching Execution Receipt', { error: error.message, erId });
      return null;
    }
  }

  /**
   * Get Execution Receipt for a Decision Token
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<Object|null>} Execution Receipt or null
   */
  async getReceiptByDT(dtId) {
    try {
      const { data: er, error } = await this.supabase
        .from('boundary_execution_receipts')
        .select('*')
        .eq('dt_id', dtId)
        .single();

      if (error || !er) {
        return null;
      }

      return er;

    } catch (error) {
      logger.error('Error fetching Execution Receipt by DT', { error: error.message, dtId });
      return null;
    }
  }

  /**
   * Verify an Execution Receipt
   * 
   * @param {string} erId - Execution Receipt ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyReceipt(erId) {
    logger.debug('Verifying Execution Receipt', { erId });

    try {
      const er = await this.getReceipt(erId);
      if (!er) {
        return {
          valid: false,
          reason: 'Execution Receipt not found',
          er_id: erId
        };
      }

      // Verify attestation signature
      const payload = {
        dtId: er.dt_id,
        pcId: er.pc_id,
        executorType: er.executor_type,
        executorId: er.executor_id,
        executorUserId: er.executor_user_id,
        executionStartedAt: er.execution_started_at,
        executionCompletedAt: er.execution_completed_at,
        outcomeHash: this.hashOutcome(er.outcome)
      };

      const expectedAttestation = await this.signPayload(payload);
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(er.attestation),
        Buffer.from(expectedAttestation)
      );

      if (!signatureValid) {
        logger.warn('Execution Receipt attestation verification failed', { erId });
        return {
          valid: false,
          reason: 'Attestation verification failed',
          er_id: erId
        };
      }

      // Verify the linked DT
      const dtVerification = await this.dtService.verifyDecisionToken(er.dt_id);
      // Note: DT might be consumed, which is expected after execution
      const dtValid = dtVerification.valid || dtVerification.status === 'consumed';

      // Verify linked PC if present
      let pcValid = true;
      if (er.pc_id) {
        const pcVerification = await this.pcService.verifyConfirmation(er.pc_id);
        pcValid = pcVerification.valid;
      }

      logger.info('Execution Receipt verified successfully', { erId });

      return {
        valid: true,
        er_id: erId,
        dt_id: er.dt_id,
        pc_id: er.pc_id,
        executor_type: er.executor_type,
        executor_id: er.executor_id,
        execution_started_at: er.execution_started_at,
        execution_completed_at: er.execution_completed_at,
        outcome: er.outcome,
        attestation_verified: true,
        decision_token_valid: dtValid,
        partner_confirmation_valid: pcValid,
        proof_chain_valid: dtValid && pcValid
      };

    } catch (error) {
      logger.error('Error verifying Execution Receipt', { error: error.message, erId });
      return {
        valid: false,
        reason: `Verification error: ${error.message}`,
        er_id: erId
      };
    }
  }

  /**
   * List Execution Receipts for an executor
   * 
   * @param {string} executorId - Executor enterprise ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of Execution Receipts
   */
  async listReceipts(executorId, options = {}) {
    const { executorType, limit = 50, offset = 0 } = options;

    try {
      let query = this.supabase
        .from('boundary_execution_receipts')
        .select('*')
        .eq('executor_id', executorId)
        .order('execution_started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (executorType) {
        query = query.eq('executor_type', executorType);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error listing Execution Receipts', { error: error.message, executorId });
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('Error listing Execution Receipts', { error: error.message, executorId });
      return [];
    }
  }

  /**
   * Get complete proof chain for a Decision Token
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<Object>} Complete proof chain
   */
  async getProofChain(dtId) {
    try {
      // Fetch all artifacts
      const dt = await this.dtService.getDecisionToken(dtId);
      const pc = await this.pcService.getConfirmationByDT(dtId);
      const er = await this.getReceiptByDT(dtId);

      if (!dt) {
        return {
          success: false,
          reason: 'Decision Token not found'
        };
      }

      const chainStatus = er 
        ? 'complete' 
        : pc 
          ? 'awaiting_execution' 
          : dt.partner_id 
            ? 'awaiting_confirmation' 
            : 'enterprise_run_pending';

      return {
        success: true,
        dt_id: dtId,
        chain_status: chainStatus,
        decision_token: {
          dt_id: dt.dt_id,
          enterprise_id: dt.enterprise_id,
          partner_id: dt.partner_id,
          tool_name: dt.tool_name,
          tool_version: dt.tool_version,
          vendor_name: dt.vendor_name,
          status: dt.status,
          issued_at: dt.issued_at,
          expires_at: dt.expires_at,
          signature: dt.signature
        },
        partner_confirmation: pc ? {
          pc_id: pc.pc_id,
          partner_id: pc.partner_id,
          confirmer_user_id: pc.confirmer_user_id,
          confirmed_at: pc.confirmed_at,
          signature: pc.signature
        } : null,
        execution_receipt: er ? {
          er_id: er.er_id,
          executor_type: er.executor_type,
          executor_id: er.executor_id,
          execution_started_at: er.execution_started_at,
          execution_completed_at: er.execution_completed_at,
          execution_duration_ms: er.execution_duration_ms,
          outcome: er.outcome,
          attestation: er.attestation
        } : null,
        is_complete: chainStatus === 'complete'
      };

    } catch (error) {
      logger.error('Error getting proof chain', { error: error.message, dtId });
      return {
        success: false,
        reason: error.message
      };
    }
  }

  /**
   * Hash the outcome for signing
   * 
   * @param {Object} outcome - Execution outcome
   * @returns {string} SHA256 hash of outcome
   */
  hashOutcome(outcome) {
    const outcomeString = JSON.stringify(outcome, Object.keys(outcome).sort());
    return crypto.createHash('sha256').update(outcomeString).digest('hex');
  }

  /**
   * Sign a payload using configured signing method
   * 
   * @param {Object} payload - Payload to sign
   * @returns {Promise<string>} Signature
   */
  async signPayload(payload) {
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());

    // HMAC-SHA256 signing
    const hmac = crypto.createHmac('sha256', this.hmacSecret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }
}

// Export singleton instance for convenience
export const executionReceiptService = new ExecutionReceiptService();

export default ExecutionReceiptService;

