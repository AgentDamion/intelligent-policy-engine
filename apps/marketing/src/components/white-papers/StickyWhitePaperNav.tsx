import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scrollToSection } from '@/utils/scrollToSection';
import { BrandLogo } from '@/components/brand/BrandLogo';

const StickyWhitePaperNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'The Problem', id: 'the-problem' },
    { label: 'The Trilogy', id: 'the-trilogy' },
    { label: 'All Resources', id: 'all-resources' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-lg'
          : 'bg-background'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo size="small" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-foreground/80 hover:text-foreground transition-colors font-medium"
                data-track={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => scrollToSection('the-trilogy')}
              data-track="nav-download-series"
            >
              Download Series
            </Button>
            <Button
              onClick={() => navigate('/book-demo')}
              className="bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
              data-track="nav-book-assessment"
            >
              Book Assessment
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  scrollToSection(link.id);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  scrollToSection('the-trilogy');
                  setIsMobileMenuOpen(false);
                }}
              >
                Download Series
              </Button>
              <Button
                className="w-full bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
                onClick={() => navigate('/book-demo')}
              >
                Book Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default StickyWhitePaperNav;
