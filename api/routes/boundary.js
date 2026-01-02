/**
 * Boundary Governance API Routes
 * 
 * API endpoints for the "Boundary Governed" value proposition:
 * - Decision Token retrieval
 * - Partner Confirmation submission
 * - Execution Receipt submission
 * - Proof verification
 * 
 * These endpoints enable cross-organizational AI tool governance with
 * cryptographic proof of compliant usage.
 */

import express from 'express';
import { logger } from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';
import { DecisionTokenService } from '../services/boundary/decision-token-service.js';
import { PartnerConfirmationService } from '../services/boundary/partner-confirmation-service.js';
import { ExecutionReceiptService } from '../services/boundary/execution-receipt-service.js';
import { VerificationService } from '../services/boundary/verification-service.js';

const router = express.Router();

// Initialize services
const dtService = new DecisionTokenService();
const pcService = new PartnerConfirmationService();
const erService = new ExecutionReceiptService();
const verificationService = new VerificationService();

// ============================================================================
// DECISION TOKEN ENDPOINTS
// ============================================================================

/**
 * GET /api/boundary/decision-token/:dtId
 * 
 * Retrieve Decision Token details for partner confirmation flow.
 * Partners use this to view what they're being asked to confirm.
 */
router.get(
  '/decision-token/:dtId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { dtId } = req.params;
      const user = req.user || {};
      const partnerId = user.enterpriseId || user.organization_id;

      logger.info('Decision Token retrieval request', { dtId, partnerId });

      if (!dtId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Decision Token ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await pcService.getDecisionTokenForConfirmation(dtId, partnerId);

      if (!result.success) {
        const response = errorResponse(
          'DT_RETRIEVAL_FAILED',
          result.reason,
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const response = successResponse(result, {
        endpoint: 'decision-token',
        dtId
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Decision Token retrieval error', { error: error.message });
      const response = errorResponse('DT_RETRIEVAL_ERROR', 'Failed to retrieve Decision Token', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/decision-tokens
 * 
 * List Decision Tokens for the authenticated enterprise (as issuer or partner).
 */
router.get(
  '/decision-tokens',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id;
      const { status, limit = 50, offset = 0 } = req.query;

      logger.info('Decision Tokens list request', { enterpriseId, status });

      if (!enterpriseId) {
        const response = errorResponse(
          'AUTH_REQUIRED',
          'Enterprise context required',
          { statusCode: 401 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const tokens = await dtService.listDecisionTokens(enterpriseId, {
        status,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      const response = successResponse({
        decision_tokens: tokens,
        count: tokens.length,
        enterprise_id: enterpriseId
      }, {
        endpoint: 'decision-tokens',
        filters: { status }
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Decision Tokens list error', { error: error.message });
      const response = errorResponse('DT_LIST_ERROR', 'Failed to list Decision Tokens', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

// ============================================================================
// PARTNER CONFIRMATION ENDPOINTS
// ============================================================================

/**
 * POST /api/boundary/partner-confirm
 * 
 * Submit a Partner Confirmation for a Decision Token.
 * This is the partner's explicit consent to use the authorized tool
 * under the bound policy snapshot.
 */
router.post(
  '/partner-confirm',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        dtId,
        confirmationStatement,
        acceptedControls = []
      } = req.body;

      const user = req.user || {};
      const partnerId = user.enterpriseId || user.organization_id;
      const confirmerUserId = user.id || user.userId;
      const confirmerRole = user.role;

      // Get client info
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.get('User-Agent');

      logger.info('Partner Confirmation request', { dtId, partnerId, confirmerUserId });

      if (!dtId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Decision Token ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      if (!partnerId || !confirmerUserId) {
        const response = errorResponse(
          'AUTH_REQUIRED',
          'Partner context required for confirmation',
          { statusCode: 401 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await pcService.createConfirmation({
        dtId,
        partnerId,
        confirmerUserId,
        confirmerRole,
        confirmationStatement,
        acceptedControls,
        ipAddress,
        userAgent,
        traceId: req.traceId
      });

      const response = successResponse(result, {
        endpoint: 'partner-confirm',
        message: 'Partner Confirmation submitted successfully'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Partner Confirmation error', { error: error.message });
      
      // Check for specific error types
      if (error.message.includes('Invalid Decision Token')) {
        const response = errorResponse('INVALID_DT', error.message, { statusCode: 400 });
        return res.status(response.statusCode).json(response.body);
      }
      
      if (error.message.includes('does not match')) {
        const response = errorResponse('UNAUTHORIZED', error.message, { statusCode: 403 });
        return res.status(response.statusCode).json(response.body);
      }

      const response = errorResponse('CONFIRMATION_FAILED', 'Failed to submit Partner Confirmation', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/partner-confirmations
 * 
 * List Partner Confirmations for the authenticated partner.
 */
router.get(
  '/partner-confirmations',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const partnerId = user.enterpriseId || user.organization_id;
      const { limit = 50, offset = 0 } = req.query;

      logger.info('Partner Confirmations list request', { partnerId });

      if (!partnerId) {
        const response = errorResponse(
          'AUTH_REQUIRED',
          'Partner context required',
          { statusCode: 401 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const confirmations = await pcService.listConfirmations(partnerId, {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      const response = successResponse({
        confirmations: confirmations,
        count: confirmations.length,
        partner_id: partnerId
      }, {
        endpoint: 'partner-confirmations'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Partner Confirmations list error', { error: error.message });
      const response = errorResponse('PC_LIST_ERROR', 'Failed to list Partner Confirmations', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/partner-confirmation/:pcId
 * 
 * Get details of a specific Partner Confirmation.
 */
router.get(
  '/partner-confirmation/:pcId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { pcId } = req.params;

      logger.info('Partner Confirmation retrieval request', { pcId });

      const pc = await pcService.getConfirmation(pcId);

      if (!pc) {
        const response = errorResponse(
          'NOT_FOUND',
          'Partner Confirmation not found',
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const response = successResponse(pc, {
        endpoint: 'partner-confirmation',
        pcId
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Partner Confirmation retrieval error', { error: error.message });
      const response = errorResponse('PC_RETRIEVAL_ERROR', 'Failed to retrieve Partner Confirmation', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * POST /api/boundary/verify-confirmation
 * 
 * Verify the cryptographic validity of a Partner Confirmation.
 */
router.post(
  '/verify-confirmation',
  async (req, res) => {
    try {
      const { pcId } = req.body;

      logger.info('Partner Confirmation verification request', { pcId });

      if (!pcId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Partner Confirmation ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await pcService.verifyConfirmation(pcId);

      const response = successResponse(result, {
        endpoint: 'verify-confirmation',
        verified: result.valid
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Partner Confirmation verification error', { error: error.message });
      const response = errorResponse('VERIFICATION_ERROR', 'Failed to verify Partner Confirmation', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

// ============================================================================
// DECISION TOKEN MANAGEMENT
// ============================================================================

/**
 * POST /api/boundary/revoke-token
 * 
 * Revoke a Decision Token (enterprise only).
 */
router.post(
  '/revoke-token',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { dtId, reason } = req.body;
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id;

      logger.info('Decision Token revocation request', { dtId, enterpriseId });

      if (!dtId || !reason) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Decision Token ID or revocation reason',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      // Verify the requester owns the DT
      const dt = await dtService.getDecisionToken(dtId);
      if (!dt || dt.enterprise_id !== enterpriseId) {
        const response = errorResponse(
          'UNAUTHORIZED',
          'Not authorized to revoke this Decision Token',
          { statusCode: 403 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await dtService.revokeDecisionToken(dtId, reason);

      const response = successResponse(result, {
        endpoint: 'revoke-token',
        message: result.success ? 'Decision Token revoked' : 'Revocation failed'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Decision Token revocation error', { error: error.message });
      const response = errorResponse('REVOCATION_ERROR', 'Failed to revoke Decision Token', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * POST /api/boundary/verify-token
 * 
 * Verify the cryptographic validity of a Decision Token.
 */
router.post(
  '/verify-token',
  async (req, res) => {
    try {
      const { dtId } = req.body;

      logger.info('Decision Token verification request', { dtId });

      if (!dtId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Decision Token ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await dtService.verifyDecisionToken(dtId);

      const response = successResponse(result, {
        endpoint: 'verify-token',
        verified: result.valid
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Decision Token verification error', { error: error.message });
      const response = errorResponse('VERIFICATION_ERROR', 'Failed to verify Decision Token', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

// ============================================================================
// EXECUTION RECEIPT ENDPOINTS
// ============================================================================

/**
 * POST /api/boundary/execution-receipt
 * 
 * Submit an Execution Receipt after executing an authorized AI tool.
 * Supports both enterprise-run and partner-run modes.
 */
router.post(
  '/execution-receipt',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        dtId,
        pcId,
        executorType,
        executionStartedAt,
        executionCompletedAt,
        outcome = {}
      } = req.body;

      const user = req.user || {};
      const executorId = user.enterpriseId || user.organization_id;
      const executorUserId = user.id || user.userId;

      logger.info('Execution Receipt submission', { dtId, executorType, executorId });

      if (!dtId || !executorType || !executionStartedAt) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing required fields: dtId, executorType, executionStartedAt',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      if (!executorId) {
        const response = errorResponse(
          'AUTH_REQUIRED',
          'Executor context required for receipt submission',
          { statusCode: 401 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await erService.submitReceipt({
        dtId,
        pcId,
        executorType,
        executorId,
        executorUserId,
        executionStartedAt: new Date(executionStartedAt),
        executionCompletedAt: executionCompletedAt ? new Date(executionCompletedAt) : null,
        outcome,
        traceId: req.traceId
      });

      const response = successResponse(result, {
        endpoint: 'execution-receipt',
        message: 'Execution Receipt submitted successfully'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Execution Receipt submission error', { error: error.message });
      
      if (error.message.includes('Invalid Decision Token')) {
        const response = errorResponse('INVALID_DT', error.message, { statusCode: 400 });
        return res.status(response.statusCode).json(response.body);
      }
      
      if (error.message.includes('Partner Confirmation required')) {
        const response = errorResponse('PC_REQUIRED', error.message, { statusCode: 400 });
        return res.status(response.statusCode).json(response.body);
      }

      const response = errorResponse('RECEIPT_FAILED', 'Failed to submit Execution Receipt', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/execution-receipts
 * 
 * List Execution Receipts for the authenticated executor.
 */
router.get(
  '/execution-receipts',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const executorId = user.enterpriseId || user.organization_id;
      const { executorType, limit = 50, offset = 0 } = req.query;

      logger.info('Execution Receipts list request', { executorId, executorType });

      if (!executorId) {
        const response = errorResponse(
          'AUTH_REQUIRED',
          'Executor context required',
          { statusCode: 401 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const receipts = await erService.listReceipts(executorId, {
        executorType,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      const response = successResponse({
        receipts: receipts,
        count: receipts.length,
        executor_id: executorId
      }, {
        endpoint: 'execution-receipts'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Execution Receipts list error', { error: error.message });
      const response = errorResponse('ER_LIST_ERROR', 'Failed to list Execution Receipts', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/execution-receipt/:erId
 * 
 * Get details of a specific Execution Receipt.
 */
router.get(
  '/execution-receipt/:erId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { erId } = req.params;

      logger.info('Execution Receipt retrieval request', { erId });

      const er = await erService.getReceipt(erId);

      if (!er) {
        const response = errorResponse(
          'NOT_FOUND',
          'Execution Receipt not found',
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const response = successResponse(er, {
        endpoint: 'execution-receipt',
        erId
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Execution Receipt retrieval error', { error: error.message });
      const response = errorResponse('ER_RETRIEVAL_ERROR', 'Failed to retrieve Execution Receipt', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * POST /api/boundary/verify-receipt
 * 
 * Verify the cryptographic validity of an Execution Receipt.
 */
router.post(
  '/verify-receipt',
  async (req, res) => {
    try {
      const { erId } = req.body;

      logger.info('Execution Receipt verification request', { erId });

      if (!erId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing Execution Receipt ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await erService.verifyReceipt(erId);

      const response = successResponse(result, {
        endpoint: 'verify-receipt',
        verified: result.valid
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Execution Receipt verification error', { error: error.message });
      const response = errorResponse('VERIFICATION_ERROR', 'Failed to verify Execution Receipt', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/proof-chain/:dtId
 * 
 * Get the complete proof chain for a Decision Token.
 * Returns DT -> PC -> ER with chain status.
 */
router.get(
  '/proof-chain/:dtId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { dtId } = req.params;

      logger.info('Proof chain retrieval request', { dtId });

      const result = await erService.getProofChain(dtId);

      if (!result.success) {
        const response = errorResponse(
          'NOT_FOUND',
          result.reason,
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const response = successResponse(result, {
        endpoint: 'proof-chain',
        dtId,
        chainComplete: result.is_complete
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Proof chain retrieval error', { error: error.message });
      const response = errorResponse('CHAIN_ERROR', 'Failed to retrieve proof chain', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

// ============================================================================
// REGULATOR VERIFICATION ENDPOINTS
// ============================================================================

/**
 * GET /api/boundary/verify/:proofBundleId
 * 
 * Verify a proof bundle and return a human-readable compliance report.
 * This endpoint is designed for regulators to validate compliance.
 */
router.get(
  '/verify/:proofBundleId',
  async (req, res) => {
    try {
      const { proofBundleId } = req.params;
      const { format = 'json' } = req.query;

      logger.info('Regulator verification request', { proofBundleId, format });

      const result = await verificationService.generateReport(proofBundleId);

      if (!result.success) {
        const response = errorResponse(
          'VERIFICATION_FAILED',
          result.error,
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      // Return based on format
      if (format === 'html') {
        // Generate simple HTML report for human viewing
        const htmlReport = generateHtmlReport(result.report);
        res.setHeader('Content-Type', 'text/html');
        return res.send(htmlReport);
      }

      const response = successResponse(result.report, {
        endpoint: 'verify',
        proofBundleId,
        verificationStatus: result.verification.valid ? 'VERIFIED' : 'FAILED'
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Regulator verification error', { error: error.message });
      const response = errorResponse('VERIFICATION_ERROR', 'Failed to verify proof bundle', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * POST /api/boundary/verify-bundle
 * 
 * Verify a proof bundle (POST version for programmatic access).
 */
router.post(
  '/verify-bundle',
  async (req, res) => {
    try {
      const { proofBundleId } = req.body;

      logger.info('Proof bundle verification request', { proofBundleId });

      if (!proofBundleId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing proof bundle ID',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await verificationService.verifyProofBundle(proofBundleId);

      const response = successResponse(result, {
        endpoint: 'verify-bundle',
        verified: result.valid
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Proof bundle verification error', { error: error.message });
      const response = errorResponse('VERIFICATION_ERROR', 'Failed to verify proof bundle', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * GET /api/boundary/report/:proofBundleId
 * 
 * Generate a detailed compliance report for a proof bundle.
 */
router.get(
  '/report/:proofBundleId',
  async (req, res) => {
    try {
      const { proofBundleId } = req.params;

      logger.info('Compliance report request', { proofBundleId });

      const result = await verificationService.generateReport(proofBundleId);

      if (!result.success) {
        const response = errorResponse(
          'REPORT_GENERATION_FAILED',
          result.error,
          { statusCode: 404 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const response = successResponse(result.report, {
        endpoint: 'report',
        proofBundleId
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Compliance report error', { error: error.message });
      const response = errorResponse('REPORT_ERROR', 'Failed to generate compliance report', {
        statusCode: 500
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

/**
 * Generate a simple HTML report for human viewing
 */
function generateHtmlReport(report) {
  const verified = report.summary.verificationStatus === 'VERIFIED';
  const statusColor = verified ? '#22c55e' : '#ef4444';
  const statusBg = verified ? '#22c55e20' : '#ef444420';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Tool Usage Compliance Verification Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { color: #22d3ee; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .status-badge { display: inline-block; padding: 0.5rem 1.5rem; border-radius: 9999px; font-weight: bold; font-size: 1.25rem; background: ${statusBg}; color: ${statusColor}; border: 2px solid ${statusColor}; }
    .section { background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .section h2 { color: #22d3ee; font-size: 1rem; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
    .row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #334155; }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; }
    .value { color: #f1f5f9; font-family: monospace; }
    .value.verified { color: #22c55e; }
    .value.failed { color: #ef4444; }
    .artifact { background: #0f172a; border: 1px solid #334155; border-radius: 0.375rem; padding: 1rem; margin-bottom: 0.75rem; }
    .artifact-type { color: #22d3ee; font-weight: 600; }
    .artifact-id { font-family: monospace; font-size: 0.75rem; color: #64748b; }
    .footer { text-align: center; color: #64748b; font-size: 0.75rem; margin-top: 2rem; }
    .footer a { color: #22d3ee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${report.title}</h1>
      <div class="status-badge">${report.summary.verificationStatus}</div>
    </div>

    <div class="section">
      <h2>Summary</h2>
      <div class="row"><span class="label">Enterprise</span><span class="value">${report.summary.enterpriseName}</span></div>
      <div class="row"><span class="label">Generated At</span><span class="value">${new Date(report.generatedAt).toLocaleString()}</span></div>
      <div class="row"><span class="label">Hash Integrity</span><span class="value ${report.summary.hashIntegrity === 'INTACT' ? 'verified' : 'failed'}">${report.summary.hashIntegrity}</span></div>
    </div>

    <div class="section">
      <h2>Tool Details</h2>
      <div class="row"><span class="label">Tool Name</span><span class="value">${report.toolDetails.toolName}</span></div>
      <div class="row"><span class="label">Version</span><span class="value">${report.toolDetails.toolVersion}</span></div>
      <div class="row"><span class="label">Vendor</span><span class="value">${report.toolDetails.vendorName}</span></div>
    </div>

    <div class="section">
      <h2>Policy Binding</h2>
      <div class="row"><span class="label">Policy Digest</span><span class="value">${report.policyBinding.policyDigest}</span></div>
      <div class="row"><span class="label">Policy Valid</span><span class="value ${report.policyBinding.policyValid === 'YES' ? 'verified' : 'failed'}">${report.policyBinding.policyValid}</span></div>
    </div>

    ${report.boundaryGovernance.mode !== 'Not applicable' ? `
    <div class="section">
      <h2>Boundary Governance</h2>
      <div class="row"><span class="label">Mode</span><span class="value">${report.boundaryGovernance.mode}</span></div>
      <div class="row"><span class="label">Chain Status</span><span class="value">${report.boundaryGovernance.chainStatus}</span></div>
      <div class="row"><span class="label">Chain Valid</span><span class="value ${report.boundaryGovernance.chainValid ? 'verified' : 'failed'}">${report.boundaryGovernance.chainValid ? 'YES' : 'NO'}</span></div>
      ${report.boundaryGovernance.artifacts.map(a => `
        <div class="artifact">
          <div class="artifact-type">${a.type}</div>
          <div class="artifact-id">${a.id}</div>
          <div class="row"><span class="label">Verified</span><span class="value ${a.verified ? 'verified' : 'failed'}">${a.verified ? 'YES' : 'NO'}</span></div>
          <div class="row"><span class="label">Details</span><span class="value">${a.details}</span></div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="section">
      <h2>Cryptographic Proof</h2>
      <div class="row"><span class="label">Bundle Hash</span><span class="value">${report.cryptographicProof.bundleHash}</span></div>
      <div class="row"><span class="label">Hash Match</span><span class="value ${report.cryptographicProof.hashMatch ? 'verified' : 'failed'}">${report.cryptographicProof.hashMatch ? 'YES' : 'NO'}</span></div>
      <div class="row"><span class="label">Algorithm</span><span class="value">${report.cryptographicProof.signatureAlgorithm}</span></div>
    </div>

    <div class="section">
      <h2>Regulatory Questions Answered</h2>
      ${Object.entries(report.regulatoryAnswers).map(([q, a]) => `
        <div class="row"><span class="label">${q}</span><span class="value">${a}</span></div>
      `).join('')}
    </div>

    <div class="footer">
      <p>${report.disclaimer}</p>
      <p style="margin-top: 1rem;"><a href="https://aicomplyr.io">Boundary Governed</a> • AI tool usage with proof</p>
    </div>
  </div>
</body>
</html>
  `;
}

export default router;

