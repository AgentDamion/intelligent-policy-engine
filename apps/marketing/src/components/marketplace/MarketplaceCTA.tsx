
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MarketplaceCTA = () => {
  return (
    <section className="py-16 lg:py-24 bg-teal text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold mb-6">
          Ready to Find Your Next Trusted AI Solution?
        </h2>
        <p className="text-xl text-teal-100 mb-8 leading-relaxed">
          Sign up to browse the full marketplace, request access, or list your own tool.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link to="/auth">
            <Button size="lg" className="bg-white text-teal hover:bg-gray-100 px-8 py-3">
              Start Free Trial
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
            Become a Vendor
          </Button>
        </div>
        
        <p className="text-teal-200 text-sm">
          Questions? Our agentic copilot is available in chat.
        </p>
      </div>
    </section>
  );
};

export default MarketplaceCTA;
