
import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

const Footer = () => {
  const links = {
    platform: [
      { name: 'Features', href: '#features' },
      { name: 'Integrations', href: '#integrations' },
      { name: 'API Documentation', href: '#api' },
      { name: 'Security', href: '#security' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Investors', href: '/investors' },
      { name: 'Press', href: '#press' },
      { name: 'Contact', href: '/contact' }
    ],
    resources: [
      { name: 'Blog', href: '#blog' },
      { name: 'Compliance Guide', href: '#guide' },
      { name: 'Webinars', href: '#webinars' },
      { name: 'Case Studies', href: '#cases' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Cookie Policy', href: '#cookies' },
      { name: 'GDPR', href: '#gdpr' }
    ]
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo size="medium" variant="dark" />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The leading agentic AI compliance platform, trusted by enterprises worldwide to automate governance while maintaining human oversight.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-teal" />
                <span className="text-sm">hello@aicomplyr.io</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-teal" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-teal" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              {links.platform.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-teal transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-teal transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-teal transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-teal transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 aicomplyr.io. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-teal transition-colors duration-200">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-teal transition-colors duration-200">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
