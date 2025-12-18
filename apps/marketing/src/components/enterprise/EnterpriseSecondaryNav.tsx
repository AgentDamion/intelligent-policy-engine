import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Store,
  Plug,
  Upload,
  Activity,
  FlaskConical,
  Sparkles
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/enterprise/dashboard', icon: LayoutDashboard },
  { label: 'Agentic UI', path: '/agentic?tab=weave', icon: Sparkles },
  { label: 'Governance Inbox', path: '/governance/inbox', icon: Activity },
  { label: 'Policy Sandbox', path: '/enterprise/sandbox', icon: FlaskConical },
  { label: 'Policies', path: '/enterprise/policies', icon: FileText },
  { label: 'Partners', path: '/enterprise/partners', icon: Users },
  { label: 'Tools Registry', path: '/enterprise/tool-intelligence', icon: Package },
  { label: 'Audit & Reports', path: '/enterprise/audit-trail', icon: BarChart3 },
  { label: 'Platform Integrations', path: '/enterprise/platform-integrations', icon: Plug },
  { label: 'Import Policy', path: '/enterprise/import-policy', icon: Upload },
  { label: 'Admin', path: '/enterprise/admin/users', icon: Users },
  { label: 'Marketplace', path: '/enterprise/marketplace-dashboard', icon: Store },
];

interface EnterpriseSecondaryNavProps {
  className?: string;
}

export function EnterpriseSecondaryNav({ className }: EnterpriseSecondaryNavProps) {
  const location = useLocation();

  return (
    <nav className={cn(
      "border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30",
      className
    )}>
      <div className="container mx-auto px-6">
        <div className="flex items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/governance/inbox' && location.pathname.startsWith('/governance'));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200",
                  "border-b-2 border-transparent hover:bg-muted/50",
                  "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                  "after:transition-all after:duration-300",
                  isActive ? [
                    "text-primary bg-primary/5",
                    "after:bg-gradient-to-r after:from-brand-teal after:to-brand-coral"
                  ] : [
                    "text-muted-foreground hover:text-foreground",
                    "after:bg-transparent"
                  ]
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:block">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}