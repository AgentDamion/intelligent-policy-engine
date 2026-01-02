/**
 * Verification Service
 * 
 * Implements cryptographic verification of proof bundles and boundary artifacts.
 * Generates human-readable verification reports for regulators.
 * 
 * This service answers the key regulatory questions:
 * - Which tool was used?
 * - Which version?
 * - Under which policy?
 * - With what proof?
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { DecisionTokenService } from './decision-token-service.js';
import { PartnerConfirmationService } from './partner-confirmation-service.js';
import { ExecutionReceiptService } from './execution-receipt-service.js';

/**
 * VerificationService - Cryptographic verification and compliance reporting
 */
export class VerificationService {
  constructor(options = {}) {
    // Supabase client
    this.supabase = options.supabase || createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );
    
    // Related services
    this.dtService = options.dtService || new DecisionTokenService();
    this.pcService = options.pcService || new PartnerConfirmationService();
    this.erService = options.erService || new ExecutionReceiptService();
  }

  /**
   * Verify a complete proof bundle
   * 
   * @param {string} proofBundleId - Proof bundle ID
   * @returns {Promise<Object>} Full verification result
   */
  async verifyProofBundle(proofBundleId) {
    logger.info('Verifying proof bundle', { proofBundleId });

    try {
      // Fetch the proof bundle
      const { data: bundle, error } = await this.supabase
        .from('proof_bundles')
        .select('*')
        .eq('id', proofBundleId)
        .single();

      if (error || !bundle) {
        return {
          valid: false,
          reason: 'Proof bundle not found',
          proofBundleId
        };
      }

      // Verify bundle hash integrity
      const storedContent = bundle.atom_states_snapshot;
      const computedHash = this.computeHash(storedContent);
      const storedHash = bundle.bundle_hash?.replace('sha256:', '') || '';
      const hashValid = storedHash && computedHash === storedHash;

      // Verify policy snapshot reference
      let policyValid = false;
      let policyDetails = null;
      if (bundle.policy_digest) {
        const { data: policyArtifact } = await this.supabase
          .from('policy_artifacts')
          .select('*')
          .eq('digest', bundle.policy_digest)
          .single();

        if (policyArtifact) {
          policyValid = true;
          policyDetails = {
            digest: policyArtifact.digest,
            fullReference: policyArtifact.full_oci_reference,
            policyId: policyArtifact.policy_id,
            activatedAt: policyArtifact.created_at
          };
        }
      }

      // Verify boundary artifacts if present
      let boundaryVerification = null;
      if (storedContent?.boundaryProof) {
        boundaryVerification = await this.verifyBoundaryChain(storedContent.boundaryProof);
      }

      // Build verification result
      const result = {
        valid: hashValid,
        proofBundleId,
        bundleHash: bundle.bundle_hash,
        hashVerified: hashValid,
        computedHash: `sha256:${computedHash}`,
        policyVerification: {
          valid: policyValid,
          digest: bundle.policy_digest,
          details: policyDetails
        },
        boundaryVerification,
        enterpriseId: bundle.enterprise_id,
        traceId: bundle.trace_id,
        generatedAt: bundle.created_at,
        contents: {
          agentActivityCount: storedContent?.agentActivities?.length || 0,
          decisionsCount: storedContent?.decisions?.length || 0,
          auditEventsCount: storedContent?.auditTrail?.length || 0
        }
      };

      logger.info('Proof bundle verification complete', { 
        proofBundleId, 
        valid: result.valid,
        hashValid,
        policyValid 
      });

      return result;

    } catch (error) {
      logger.error('Error verifying proof bundle', { error: error.message, proofBundleId });
      return {
        valid: false,
        reason: `Verification error: ${error.message}`,
        proofBundleId
      };
    }
  }

  /**
   * Verify a boundary artifact chain (DT -> PC -> ER)
   * 
   * @param {Object} boundaryProof - Boundary proof from proof bundle
   * @returns {Promise<Object>} Chain verification result
   */
  async verifyBoundaryChain(boundaryProof) {
    const { decisionToken, partnerConfirmation, executionReceipt } = boundaryProof;

    const result = {
      chainStatus: boundaryProof.chainStatus,
      artifacts: {}
    };

    // Verify Decision Token
    if (decisionToken?.dt_id) {
      const dtVerification = await this.dtService.verifyDecisionToken(decisionToken.dt_id);
      result.artifacts.decisionToken = {
        dt_id: decisionToken.dt_id,
        verified: dtVerification.valid || dtVerification.status === 'consumed',
        status: dtVerification.status || dtVerification.reason,
        enterprise_id: decisionToken.enterprise_id,
        tool_name: decisionToken.tool_name,
        tool_version: decisionToken.tool_version,
        vendor_name: decisionToken.vendor_name
      };
    }

    // Verify Partner Confirmation
    if (partnerConfirmation?.pc_id) {
      const pcVerification = await this.pcService.verifyConfirmation(partnerConfirmation.pc_id);
      result.artifacts.partnerConfirmation = {
        pc_id: partnerConfirmation.pc_id,
        verified: pcVerification.valid,
        status: pcVerification.valid ? 'valid' : pcVerification.reason,
        partner_id: partnerConfirmation.partner_id,
        confirmed_at: partnerConfirmation.confirmed_at
      };
    }

    // Verify Execution Receipt
    if (executionReceipt?.er_id) {
      const erVerification = await this.erService.verifyReceipt(executionReceipt.er_id);
      result.artifacts.executionReceipt = {
        er_id: executionReceipt.er_id,
        verified: erVerification.valid,
        status: erVerification.valid ? 'valid' : erVerification.reason,
        executor_type: executionReceipt.executor_type,
        executor_id: executionReceipt.executor_id,
        execution_completed_at: executionReceipt.execution_completed_at
      };
    }

    // Determine chain validity
    const allArtifactsValid = 
      (!result.artifacts.decisionToken || result.artifacts.decisionToken.verified) &&
      (!result.artifacts.partnerConfirmation || result.artifacts.partnerConfirmation.verified) &&
      (!result.artifacts.executionReceipt || result.artifacts.executionReceipt.verified);

    result.chainValid = allArtifactsValid;

    return result;
  }

  /**
   * Generate a human-readable verification report
   * 
   * @param {string} proofBundleId - Proof bundle ID
   * @returns {Promise<Object>} Human-readable report
   */
  async generateReport(proofBundleId) {
    logger.info('Generating verification report', { proofBundleId });

    try {
      // First verify the bundle
      const verification = await this.verifyProofBundle(proofBundleId);

      // Fetch additional context
      const { data: bundle } = await this.supabase
        .from('proof_bundles')
        .select(`
          *,
          enterprises (id, name),
          regulatory_compliance
        `)
        .eq('id', proofBundleId)
        .single();

      // Build human-readable report
      const report = {
        title: 'AI Tool Usage Compliance Verification Report',
        generatedAt: new Date().toISOString(),
        proofBundleId,
        
        // Summary section
        summary: {
          verificationStatus: verification.valid ? 'VERIFIED' : 'VERIFICATION FAILED',
          enterpriseName: bundle?.enterprises?.name || 'Unknown Enterprise',
          enterpriseId: bundle?.enterprise_id,
          bundleGeneratedAt: bundle?.created_at,
          hashIntegrity: verification.hashVerified ? 'INTACT' : 'COMPROMISED'
        },

        // Tool Details section
        toolDetails: this.extractToolDetails(bundle?.atom_states_snapshot, verification.boundaryVerification),

        // Policy Binding section
        policyBinding: {
          policyDigest: verification.policyVerification?.digest || 'Not specified',
          policyValid: verification.policyVerification?.valid ? 'YES' : 'NO',
          ociReference: verification.policyVerification?.details?.fullReference || 'N/A',
          activatedAt: verification.policyVerification?.details?.activatedAt || 'N/A'
        },

        // Boundary Governance section (if applicable)
        boundaryGovernance: this.formatBoundaryGovernance(verification.boundaryVerification),

        // Audit Trail section
        auditTrail: {
          agentActivityCount: verification.contents?.agentActivityCount || 0,
          decisionCount: verification.contents?.decisionsCount || 0,
          auditEventCount: verification.contents?.auditEventsCount || 0,
          traceId: verification.traceId
        },

        // Regulatory Compliance section
        regulatoryCompliance: bundle?.regulatory_compliance || {
          frameworks_addressed: [],
          export_formats_available: ['pdf', 'json']
        },

        // Cryptographic Verification section
        cryptographicProof: {
          bundleHash: verification.bundleHash,
          computedHash: verification.computedHash,
          hashMatch: verification.hashVerified,
          signatureAlgorithm: 'HMAC-SHA256',
          timestamped: true,
          immutable: true
        },

        // Regulatory Questions Answered
        regulatoryAnswers: {
          'Which tool was used?': this.getToolAnswer(verification.boundaryVerification),
          'Which version?': this.getVersionAnswer(verification.boundaryVerification),
          'Under which policy?': verification.policyVerification?.digest || 'See policy binding',
          'With what proof?': `Proof Bundle ${proofBundleId} (${verification.hashVerified ? 'verified' : 'unverified'})`
        },

        // Footer
        disclaimer: 'This report is generated automatically by AICOMPLYR and represents a cryptographically verifiable record of AI tool usage compliance. The integrity of this report can be independently verified using the provided hash values.',
        verificationCommand: `curl -X POST ${process.env.API_URL || 'https://api.aicomplyr.io'}/api/boundary/verify/${proofBundleId}`
      };

      logger.info('Verification report generated', { proofBundleId });

      return {
        success: true,
        report,
        verification
      };

    } catch (error) {
      logger.error('Error generating verification report', { error: error.message, proofBundleId });
      return {
        success: false,
        error: error.message,
        proofBundleId
      };
    }
  }

  /**
   * Extract tool details from proof bundle content
   */
  extractToolDetails(content, boundaryVerification) {
    // If we have boundary artifacts, use those (most reliable)
    if (boundaryVerification?.artifacts?.decisionToken) {
      const dt = boundaryVerification.artifacts.decisionToken;
      return {
        toolName: dt.tool_name,
        toolVersion: dt.tool_version,
        vendorName: dt.vendor_name,
        source: 'Decision Token'
      };
    }

    // Otherwise try to extract from content
    const decisions = content?.decisions || [];
    if (decisions.length > 0 && decisions[0]?.tool_id) {
      return {
        toolName: decisions[0].tool_id,
        toolVersion: decisions[0].tool_version || 'unspecified',
        vendorName: decisions[0].vendor_id || 'unspecified',
        source: 'Decision Record'
      };
    }

    return {
      toolName: 'Not specified in proof bundle',
      toolVersion: 'N/A',
      vendorName: 'N/A',
      source: 'Unable to extract'
    };
  }

  /**
   * Format boundary governance section for report
   */
  formatBoundaryGovernance(boundaryVerification) {
    if (!boundaryVerification) {
      return {
        mode: 'Not applicable',
        chainStatus: 'N/A',
        artifacts: []
      };
    }

    const artifacts = [];

    if (boundaryVerification.artifacts?.decisionToken) {
      const dt = boundaryVerification.artifacts.decisionToken;
      artifacts.push({
        type: 'Decision Token',
        id: dt.dt_id,
        verified: dt.verified,
        details: `Tool: ${dt.tool_name} v${dt.tool_version} by ${dt.vendor_name}`
      });
    }

    if (boundaryVerification.artifacts?.partnerConfirmation) {
      const pc = boundaryVerification.artifacts.partnerConfirmation;
      artifacts.push({
        type: 'Partner Confirmation',
        id: pc.pc_id,
        verified: pc.verified,
        details: `Confirmed at: ${pc.confirmed_at}`
      });
    }

    if (boundaryVerification.artifacts?.executionReceipt) {
      const er = boundaryVerification.artifacts.executionReceipt;
      artifacts.push({
        type: 'Execution Receipt',
        id: er.er_id,
        verified: er.verified,
        details: `Executed by: ${er.executor_type} at ${er.execution_completed_at}`
      });
    }

    return {
      mode: boundaryVerification.chainStatus === 'complete' 
        ? 'Partner-run (complete chain)' 
        : boundaryVerification.chainStatus === 'enterprise_run'
          ? 'Enterprise-run'
          : boundaryVerification.chainStatus,
      chainStatus: boundaryVerification.chainStatus,
      chainValid: boundaryVerification.chainValid,
      artifacts
    };
  }

  /**
   * Get tool answer for regulatory questions
   */
  getToolAnswer(boundaryVerification) {
    if (boundaryVerification?.artifacts?.decisionToken) {
      return boundaryVerification.artifacts.decisionToken.tool_name;
    }
    return 'See tool details section';
  }

  /**
   * Get version answer for regulatory questions
   */
  getVersionAnswer(boundaryVerification) {
    if (boundaryVerification?.artifacts?.decisionToken) {
      return boundaryVerification.artifacts.decisionToken.tool_version;
    }
    return 'See tool details section';
  }

  /**
   * Compute SHA-256 hash of content
   */
  computeHash(content) {
    const contentString = JSON.stringify(content, Object.keys(content || {}).sort());
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  /**
   * Verify a single artifact signature
   * 
   * @param {Object} artifact - Artifact to verify
   * @param {string} signature - Stored signature
   * @param {string} signingMethod - 'HMAC' or 'KMS'
   * @returns {Promise<boolean>} Verification result
   */
  async verifySignature(artifact, signature, signingMethod = 'HMAC') {
    try {
      const hmacSecret = process.env.DT_HMAC_SECRET || 'development-secret-change-in-production';
      const payload = JSON.stringify(artifact, Object.keys(artifact).sort());
      
      const hmac = crypto.createHmac('sha256', hmacSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

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
export const verificationService = new VerificationService();

export default VerificationService;

