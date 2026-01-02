/**
 * Partner Confirmation Service
 * 
 * Manages Partner Confirmations (PCs) - explicit consent records where partners
 * acknowledge they will use an authorized AI tool under the bound policy snapshot.
 * 
 * This implements the "Shared Compliance Shield" principle: both enterprises and
 * partners benefit equally from governed AI tool usage.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { DecisionTokenService } from './decision-token-service.js';

/**
 * Standard confirmation statement that partners agree to
 */
const STANDARD_CONFIRMATION_STATEMENT = 
  "I acknowledge that I will use the authorized tool/version under the bound policy snapshot " +
  "for the stated purpose, and I understand this usage is governed and recorded.";

/**
 * PartnerConfirmationService - Manages partner consent for governed AI tool usage
 */
export class PartnerConfirmationService {
  constructor(options = {}) {
    // Signing configuration (matches DecisionTokenService)
    this.signingMethod = process.env.DT_SIGNING_METHOD || 'HMAC';
    this.hmacSecret = process.env.DT_HMAC_SECRET || 'development-secret-change-in-production';
    
    // Supabase client
    this.supabase = options.supabase || createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );
    
    // Decision Token service for verification
    this.dtService = options.dtService || new DecisionTokenService();
  }

  /**
   * Create a Partner Confirmation
   * 
   * @param {Object} params - Confirmation parameters
   * @param {string} params.dtId - Decision Token ID being confirmed
   * @param {string} params.partnerId - Partner enterprise ID
   * @param {string} params.confirmerUserId - User ID of the person confirming
   * @param {string} params.confirmerRole - Role of the confirmer (optional)
   * @param {string} params.confirmationStatement - Custom statement (optional, uses default)
   * @param {Array} params.acceptedControls - List of control IDs accepted
   * @param {string} params.ipAddress - Client IP address (optional)
   * @param {string} params.userAgent - Client user agent (optional)
   * @param {string} params.traceId - Trace context ID (optional)
   * @returns {Promise<Object>} Created Partner Confirmation
   */
  async createConfirmation(params) {
    const {
      dtId,
      partnerId,
      confirmerUserId,
      confirmerRole = null,
      confirmationStatement = STANDARD_CONFIRMATION_STATEMENT,
      acceptedControls = [],
      ipAddress = null,
      userAgent = null,
      traceId = null
    } = params;

    logger.info('Creating Partner Confirmation', { dtId, partnerId, confirmerUserId, traceId });

    try {
      // Validate required fields
      if (!dtId || !partnerId || !confirmerUserId) {
        throw new Error('Missing required fields: dtId, partnerId, confirmerUserId');
      }

      // Verify the Decision Token exists and is valid
      const dtVerification = await this.dtService.verifyDecisionToken(dtId);
      if (!dtVerification.valid) {
        throw new Error(`Invalid Decision Token: ${dtVerification.reason}`);
      }

      // Verify the partner is authorized for this DT
      if (dtVerification.partner_id && dtVerification.partner_id !== partnerId) {
        throw new Error('Partner ID does not match Decision Token');
      }

      // Check for existing confirmation (prevent duplicates)
      const { data: existing } = await this.supabase
        .from('boundary_partner_confirmations')
        .select('pc_id')
        .eq('dt_id', dtId)
        .eq('partner_id', partnerId)
        .single();

      if (existing) {
        logger.warn('Partner Confirmation already exists', { dtId, partnerId, pcId: existing.pc_id });
        return await this.getConfirmation(existing.pc_id);
      }

      // Calculate expiry (same as DT expiry)
      const confirmedAt = new Date();
      const expiresAt = new Date(dtVerification.expires_at);

      // Build the payload to be signed
      const payload = {
        dtId,
        partnerId,
        confirmerUserId,
        confirmationStatement,
        acceptedControls,
        confirmedAt: confirmedAt.toISOString()
      };

      // Sign the confirmation
      const signature = await this.signPayload(payload);

      // Store in database
      const { data: pc, error } = await this.supabase
        .from('boundary_partner_confirmations')
        .insert({
          dt_id: dtId,
          partner_id: partnerId,
          confirmer_user_id: confirmerUserId,
          confirmer_role: confirmerRole,
          confirmation_statement: confirmationStatement,
          accepted_controls: acceptedControls,
          ip_address: ipAddress,
          user_agent: userAgent,
          signature: signature,
          signing_method: this.signingMethod,
          confirmed_at: confirmedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          trace_id: traceId
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to store Partner Confirmation', { error: error.message, traceId });
        throw new Error(`Failed to store Partner Confirmation: ${error.message}`);
      }

      logger.info('Partner Confirmation created successfully', { 
        pcId: pc.pc_id, 
        dtId, 
        partnerId,
        traceId 
      });

      return {
        pc_id: pc.pc_id,
        dt_id: pc.dt_id,
        partner_id: pc.partner_id,
        confirmer_user_id: pc.confirmer_user_id,
        confirmer_role: pc.confirmer_role,
        confirmation_statement: pc.confirmation_statement,
        accepted_controls: pc.accepted_controls,
        confirmed_at: pc.confirmed_at,
        expires_at: pc.expires_at,
        signature: pc.signature,
        signing_method: pc.signing_method,
        trace_id: pc.trace_id,
        // Include DT details for convenience
        decision_token: {
          dt_id: dtVerification.dt_id,
          enterprise_id: dtVerification.enterprise_id,
          tool_name: dtVerification.tool_name,
          tool_version: dtVerification.tool_version,
          vendor_name: dtVerification.vendor_name,
          usage_grant: dtVerification.usage_grant,
          decision: dtVerification.decision
        }
      };

    } catch (error) {
      logger.error('Error creating Partner Confirmation', { 
        error: error.message, 
        dtId, 
        partnerId, 
        traceId 
      });
      throw error;
    }
  }

  /**
   * Get a Partner Confirmation by ID
   * 
   * @param {string} pcId - Partner Confirmation ID
   * @returns {Promise<Object|null>} Partner Confirmation or null
   */
  async getConfirmation(pcId) {
    try {
      const { data: pc, error } = await this.supabase
        .from('boundary_partner_confirmations')
        .select('*')
        .eq('pc_id', pcId)
        .single();

      if (error || !pc) {
        return null;
      }

      return pc;

    } catch (error) {
      logger.error('Error fetching Partner Confirmation', { error: error.message, pcId });
      return null;
    }
  }

  /**
   * Get Partner Confirmation for a Decision Token
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<Object|null>} Partner Confirmation or null
   */
  async getConfirmationByDT(dtId) {
    try {
      const { data: pc, error } = await this.supabase
        .from('boundary_partner_confirmations')
        .select('*')
        .eq('dt_id', dtId)
        .single();

      if (error || !pc) {
        return null;
      }

      return pc;

    } catch (error) {
      logger.error('Error fetching Partner Confirmation by DT', { error: error.message, dtId });
      return null;
    }
  }

  /**
   * Verify a Partner Confirmation
   * 
   * @param {string} pcId - Partner Confirmation ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyConfirmation(pcId) {
    logger.debug('Verifying Partner Confirmation', { pcId });

    try {
      const pc = await this.getConfirmation(pcId);
      if (!pc) {
        return {
          valid: false,
          reason: 'Partner Confirmation not found',
          pc_id: pcId
        };
      }

      // Check expiry
      if (new Date(pc.expires_at) < new Date()) {
        return {
          valid: false,
          reason: 'Partner Confirmation has expired',
          pc_id: pcId,
          expired_at: pc.expires_at
        };
      }

      // Verify signature
      const payload = {
        dtId: pc.dt_id,
        partnerId: pc.partner_id,
        confirmerUserId: pc.confirmer_user_id,
        confirmationStatement: pc.confirmation_statement,
        acceptedControls: pc.accepted_controls,
        confirmedAt: pc.confirmed_at
      };

      const expectedSignature = await this.signPayload(payload);
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(pc.signature),
        Buffer.from(expectedSignature)
      );

      if (!signatureValid) {
        logger.warn('Partner Confirmation signature verification failed', { pcId });
        return {
          valid: false,
          reason: 'Signature verification failed',
          pc_id: pcId
        };
      }

      // Also verify the linked DT
      const dtVerification = await this.dtService.verifyDecisionToken(pc.dt_id);
      if (!dtVerification.valid) {
        return {
          valid: false,
          reason: `Linked Decision Token is invalid: ${dtVerification.reason}`,
          pc_id: pcId,
          dt_id: pc.dt_id
        };
      }

      logger.info('Partner Confirmation verified successfully', { pcId });

      return {
        valid: true,
        pc_id: pcId,
        dt_id: pc.dt_id,
        partner_id: pc.partner_id,
        confirmer_user_id: pc.confirmer_user_id,
        confirmed_at: pc.confirmed_at,
        expires_at: pc.expires_at,
        signature_verified: true,
        decision_token_valid: true
      };

    } catch (error) {
      logger.error('Error verifying Partner Confirmation', { error: error.message, pcId });
      return {
        valid: false,
        reason: `Verification error: ${error.message}`,
        pc_id: pcId
      };
    }
  }

  /**
   * List Partner Confirmations for a partner
   * 
   * @param {string} partnerId - Partner enterprise ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of Partner Confirmations
   */
  async listConfirmations(partnerId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    try {
      const { data, error } = await this.supabase
        .from('boundary_partner_confirmations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('confirmed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error listing Partner Confirmations', { error: error.message, partnerId });
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('Error listing Partner Confirmations', { error: error.message, partnerId });
      return [];
    }
  }

  /**
   * Get Decision Token details for partner confirmation flow
   * 
   * @param {string} dtId - Decision Token ID
   * @param {string} partnerId - Requesting partner ID (for authorization check)
   * @returns {Promise<Object>} Decision Token details for confirmation UI
   */
  async getDecisionTokenForConfirmation(dtId, partnerId) {
    try {
      const dtVerification = await this.dtService.verifyDecisionToken(dtId);
      
      if (!dtVerification.valid) {
        return {
          success: false,
          reason: dtVerification.reason
        };
      }

      // Check if partner is authorized
      if (dtVerification.partner_id && dtVerification.partner_id !== partnerId) {
        return {
          success: false,
          reason: 'Not authorized to view this Decision Token'
        };
      }

      // Check if already confirmed
      const existingPC = await this.getConfirmationByDT(dtId);
      const alreadyConfirmed = !!existingPC;

      return {
        success: true,
        decision_token: {
          dt_id: dtVerification.dt_id,
          enterprise_id: dtVerification.enterprise_id,
          tool_name: dtVerification.tool_name,
          tool_version: dtVerification.tool_version,
          vendor_name: dtVerification.vendor_name,
          usage_grant: dtVerification.usage_grant,
          decision: dtVerification.decision,
          eps_id: dtVerification.eps_id,
          issued_at: dtVerification.issued_at,
          expires_at: dtVerification.expires_at
        },
        confirmation_statement: STANDARD_CONFIRMATION_STATEMENT,
        already_confirmed: alreadyConfirmed,
        existing_confirmation: alreadyConfirmed ? existingPC : null
      };

    } catch (error) {
      logger.error('Error getting DT for confirmation', { error: error.message, dtId, partnerId });
      return {
        success: false,
        reason: error.message
      };
    }
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
export const partnerConfirmationService = new PartnerConfirmationService();

export default PartnerConfirmationService;

