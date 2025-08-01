// api/auth/auth0-routes.js
const express = require('express');
const router = express.Router();
const { checkJwt, requireRole, requirePermission } = require('./auth0-middleware');
const db = require('../../database/connection');

// Get user profile
router.get('/profile', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    // Get user from database
    const result = await db.query(`
      SELECT u.*, o.name as organization_name 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      WHERE u.auth0_id = $1
    `, [userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        auth0Id: user.auth0_id
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, organization_id } = req.body;
    const result = await db.query(`
      UPDATE users 
      SET name = $1, organization_id = $2, updated_at = NOW()
      WHERE auth0_id = $3
      RETURNING *
    `, [name, organization_id, userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user permissions
router.get('/permissions', checkJwt, (req, res) => {
  const permissions = req.user[`${process.env.AUTH0_AUDIENCE}/permissions`] || [];
  const roles = req.user[`${process.env.AUTH0_AUDIENCE}/roles`] || [];
  res.json({
    success: true,
    permissions,
    roles
  });
});

// Admin: Get all users
router.get('/users', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, u.role, u.organization_id,
             o.name as organization_name, u.created_at
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Update user role
router.put('/users/:userId/role', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const result = await db.query(`
      UPDATE users 
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [role, userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;