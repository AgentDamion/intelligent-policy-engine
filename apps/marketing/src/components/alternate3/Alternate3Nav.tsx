import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const Alternate3Nav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { nav } = alternate3Content;

  const handleCTAClick = () => {
    if (nav.cta.event) {
      // Track analytics event
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: nav.cta.event }
      }));
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-brand-teal">AICOMPLYR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {nav.items.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-foreground hover:text-brand-teal transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild onClick={handleCTAClick}>
              <Link to={nav.cta.href}>{nav.cta.text}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-4">
            {nav.items.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block text-sm font-medium text-foreground hover:text-brand-teal transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="w-full" onClick={handleCTAClick}>
              <Link to={nav.cta.href}>{nav.cta.text}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
