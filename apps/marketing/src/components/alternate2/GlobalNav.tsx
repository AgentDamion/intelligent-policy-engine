import React from 'react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function GlobalNav() {
  const navItems = [
    { label: "Solutions", href: "/solutions" },
    { label: "Platform", href: "/platform" },
    { label: "Proof Center", href: "/proof-center" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <BrandLogo size="medium" variant="light" />

        {/* Navigation Items */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-700 hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
          Request a demo
        </Button>
      </div>
    </nav>
  );
}