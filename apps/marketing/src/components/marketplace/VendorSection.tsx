
import React from 'react';
import { Button } from '@/components/ui/button';

const VendorSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
          Want to Join the Marketplace?
        </h2>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Showcase your AI solution to top enterprises and agencies.
          Our agentic AI will guide you step-by-step through the compliance process—so you're ready for regulated markets.
        </p>
        
        <Button size="lg" className="bg-teal hover:bg-teal/90 text-white px-8 py-3 mb-6">
          Become a Marketplace Vendor
        </Button>
        
        <p className="text-gray-500 text-sm">
          Get agentic support with every submission, plus a compliance badge trusted by industry leaders.
        </p>
      </div>
    </section>
  );
};

export default VendorSection;
