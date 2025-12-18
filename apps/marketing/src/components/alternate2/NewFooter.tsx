import React from 'react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function NewFooter() {
  const { footer } = alternate2ContentNew;

  return (
    <footer className="bg-slate-700 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Brand Logo Section */}
        <div className="mb-8">
          <BrandLogo size="large" variant="dark" />
          <p className="text-slate-300 mt-4 max-w-md">
            Automate compliance, accelerate approvals, and always stay in control—with AI copilots that work as fast as you do.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {footer.columns.map((column, index) => (
            <div key={index}>
              <h3 className="font-bold text-lg mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.link}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-600 pt-8 text-center">
          <p className="text-slate-300">{footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}