import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

import { routes } from '@/lib/routes';

const vendorNavItems = [
  { href: routes.vendor.dashboard, label: 'Overview' },
  { href: routes.vendor.tools, label: 'My Tools' },
  { href: routes.vendor.submissions, label: 'Submissions' },
  { href: routes.vendor.promotions, label: 'Promotions' },
  { href: routes.vendor.analytics, label: 'Analytics' },
  { href: routes.vendor.settings, label: 'Settings' },
];

export const VendorSecondaryNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-muted/50">
      <div className="container">
        <div className="flex h-12 items-center space-x-6 overflow-x-auto">
          {vendorNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};