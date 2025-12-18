import React from 'react';
import { Link } from 'react-router-dom';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const Alternate3Footer = () => {
  const { footer } = alternate3Content;

  return (
    <footer className="bg-brand-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footer.columns.map((column, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4 text-lg">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.href}
                      className="text-gray-300 hover:text-brand-teal transition-colors text-sm"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Links */}
        <div className="pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-6 justify-center">
              {footer.legal.map((link, index) => (
                <Link 
                  key={index}
                  to={link.href}
                  className="text-sm text-gray-400 hover:text-brand-teal transition-colors"
                >
                  {link.text}
                </Link>
              ))}
              <Link 
                to="/methodology"
                className="text-sm text-gray-400 hover:text-brand-teal transition-colors"
              >
                Calculator Methodology
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              {footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
