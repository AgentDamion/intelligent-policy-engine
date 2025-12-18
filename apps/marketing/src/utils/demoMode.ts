import { getDemoCredentials, DemoRole } from './demoCredentials';

const DEMO_MODE_KEY = 'demoMode';
const DEMO_ROLE_KEY = 'demoRole';
const PRESENTATION_MODE_KEY = 'presentationMode';

/**
 * Demo Mode Utility - Synthetic Auth (No Email Validation)
 * 
 * IMPORTANT: This uses completely synthetic authentication.
 * - NO real Supabase auth required
 * - NO email validation
 * - Works immediately for demos and testing
 * 
 * Demo mode provides:
 * - Synthetic user sessions (bypasses auth entirely)
 * - Full access to all features via special demo user IDs
 * - Compatible with hardened RLS (special policies for demo IDs)
 * - Keyboard shortcuts for role switching
 */
export const demoMode = {
  isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Disable demo mode in production
    if (import.meta.env.PROD) {
      if (localStorage.getItem(DEMO_MODE_KEY) === 'true') {
        console.error('Demo mode is disabled in production');
        localStorage.removeItem(DEMO_MODE_KEY);
        localStorage.removeItem(DEMO_ROLE_KEY);
      }
      return false;
    }
    
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  },

  enable(): void {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    window.location.reload();
  },

  enableWithRole(role: 'enterprise' | 'partner' | 'vendor' | 'admin'): void {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    // Navigate directly to appropriate dashboard - role inferred from route
    if (role === 'enterprise') {
      window.location.href = '/dashboard';
    } else if (role === 'partner') {
      window.location.href = '/agency/dashboard';
    } else if (role === 'vendor') {
      window.location.href = '/vendor/dashboard';
    } else if (role === 'admin') {
      window.location.href = '/internal/dashboard';
    }
  },

  getDemoRole(): DemoRole | null {
    if (!this.isEnabled()) return null;
    
    // Infer role from current route
    const path = window.location.pathname;
    if (path.startsWith('/internal')) return 'admin' as DemoRole;
    if (path.startsWith('/agency')) return 'partner';
    if (path.startsWith('/vendor')) return 'vendor';
    return 'enterprise'; // default
  },

  getDemoCredentialsForRole(role: DemoRole) {
    return getDemoCredentials(role);
  },

  disable(): void {
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(PRESENTATION_MODE_KEY);
    window.location.reload();
  },

  switchRole(role: 'enterprise' | 'partner' | 'vendor' | 'admin'): void {
    // Just navigate - role is inferred from route
    this.navigateToRoleDashboard(role);
  },

  navigateToRoleDashboard(role: 'enterprise' | 'partner' | 'vendor' | 'admin'): void {
    if (role === 'enterprise') {
      window.location.href = '/dashboard';
    } else if (role === 'partner') {
      window.location.href = '/agency/dashboard';
    } else if (role === 'vendor') {
      window.location.href = '/vendor/dashboard';
    } else if (role === 'admin') {
      window.location.href = '/internal/dashboard';
    }
  },

  isPresentationMode(): boolean {
    return typeof window !== 'undefined' && localStorage.getItem(PRESENTATION_MODE_KEY) === 'true';
  },

  togglePresentationMode(): void {
    const current = this.isPresentationMode();
    localStorage.setItem(PRESENTATION_MODE_KEY, (!current).toString());
    window.dispatchEvent(new Event('presentationModeChanged'));
  },

  getCurrentDemoUrl(): string {
    const role = this.getDemoRole();
    return `${window.location.origin}${window.location.pathname}?demo=${role}`;
  },

  copyDemoUrl(): void {
    const url = this.getCurrentDemoUrl();
    navigator.clipboard.writeText(url);
  },

  checkURLParam(): void {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const demoParam = urlParams.get('demo');
      
      if (demoParam === '1') {
        this.enable();
      } else if (demoParam && ['enterprise', 'partner', 'vendor', 'admin'].includes(demoParam)) {
        this.enableWithRole(demoParam as 'enterprise' | 'partner' | 'vendor' | 'admin');
      }
    }
  },

  initKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Alt key is pressed
      if (!e.altKey) return;

      // Alt + D: Toggle demo mode
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (this.isEnabled()) {
          this.disable();
        } else {
          this.enable();
        }
        return;
      }

      // Only work if demo mode is enabled
      if (!this.isEnabled()) return;

      // Alt + 1: Enterprise
      if (e.key === '1') {
        e.preventDefault();
        this.switchRole('enterprise');
        return;
      }

      // Alt + 2: Partner/Agency
      if (e.key === '2') {
        e.preventDefault();
        this.switchRole('partner');
        return;
      }

      // Alt + 3: Vendor
      if (e.key === '3') {
        e.preventDefault();
        this.switchRole('vendor');
        return;
      }

      // Alt + 4: Admin
      if (e.key === '4') {
        e.preventDefault();
        this.switchRole('admin');
        return;
      }

      // Alt + R: Reload demo data
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        window.location.reload();
        return;
      }

      // Alt + C: Copy demo URL
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.copyDemoUrl();
        // Show toast notification if available
        const event = new CustomEvent('demo-url-copied');
        window.dispatchEvent(event);
        return;
      }

      // Alt + P: Toggle presentation mode
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.togglePresentationMode();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
  }
};

// Synthetic user data for demo mode
export const createDemoUser = (accountType: 'enterprise' | 'partner' | 'vendor' | 'admin' = 'enterprise') => ({
  id: '00000000-0000-0000-0000-000000000demo',
  email: 'demo@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { 
    first_name: 'Demo', 
    last_name: 'User' 
  },
  aud: 'authenticated',
  role: 'authenticated'
});

export const createDemoSession = (user: any) => ({
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user
});

export const createDemoProfile = (accountType?: 'enterprise' | 'partner' | 'vendor' | 'admin') => {
  // Use stored demo role if available, fallback to enterprise
  const role = accountType || demoMode.getDemoRole() || 'enterprise';
  console.log('createDemoProfile - role:', role, 'accountType:', accountType, 'getDemoRole:', demoMode.getDemoRole());
  return {
    id: '00000000-0000-0000-0000-000000000demo',
    account_type: role,
    first_name: 'Demo',
    last_name: 'User',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
    terms_version: '1.0',
    privacy_accepted_at: new Date().toISOString(),
    marketing_consent: false,
    // Gamification fields (Phase 3)
    compliance_streak: 0,
    compliance_streak_best: 0,
    last_compliance_date: null
  };
};

// Enhanced pharmaceutical demo data for agency users
export const createPharmaDemoData = () => ({
  clients: [
    {
      id: '1',
      name: 'Acme Pharmaceuticals',
      enterprise_id: 'demo-pharma-001',
      status: 'active',
      pending_submissions: 8,
      compliance_score: 87,
      last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      tools_count: 23,
      risk_level: 'medium',
      sla_status: 'on_track'
    },
    {
      id: '2', 
      name: 'BioTech Innovation Corp',
      enterprise_id: 'demo-pharma-002',
      status: 'warning',
      pending_submissions: 12,
      compliance_score: 73,
      last_activity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tools_count: 31,
      risk_level: 'high',
      sla_status: 'at_risk'
    },
    {
      id: '3',
      name: 'MediGen Research Labs',
      enterprise_id: 'demo-pharma-003', 
      status: 'active',
      pending_submissions: 3,
      compliance_score: 94,
      last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tools_count: 18,
      risk_level: 'low',
      sla_status: 'on_track'
    }
  ],
  submissions: [
    {
      id: 'demo-sub-001',
      clientId: '1',
      clientName: 'Acme Pharmaceuticals',
      toolName: 'GPT-4 Clinical Data Analysis',
      status: 'pending',
      priority: 'high',
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      slaHours: 48,
      complianceFrameworks: ['21 CFR Part 11', 'GDPR', 'HIPAA'],
      atRisk: false
    },
    {
      id: 'demo-sub-002',
      clientId: '2',
      clientName: 'BioTech Innovation Corp',
      toolName: 'Claude AI Drug Discovery Assistant',
      status: 'under_review',
      priority: 'urgent',
      submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Sarah Chen',
      slaHours: 24,
      complianceFrameworks: ['FDA 21 CFR Part 820', 'ISO 13485'],
      atRisk: true
    },
    {
      id: 'demo-sub-003', 
      clientId: '3',
      clientName: 'MediGen Research Labs',
      toolName: 'Stability AI Molecular Modeling',
      status: 'changes_requested',
      priority: 'medium',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      slaHours: 72,
      complianceFrameworks: ['GxP', 'ICH Guidelines'],
      atRisk: false
    }
  ],
  agencyWorkspace: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'PartnerAgency Alpha',
    enterprise_id: '550e8400-e29b-41d4-a716-446655440002',
    enterprise_name: 'PartnerAgency Alpha',
    role: 'admin'
  }
});