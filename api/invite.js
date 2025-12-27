import express from 'express';
const router = express.Router();
import pool from '../database/connection.js';
import { checkJwt, requireOrganizationAccess, requirePermission } from './auth/auth0-middleware.js';
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function ensureInviteContextColumn() {
  try {
    await pool.query("ALTER TABLE agency_invitations ADD COLUMN IF NOT EXISTS invite_context JSONB DEFAULT '{}'::jsonb");
  } catch (e) {
    // Non-fatal: log and continue
    console.warn('Unable to ensure invite_context column exists:', e.message);
  }
}

// GET /api/invite/:token
router.get('/:token', async (req, res) => {
  await ensureInviteContextColumn();
  const { token } = req.params;

  try {
    const query = `
      SELECT 
        ai.id AS invitation_id,
        ai.invitation_token,
        ai.expires_at,
        ai.status,
        ai.agency_email,
        ai.agency_name,
        ai.enterprise_org_id,
        o.name AS enterprise_name,
        ai.invite_context
      FROM agency_invitations ai
      LEFT JOIN organizations o ON ai.enterprise_org_id = o.id
      WHERE ai.invitation_token = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [token]);
    const invite = result.rows[0];

    if (!invite) {
      return res.status(404).json({ error: 'Invite token not found.' });
    }

    if (invite.status !== 'pending') {
      return res.status(409).json({ error: 'Invite already used or invalid.', status: invite.status });
    }

    const now = new Date();
    if (invite.expires_at && new Date(invite.expires_at) < now) {
      return res.status(410).json({ error: 'Invite token has expired.' });
    }

    // Extract optional context
    const context = invite.invite_context || {};

    // Respond with a normalized shape the UI can consume
    res.json({
      token: invite.invitation_token,
      invitationId: invite.invitation_id,
      enterpriseOrgId: invite.enterprise_org_id,
      enterpriseName: invite.enterprise_name,
      workspaceId: context.workspaceId || null,
      workspaceName: context.workspaceName || null,
      role: context.role || 'Agency Partner',
      policyScope: context.policyScope || null,
      expiresAt: invite.expires_at
    });
  } catch (error) {
    console.error('Error resolving invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invite
// Create a new invite for an agency partner with context
router.post('/', checkJwt, requireOrganizationAccess, requirePermission('agency:invite'), async (req, res) => {
  try {
    await ensureInviteContextColumn();

    const {
      workspaceId,
      email,
      role = 'Agency Partner',
      policyScope = null,
      expiresAt = null,
      expiresInDays = null,
      agencyName = null
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Invitee email is required' });
    }

    const enterpriseOrgId = req.user.organizationId;

    // Optional workspace validation and name lookup
    let workspaceName = null;
    if (workspaceId) {
      const wsRes = await pool.query('SELECT id, name, organization_id FROM workspaces WHERE id = $1 LIMIT 1', [workspaceId]);
      const ws = wsRes.rows[0];
      if (!ws) {
        return res.status(400).json({ error: 'Workspace not found' });
      }
      if (ws.organization_id && ws.organization_id !== enterpriseOrgId) {
        return res.status(403).json({ error: 'Workspace does not belong to your enterprise' });
      }
      workspaceName = ws.name;
    }

    const inviteContext = {
      workspaceId: workspaceId || null,
      workspaceName,
      role,
      policyScope
    };

    // Check for existing pending invite (not expired) for same email + workspace
    try {
      const dup = await pool.query(`
        SELECT invitation_token, expires_at
        FROM agency_invitations
        WHERE enterprise_org_id = $1
          AND agency_email = $2
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > NOW())
          AND ((invite_context->>'workspaceId') IS NOT DISTINCT FROM $3::text)
        LIMIT 1
      `, [enterpriseOrgId, email, workspaceId || null]);

      if (dup.rows[0]) {
        return res.status(200).json({
          inviteUrl: `${FRONTEND_BASE_URL}/invite/${dup.rows[0].invitation_token}`,
          expiresAt: dup.rows[0].expires_at,
          message: 'Existing invite found'
        });
      }
    } catch (e) {
      // If JSONB filter fails (older DB), skip duplicate check gracefully
      console.warn('Duplicate check skipped:', e.message);
    }

    // Compute expiration
    let computedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (!computedExpiresAt && (expiresInDays || expiresInDays === 0)) {
      const days = Number(expiresInDays) || 0;
      computedExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const insert = await pool.query(`
      INSERT INTO agency_invitations (
        enterprise_org_id, agency_email, agency_name, invited_by, expires_at, invite_context
      ) VALUES (
        $1, $2, $3, $4,
        COALESCE($5::timestamp, NOW() + INTERVAL '7 days'),
        $6::jsonb
      )
      RETURNING id, invitation_token, expires_at
    `, [
      enterpriseOrgId,
      email,
      agencyName,
      req.user.sub,
      computedExpiresAt,
      JSON.stringify(inviteContext)
    ]);

    const record = insert.rows[0];

    res.status(201).json({
      token: record.invitation_token,
      invitationId: record.id,
      enterpriseOrgId,
      enterpriseName: null,
      workspaceId: inviteContext.workspaceId,
      workspaceName: inviteContext.workspaceName,
      role: inviteContext.role,
      policyScope: inviteContext.policyScope,
      expiresAt: record.expires_at,
      inviteUrl: `${FRONTEND_BASE_URL}/invite/${record.invitation_token}`
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

export default router;


