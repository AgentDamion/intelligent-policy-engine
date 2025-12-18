
import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import MetaLoopStatusBadge from '@/components/backend/MetaLoopStatusBadge';
import APISettingsModal from '@/components/settings/APISettingsModal';
import { routes } from '@/lib/routes';
import { BrandLogo } from '@/components/brand/BrandLogo';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigationData = {
    solutions: [
      { name: 'Platform Overview', href: routes.platform, description: 'Complete AI governance solution' },
      { name: 'Policy Builder', href: routes.policySettings, description: 'Create and manage compliance policies' },
      { name: 'Compliance Automation', href: routes.proofCenter, description: 'Automated compliance monitoring' },
    ],
    industries: [
      { name: 'Pharmaceutical', href: routes.industries.pharmaceutical, description: 'FDA compliance and drug development' },
      { name: 'Marketing Services', href: routes.industries.marketingServices, description: 'Agency AI governance and compliance' },
      { name: 'Financial Services', href: '#financial', description: 'Banking and fintech regulations' },
      { name: 'Healthcare', href: '#healthcare', description: 'HIPAA and medical AI compliance' },
    ],
    resources: [
      { name: 'White Papers', href: routes.public.whitePapers, description: 'Research and compliance frameworks' },
      { name: 'Documentation', href: '#docs', description: 'Technical guides and API docs' },
      { name: 'Case Studies', href: '#case-studies', description: 'Real-world implementation stories' },
      { name: 'Compliance Guides', href: '#guides', description: 'Industry-specific compliance resources' },
    ],
    company: [
      { name: 'About', href: routes.about, description: 'Our mission and team' },
      { name: 'Investors', href: routes.investors, description: 'Investment opportunities and company growth' },
      { name: 'Security', href: '#security', description: 'Enterprise security standards' },
      { name: 'Contact', href: routes.contact, description: 'Get in touch with our team' },
    ],
  };

  const DropdownMenuItem = ({ item, onClick }: { item: any; onClick?: () => void }) => (
    item.href.startsWith('/') ? (
      <Link
        to={item.href}
        className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        onClick={onClick}
      >
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
      </Link>
    ) : (
      <a
        href={item.href}
        className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        onClick={onClick}
      >
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
      </a>
    )
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={routes.home}>
              <BrandLogo size="medium" variant="light" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="space-x-2">
                {/* Solutions Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 py-2 bg-transparent hover:bg-accent hover:text-accent-foreground">
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4">
                      <div className="grid gap-2">
                        {navigationData.solutions.map((item) => (
                          <DropdownMenuItem key={item.name} item={item} />
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Industries Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 py-2 bg-transparent hover:bg-accent hover:text-accent-foreground">
                    Industries
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4">
                      <div className="grid gap-2">
                        {navigationData.industries.map((item) => (
                          <DropdownMenuItem key={item.name} item={item} />
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Resources Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 py-2 bg-transparent hover:bg-accent hover:text-accent-foreground">
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4">
                      <div className="grid gap-2">
                        {navigationData.resources.map((item) => (
                          <DropdownMenuItem key={item.name} item={item} />
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Company Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 py-2 bg-transparent hover:bg-accent hover:text-accent-foreground">
                    Company
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4">
                      <div className="grid gap-2">
                        {navigationData.company.map((item) => (
                          <DropdownMenuItem key={item.name} item={item} />
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Premium Standalone */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                  <Link
                    to={routes.premium}
                    className={cn(
                      "h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                      "relative bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 hover:border-yellow-300 text-amber-800 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-amber-100",
                      location.pathname === routes.premium && "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300"
                    )}
                    >
                      Premium
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                        ✨
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* AI Score Standalone */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/ai-acceleration-score"
                      className={cn(
                        "h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none",
                        "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 text-blue-800 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100",
                        location.pathname === "/ai-acceleration-score" && "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300"
                      )}
                    >
                      AI Score
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                        📊
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center space-x-3">
            <MetaLoopStatusBadge />
            <APISettingsModal />
            <Link to={routes.auth}>
              <Button variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                Sign In
              </Button>
            </Link>
            <Link to={routes.auth}>
              <Button variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                Sign Up
              </Button>
            </Link>
            <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-lg">
              Schedule Demo
            </Button>
          </div>

          {/* Mobile CTAs and menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link to={routes.auth}>
              <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                Get Started
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Dropdowns */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Solutions</h3>
                  <div className="space-y-2 pl-4">
                    {navigationData.solutions.map((item) => (
                      <DropdownMenuItem 
                        key={item.name} 
                        item={item} 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Industries</h3>
                  <div className="space-y-2 pl-4">
                    {navigationData.industries.map((item) => (
                      <DropdownMenuItem 
                        key={item.name} 
                        item={item} 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Resources</h3>
                  <div className="space-y-2 pl-4">
                    {navigationData.resources.map((item) => (
                      <DropdownMenuItem 
                        key={item.name} 
                        item={item} 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Company</h3>
                  <div className="space-y-2 pl-4">
                    {navigationData.company.map((item) => (
                      <DropdownMenuItem 
                        key={item.name} 
                        item={item} 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                    ))}
                  </div>
                </div>

                <Link
                  to={routes.premium}
                  className={cn(
                    "block py-2 font-medium transition-colors relative",
                    "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-md px-3 text-amber-800",
                    "flex items-center justify-between",
                    location.pathname === routes.premium && "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Premium</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    ✨
                  </span>
                </Link>

                <Link
                  to="/ai-acceleration-score"
                  className={cn(
                    "block py-2 font-medium transition-colors relative",
                    "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md px-3 text-blue-800",
                    "flex items-center justify-between",
                    location.pathname === "/ai-acceleration-score" && "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>AI Score</span>
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    📊
                  </span>
                </Link>
              </div>

              {/* Mobile CTAs */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Link to={routes.auth} className="w-full">
                  <Button variant="ghost" className="w-full justify-start text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to={routes.auth} className="w-full">
                  <Button variant="outline" className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                    Sign Up
                  </Button>
                </Link>
                <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
