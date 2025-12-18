import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AdminRole = 'founder' | 'marketing' | 'finance' | 'ops';

interface AdminRoleContextType {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
  getRoleConfig: () => RoleConfig;
}

interface RoleConfig {
  title: string;
  description: string;
  emphasizedMetrics: string[];
  hiddenSections: string[];
  primaryActions: string[];
  gradientClass: string;
}

const roleConfigs: Record<AdminRole, RoleConfig> = {
  founder: {
    title: 'Founder View',
    description: 'Executive overview of all business operations',
    emphasizedMetrics: ['mrr', 'arr', 'partners', 'enterprises', 'governance'],
    hiddenSections: [],
    primaryActions: ['invite-enterprise', 'approve-partner', 'configure-billing', 'launch-campaign'],
    gradientClass: 'bg-gradient-to-r from-primary via-brand-teal to-brand-orange'
  },
  marketing: {
    title: 'Marketing View',
    description: 'Sales pipeline and marketing performance focus',
    emphasizedMetrics: ['pipeline', 'attribution', 'campaigns', 'leads'],
    hiddenSections: ['financial-details'],
    primaryActions: ['launch-campaign', 'invite-enterprise'],
    gradientClass: 'bg-gradient-to-r from-brand-coral to-brand-orange'
  },
  finance: {
    title: 'Finance View',
    description: 'Revenue, billing, and financial health tracking',
    emphasizedMetrics: ['mrr', 'arr', 'billing', 'runway', 'invoices'],
    hiddenSections: ['marketing-details'],
    primaryActions: ['configure-billing', 'approve-partner'],
    gradientClass: 'bg-gradient-to-r from-brand-green to-brand-teal'
  },
  ops: {
    title: 'Operations View',
    description: 'Compliance, tools, audits, and system health',
    emphasizedMetrics: ['tools', 'compliance', 'audits', 'system-health', 'governance'],
    hiddenSections: ['sales-details'],
    primaryActions: ['approve-partner', 'configure-billing'],
    gradientClass: 'bg-gradient-to-r from-brand-purple to-primary'
  }
};

const AdminRoleContext = createContext<AdminRoleContextType | undefined>(undefined);

interface AdminRoleProviderProps {
  children: ReactNode;
}

export const AdminRoleProvider: React.FC<AdminRoleProviderProps> = ({ children }) => {
  const [role, setRole] = useState<AdminRole>('founder');

  const getRoleConfig = () => roleConfigs[role];

  return (
    <AdminRoleContext.Provider value={{ role, setRole, getRoleConfig }}>
      {children}
    </AdminRoleContext.Provider>
  );
};

export const useAdminRole = () => {
  const context = useContext(AdminRoleContext);
  if (context === undefined) {
    throw new Error('useAdminRole must be used within an AdminRoleProvider');
  }
  return context;
};