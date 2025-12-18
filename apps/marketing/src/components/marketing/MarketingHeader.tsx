import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { publicRoutes } from '@/config/routes.config';
import PersonaToggle from './PersonaToggle';
import ProductMegaMenu from './ProductMegaMenu';
import SimpleDropdown from './SimpleDropdown';
import MobileDrawer from './MobileDrawer';

const MarketingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get routes from centralized config
  const platformRoutes = publicRoutes.filter(route => route.category === 'product');
  const industryRoutes = publicRoutes.filter(route => route.category === 'industry');
  const salesRoutes = publicRoutes.filter(route => route.category === 'sales');
  const companyRoutes = publicRoutes.filter(route => route.category === 'company');

  const productItems = [
    { name: 'Platform Overview', href: '/platform', description: 'Complete AI governance solution', icon: 'Building2' },
    { name: 'Proof Center', href: '/proof-center', description: 'Live compliance demonstrations', icon: 'Shield' },
    { name: 'AI Acceleration Score', href: '/ai-acceleration-score', description: 'Measure your AI readiness', icon: 'Zap' },
  ];

  const industriesItems = industryRoutes.map(route => ({
    name: route.title,
    href: route.path,
    description: route.title === 'Pharmaceutical' ? 'FDA compliance and drug development' : 'Agency AI governance'
  }));


  const companyItems = [
    ...companyRoutes.map(route => ({
      name: route.title,
      href: route.path,
      description: route.title === 'About' ? 'Our mission and team' : 
                   route.title === 'Contact' ? 'Get in touch with us' : 
                   'Plans and pricing options'
    })),
    { name: 'Investors', href: '/investors' as any, description: 'Investment opportunities and company growth' }
  ];

  const resourcesItems = [
    { name: 'White Papers', href: '/white-papers' as any, description: 'Research and compliance frameworks' },
    { name: 'Documentation', href: '#docs' as any, description: 'Technical guides' },
    { name: 'Case Studies', href: '#cases' as any, description: 'Success stories' }
  ];

  return (
    <>
      {/* Fixed header container */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        {/* Eyebrow bar - reserved for alerts and callouts */}
        <div className="h-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            {/* Empty space reserved for future alerts/callouts */}
          </div>
        </div>

        {/* Primary navigation bar */}
        <div className={`transition-all duration-300 ${isScrolled ? 'h-15' : 'h-18'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <BrandLogo size="medium" variant="light" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <ProductMegaMenu productItems={productItems} />
              <SimpleDropdown label="Industries" items={industriesItems} />
              <SimpleDropdown label="Resources" items={resourcesItems} />
              <SimpleDropdown label="Company" items={companyItems} />
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Button asChild variant="ghost" className="text-sm">
                <a href="/auth">Customer Login</a>
              </Button>
              <Button asChild className="bg-brand-teal text-white hover:bg-brand-teal/90 font-medium px-6">
                <a href="/contact">Schedule Demo</a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        productItems={productItems}
        industriesItems={industriesItems}
        resourcesItems={resourcesItems}
        companyItems={companyItems}
      />

      {/* Spacer to push content below fixed header */}
      <div className="h-26" />
    </>
  );
};

export default MarketingHeader;