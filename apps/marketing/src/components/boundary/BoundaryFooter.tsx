import React from 'react';
import { Link } from 'react-router-dom';
import { boundaryContent } from '@/content/boundaryContent';

export const BoundaryFooter = () => {
  return (
    <footer className="bg-[hsl(220,13%,10%)] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/alternate4" className="text-xl font-bold mb-2 block">
              {boundaryContent.footer.brand}
              <span className="text-primary">.io</span>
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              {boundaryContent.footer.tagline}
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {boundaryContent.footer.product.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {boundaryContent.footer.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-white/50 text-center">
            {boundaryContent.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};
