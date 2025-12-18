import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const partnerNavItems = [
  { name: 'Dashboard', href: '/agency/dashboard' },
  { name: 'Client Policies', href: '/agency/requirements' },
  { name: 'My Tools', href: '/agency/my-tools' },
  { name: 'Requests & Submissions', href: '/agency/submissions' },
  { name: 'Trust Center', href: '/agency/trust-center' },
  { name: 'Admin', href: '/agency/admin/team' },
  { name: 'Marketplace', href: '/marketplace-dashboard' },
];

export const PartnerSecondaryNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-background">
      <div className="px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {partnerNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/agency/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'relative whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors',
                  'border-b-2 border-transparent',
                  'hover:text-foreground hover:border-muted-foreground/50',
                  isActive
                    ? 'text-foreground border-brand-coral'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-coral to-brand-orange rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};