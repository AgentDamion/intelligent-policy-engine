/**
 * Demo User Configuration (Synthetic Auth - No Email Validation Required)
 * 
 * These are NOT real email addresses and do NOT require Supabase auth accounts.
 * Demo mode uses synthetic sessions that bypass authentication entirely.
 * 
 * When RLS policies are hardened, these specific user IDs will have special
 * bypass policies to ensure demo mode continues to work.
 */

export const DEMO_CREDENTIALS = {
  enterprise: {
    email: 'demo-enterprise@demo.local',  // Not a real email
    password: 'demo-only-no-auth-needed',
    userId: '11111111-1111-1111-1111-111111111111',
    displayName: 'Demo Enterprise User',
    accountType: 'enterprise' as const,
    enterprises: [
      '550e8400-e29b-41d4-a716-446655440001', // Acme Pharmaceuticals
      '550e8400-e29b-41d4-a716-446655440002', // Digital Health Agency
    ],
  },
  partner: {
    email: 'demo-partner@demo.local',  // Not a real email
    password: 'demo-only-no-auth-needed',
    userId: '22222222-2222-2222-2222-222222222222',
    displayName: 'Demo Partner User',
    accountType: 'partner' as const,
    enterprises: [
      '550e8400-e29b-41d4-a716-446655440002', // Digital Health Agency
    ],
  },
  vendor: {
    email: 'demo-vendor@demo.local',  // Not a real email
    password: 'demo-only-no-auth-needed',
    userId: '33333333-3333-3333-3333-333333333333',
    displayName: 'Demo Vendor User',
    accountType: 'vendor' as const,
    enterprises: [], // Vendors have limited enterprise access
  },
  admin: {
    email: 'demo-admin@demo.local',  // Not a real email
    password: 'demo-only-no-auth-needed',
    userId: '44444444-4444-4444-4444-444444444444',
    displayName: 'Demo Admin User',
    accountType: 'admin' as const,
    enterprises: [], // Admins have system-wide access
  },
} as const;

export type DemoRole = keyof typeof DEMO_CREDENTIALS;

/**
 * Get demo credentials for a specific role
 */
export function getDemoCredentials(role: DemoRole) {
  return DEMO_CREDENTIALS[role];
}

/**
 * Check if an email is a demo account
 */
export function isDemoAccount(email: string): boolean {
  return Object.values(DEMO_CREDENTIALS).some(cred => cred.email === email);
}

/**
 * Get demo role from email
 */
export function getDemoRoleFromEmail(email: string): DemoRole | null {
  const entry = Object.entries(DEMO_CREDENTIALS).find(
    ([_, cred]) => cred.email === email
  );
  return entry ? (entry[0] as DemoRole) : null;
}

/**
 * Get demo role from user ID
 */
export function getDemoRoleFromUserId(userId: string): DemoRole | null {
  const entry = Object.entries(DEMO_CREDENTIALS).find(
    ([_, cred]) => cred.userId === userId
  );
  return entry ? (entry[0] as DemoRole) : null;
}
