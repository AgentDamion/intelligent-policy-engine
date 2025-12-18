export type OrgType = 'enterprise' | 'partner' | 'both';

export type RoleKey = 'admin' | 'reviewer' | 'partnerLead';

export interface CreateOrgPayload {
  orgName: string;
  region: string;
  emailDomain?: string;
  enableSSO: boolean;
  ssoProvider?: 'google' | 'microsoft' | 'okta';
  orgType: OrgType;
  initialRoles: RoleKey[]; // for the creator
}

export interface SignInPayload {
  email: string;
  password?: string;
  useMagicLink?: boolean;
  remember?: boolean;
}

export interface JoinOrgPayload {
  email: string;
  inviteCode?: string;
}

export interface Session {
  userId: string;
  email: string;
  orgId?: string;
  roles?: RoleKey[];
  token: string;
  mfaRequired?: boolean;
}
