import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  UserCheck,
  Building2,
  Shield,
  Wrench,
  Activity,
  Globe,
  Settings,
  Key,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    title: 'Business Operations',
    items: [
      { label: 'Dashboard', href: '/internal/dashboard', icon: LayoutDashboard },
      { label: 'Sales & Customers', href: '/internal/sales', icon: Users },
      { label: 'Marketing', href: '/internal/marketing', icon: TrendingUp },
      { label: 'Finance & Billing', href: '/internal/finance', icon: DollarSign },
      { label: 'Legal & Compliance', href: '/internal/legal', icon: FileText },
      { label: 'HR & Team', href: '/internal/hr', icon: UserCheck },
    ]
  },
  {
    title: 'Platform Operations',
    items: [
      { label: 'Partner Accounts', href: '/internal/partners', icon: Building2 },
      { label: 'Enterprise Accounts', href: '/internal/enterprises', icon: Shield },
      { label: 'Tool Registry', href: '/internal/tools', icon: Wrench },
      { label: 'Audit Logs', href: '/internal/audits', icon: Activity },
      { label: 'System Health', href: '/internal/system', icon: Globe },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { label: 'API Keys', href: '/internal/api-keys', icon: Key },
      { label: 'Security & Roles', href: '/internal/security', icon: Lock },
      { label: 'Platform Settings', href: '/internal/settings', icon: Settings },
    ]
  }
];

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r bg-card h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-6">
        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};