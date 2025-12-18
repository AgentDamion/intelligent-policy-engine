import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { manifestoContent } from '@/content/alternate4Manifesto';
import { trackEvent, Events } from '@/utils/analytics';
import { scrollToSection } from '@/utils/scrollToSection';

export const ManifestoNav = () => {
  const { navigation } = manifestoContent;

  const handleCtaClick = () => {
    trackEvent(Events.CTA_PRIMARY_MANIFESTO_CLICKED, { location: 'nav' });
    scrollToSection('proof-bundle-spotlight');
  };

  const handleNavClick = (label: string) => {
    trackEvent(Events.MANIFESTO_NAV_CLICKED, { label });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center"
            onClick={() => handleNavClick('logo')}
          >
            <span className="text-xl font-solution font-bold text-foreground">
              AIComplyr<span className="text-manifesto-bridge">.io</span>
            </span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => handleNavClick(link.label)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Button 
            onClick={handleCtaClick}
            className="font-solution font-semibold"
          >
            {navigation.cta.label}
          </Button>
        </div>
      </div>
    </nav>
  );
};
