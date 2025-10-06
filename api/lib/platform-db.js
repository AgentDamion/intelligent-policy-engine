// Platform Integration Database Client
// Adapted to your existing Express.js + Supabase pattern

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
);

// Helper to extract enterprise_id from request headers
export function requireEnterpriseId(req) {
  const enterpriseId = req.headers['x-enterprise-id'];
  if (!enterpriseId) {
    throw new Error('Missing enterprise scope: x-enterprise-id header required');
  }
  return enterpriseId;
}

// Helper to get user ID from auth context (adapt to your auth pattern)
export function getUserId(req) {
  // Adapt this to your existing auth middleware
  return req.user?.id || req.user?.sub || 'system';
}