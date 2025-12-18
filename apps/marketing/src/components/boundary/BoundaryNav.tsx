import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { boundaryContent } from '@/content/boundaryContent';
import { trackEvent, Events } from '@/utils/analytics';

export const BoundaryNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const handleNavClick = (label: string, href: string) => {
    trackEvent(Events.MANIFESTO_NAV_CLICKED, { label, href, from: location.pathname });
    setMobileMenuOpen(false);
  };
  
  const handleCtaClick = () => {
    trackEvent(Events.CTA_PRIMARY_MANIFESTO_CLICKED, { 
      location: 'boundary-nav',
      from: location.pathname 
    });
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/alternate4" 
            className="text-xl font-bold text-brand-dark font-solution"
            onClick={() => handleNavClick('Logo', '/alternate4')}
          >
            {boundaryContent.navigation.logo}
            <span className="text-primary">.io</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {boundaryContent.navigation.links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => handleNavClick(link.label, link.href)}
              >
                {link.label}
              </Link>
            ))}
            
            <Button 
              asChild 
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCtaClick}
            >
              <Link to={boundaryContent.navigation.cta.href}>
                {boundaryContent.navigation.cta.label}
              </Link>
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {boundaryContent.navigation.links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors px-2 py-1"
                  onClick={() => handleNavClick(link.label, link.href)}
                >
                  {link.label}
                </Link>
              ))}
              
              <Button 
                asChild 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                onClick={handleCtaClick}
              >
                <Link to={boundaryContent.navigation.cta.href}>
                  {boundaryContent.navigation.cta.label}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
