/**
 * Decision Token Service
 * 
 * Manages the issuance, verification, and revocation of Decision Tokens (DTs).
 * Decision Tokens are cryptographically signed authorizations for AI tool usage
 * that cross organizational boundaries.
 * 
 * Architecture: Designed for easy migration from HMAC to KMS signing.
 * Current: HMAC-SHA256 signing (fast time-to-market)
 * Future: Single config change to enable AWS KMS signing
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

/**
 * DecisionTokenService - Issues and manages Decision Tokens
 */
export class DecisionTokenService {
  constructor(options = {}) {
    // Signing configuration (KMS-ready structure)
    this.signingMethod = process.env.DT_SIGNING_METHOD || 'HMAC';
    this.hmacSecret = process.env.DT_HMAC_SECRET || 'development-secret-change-in-production';
    this.kmsKeyId = process.env.KMS_KEY_ID; // For future KMS integration
    
    // Token configuration
    this.defaultExpiryHours = parseInt(process.env.DT_EXPIRY_HOURS || '72', 10);
    
    // Supabase client
    this.supabase = options.supabase || createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );
  }

  /**
   * Issue a new Decision Token
   * 
   * @param {Object} params - Token parameters
   * @param {string} params.enterpriseId - Issuing enterprise ID
   * @param {string|null} params.partnerId - Target partner ID (null for enterprise-run)
   * @param {string} params.epsId - Effective Policy Snapshot ID
   * @param {string} params.epsDigest - EPS cryptographic digest
   * @param {string} params.toolRegistryId - Tool registry entry ID
   * @param {string} params.toolVersionId - Tool version ID
   * @param {string} params.toolName - Human-readable tool name
   * @param {string} params.toolVersion - Tool version string
   * @param {string} params.vendorName - Vendor name
   * @param {Object} params.usageGrant - Authorized usage parameters
   * @param {Object} params.decision - Policy decision details
   * @param {string} params.traceId - Trace context ID
   * @param {number} params.expiryHours - Override default expiry (optional)
   * @returns {Promise<Object>} Issued Decision Token
   */
  async issueDecisionToken(params) {
    const {
      enterpriseId,
      partnerId = null,
      epsId,
      epsDigest,
      toolRegistryId = null,
      toolVersionId = null,
      toolName,
      toolVersion,
      vendorName,
      usageGrant = {},
      decision = {},
      traceId = null,
      expiryHours = this.defaultExpiryHours
    } = params;

    logger.info('Issuing Decision Token', { 
      enterpriseId, 
      partnerId, 
      toolName, 
      traceId 
    });

    try {
      // Validate required fields
      if (!enterpriseId || !epsId || !epsDigest || !toolName || !toolVersion || !vendorName) {
        throw new Error('Missing required fields for Decision Token issuance');
      }

      // Calculate expiry
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + expiryHours * 60 * 60 * 1000);

      // Build the payload to be signed
      const payload = {
        enterpriseId,
        partnerId,
        epsId,
        epsDigest,
        toolName,
        toolVersion,
        vendorName,
        usageGrant,
        decision,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      // Sign the payload
      const signature = await this.signPayload(payload);

      // Store in database
      const { data: dt, error } = await this.supabase
        .from('boundary_decision_tokens')
        .insert({
          enterprise_id: enterpriseId,
          partner_id: partnerId,
          eps_id: epsId,
          eps_digest: epsDigest,
          tool_registry_id: toolRegistryId,
          tool_version_id: toolVersionId,
          tool_name: toolName,
          tool_version: toolVersion,
          vendor_name: vendorName,
          usage_grant: usageGrant,
          decision: decision,
          signature: signature,
          signing_method: this.signingMethod,
          signing_key_id: this.signingMethod === 'KMS' ? this.kmsKeyId : null,
          status: 'active',
          issued_at: issuedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          trace_id: traceId,
          request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to store Decision Token', { error: error.message, traceId });
        throw new Error(`Failed to store Decision Token: ${error.message}`);
      }

      logger.info('Decision Token issued successfully', { 
        dtId: dt.dt_id, 
        enterpriseId, 
        partnerId,
        expiresAt: expiresAt.toISOString(),
        traceId 
      });

      return {
        dt_id: dt.dt_id,
        enterprise_id: dt.enterprise_id,
        partner_id: dt.partner_id,
        eps_id: dt.eps_id,
        eps_digest: dt.eps_digest,
        tool_name: dt.tool_name,
        tool_version: dt.tool_version,
        vendor_name: dt.vendor_name,
        usage_grant: dt.usage_grant,
        decision: dt.decision,
        status: dt.status,
        issued_at: dt.issued_at,
        expires_at: dt.expires_at,
        signature: dt.signature,
        signing_method: dt.signing_method,
        trace_id: dt.trace_id
      };

    } catch (error) {
      logger.error('Error issuing Decision Token', { 
        error: error.message, 
        enterpriseId, 
        traceId 
      });
      throw error;
    }
  }

  /**
   * Verify a Decision Token
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyDecisionToken(dtId) {
    logger.debug('Verifying Decision Token', { dtId });

    try {
      // Fetch the token
      const { data: dt, error } = await this.supabase
        .from('boundary_decision_tokens')
        .select('*')
        .eq('dt_id', dtId)
        .single();

      if (error || !dt) {
        return {
          valid: false,
          reason: 'Decision Token not found',
          dt_id: dtId
        };
      }

      // Check status
      if (dt.status !== 'active') {
        return {
          valid: false,
          reason: `Decision Token is ${dt.status}`,
          dt_id: dtId,
          status: dt.status
        };
      }

      // Check expiry
      if (new Date(dt.expires_at) < new Date()) {
        // Auto-expire the token
        await this.supabase
          .from('boundary_decision_tokens')
          .update({ status: 'expired' })
          .eq('dt_id', dtId);

        return {
          valid: false,
          reason: 'Decision Token has expired',
          dt_id: dtId,
          expired_at: dt.expires_at
        };
      }

      // Verify signature
      const payload = {
        enterpriseId: dt.enterprise_id,
        partnerId: dt.partner_id,
        epsId: dt.eps_id,
        epsDigest: dt.eps_digest,
        toolName: dt.tool_name,
        toolVersion: dt.tool_version,
        vendorName: dt.vendor_name,
        usageGrant: dt.usage_grant,
        decision: dt.decision,
        issuedAt: dt.issued_at,
        expiresAt: dt.expires_at
      };

      const expectedSignature = await this.signPayload(payload);
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(dt.signature),
        Buffer.from(expectedSignature)
      );

      if (!signatureValid) {
        logger.warn('Decision Token signature verification failed', { dtId });
        return {
          valid: false,
          reason: 'Signature verification failed',
          dt_id: dtId
        };
      }

      logger.info('Decision Token verified successfully', { dtId });

      return {
        valid: true,
        dt_id: dtId,
        enterprise_id: dt.enterprise_id,
        partner_id: dt.partner_id,
        eps_id: dt.eps_id,
        eps_digest: dt.eps_digest,
        tool_name: dt.tool_name,
        tool_version: dt.tool_version,
        vendor_name: dt.vendor_name,
        usage_grant: dt.usage_grant,
        decision: dt.decision,
        status: dt.status,
        issued_at: dt.issued_at,
        expires_at: dt.expires_at,
        signature_verified: true
      };

    } catch (error) {
      logger.error('Error verifying Decision Token', { error: error.message, dtId });
      return {
        valid: false,
        reason: `Verification error: ${error.message}`,
        dt_id: dtId
      };
    }
  }

  /**
   * Revoke a Decision Token
   * 
   * @param {string} dtId - Decision Token ID
   * @param {string} reason - Revocation reason
   * @returns {Promise<Object>} Revocation result
   */
  async revokeDecisionToken(dtId, reason) {
    logger.info('Revoking Decision Token', { dtId, reason });

    try {
      const { data: dt, error } = await this.supabase
        .from('boundary_decision_tokens')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revocation_reason: reason
        })
        .eq('dt_id', dtId)
        .eq('status', 'active')
        .select()
        .single();

      if (error || !dt) {
        logger.warn('Failed to revoke Decision Token', { dtId, error: error?.message });
        return {
          success: false,
          reason: error?.message || 'Token not found or already revoked'
        };
      }

      logger.info('Decision Token revoked successfully', { dtId });

      return {
        success: true,
        dt_id: dtId,
        revoked_at: dt.revoked_at,
        revocation_reason: reason
      };

    } catch (error) {
      logger.error('Error revoking Decision Token', { error: error.message, dtId });
      throw error;
    }
  }

  /**
   * Get a Decision Token by ID
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<Object|null>} Decision Token or null
   */
  async getDecisionToken(dtId) {
    try {
      const { data: dt, error } = await this.supabase
        .from('boundary_decision_tokens')
        .select('*')
        .eq('dt_id', dtId)
        .single();

      if (error || !dt) {
        return null;
      }

      return dt;

    } catch (error) {
      logger.error('Error fetching Decision Token', { error: error.message, dtId });
      return null;
    }
  }

  /**
   * Mark a Decision Token as consumed
   * 
   * @param {string} dtId - Decision Token ID
   * @returns {Promise<boolean>} Success status
   */
  async consumeDecisionToken(dtId) {
    logger.info('Consuming Decision Token', { dtId });

    try {
      const { error } = await this.supabase
        .from('boundary_decision_tokens')
        .update({
          status: 'consumed',
          consumed_at: new Date().toISOString()
        })
        .eq('dt_id', dtId)
        .eq('status', 'active');

      if (error) {
        logger.warn('Failed to consume Decision Token', { dtId, error: error.message });
        return false;
      }

      logger.info('Decision Token consumed successfully', { dtId });
      return true;

    } catch (error) {
      logger.error('Error consuming Decision Token', { error: error.message, dtId });
      return false;
    }
  }

  /**
   * List Decision Tokens for an enterprise
   * 
   * @param {string} enterpriseId - Enterprise ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of Decision Tokens
   */
  async listDecisionTokens(enterpriseId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    try {
      let query = this.supabase
        .from('boundary_decision_tokens')
        .select('*')
        .or(`enterprise_id.eq.${enterpriseId},partner_id.eq.${enterpriseId}`)
        .order('issued_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error listing Decision Tokens', { error: error.message, enterpriseId });
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('Error listing Decision Tokens', { error: error.message, enterpriseId });
      return [];
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

    if (this.signingMethod === 'KMS') {
      // Future: AWS KMS signing
      // This is a placeholder for KMS integration
      // When enabled, this will call AWS KMS to sign the payload
      // const kms = new AWS.KMS();
      // const result = await kms.sign({
      //   KeyId: this.kmsKeyId,
      //   Message: Buffer.from(payloadString),
      //   MessageType: 'RAW',
      //   SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
      // }).promise();
      // return result.Signature.toString('base64');
      
      logger.warn('KMS signing not yet implemented, falling back to HMAC');
    }

    // HMAC-SHA256 signing (current implementation)
    const hmac = crypto.createHmac('sha256', this.hmacSecret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }

  /**
   * Verify a signature
   * 
   * @param {Object} payload - Original payload
   * @param {string} signature - Signature to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifySignature(payload, signature) {
    try {
      const expectedSignature = await this.signPayload(payload);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Signature verification error', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance for convenience
export const decisionTokenService = new DecisionTokenService();

export default DecisionTokenService;

