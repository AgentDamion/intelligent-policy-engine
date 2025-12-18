import React from 'react';
import { Link } from 'react-router-dom';

export const Alternate4Footer = () => {
  return (
    <footer className="bg-manifesto-problem text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="font-solution font-bold text-xl mb-4">
              AIComplyr<span className="text-manifesto-bridge">.io</span>
            </div>
            <p className="text-white/70 text-sm">
              The governance layer at the Enterprise-Partner boundary.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-solution font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/platform" className="text-white/70 hover:text-white transition-colors">
                  Platform
                </Link>
              </li>
              <li>
                <Link to="/proof-center" className="text-white/70 hover:text-white transition-colors">
                  Proof Center
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-solution font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20 text-center text-sm text-white/60">
          © {new Date().getFullYear()} AIComplyr.io. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
