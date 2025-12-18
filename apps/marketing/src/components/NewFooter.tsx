import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';

const NewFooter = () => {
  return (
    <footer className="bg-background text-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <BrandLogo size="medium" variant="light" className="mb-4" />
            <p className="text-muted-foreground text-sm">
              The only AI governance platform that proves it works through complete transparency.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/platform" className="text-muted-foreground hover:text-foreground">Platform Overview</Link></li>
              <li><Link to="/policy-settings" className="text-muted-foreground hover:text-foreground">Policy Builder</Link></li>
              <li><Link to="/proof-center" className="text-muted-foreground hover:text-foreground">Proof Center</Link></li>
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Industries</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/industries/pharmaceutical" className="text-muted-foreground hover:text-foreground">Pharmaceutical</Link></li>
              <li><Link to="/industries/marketing-services" className="text-muted-foreground hover:text-foreground">Marketing Agencies</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Financial Services</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 AiComplyr.io. Built using its own governance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default NewFooter;