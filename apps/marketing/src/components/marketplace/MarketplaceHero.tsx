
import React from 'react';
import { Button } from '@/components/ui/button';

const MarketplaceHero = () => {
  return (
    <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Discover Compliance-Verified AI Tools—All in One Place
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-6 leading-relaxed">
            Browse, compare, and deploy AI solutions already vetted and continuously monitored by agentic AI copilots.
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Every tool listed is mapped to real enterprise policy, audit-backed, and kept up-to-date by our tireless agentic hummingbirds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-teal hover:bg-teal/90 text-white px-8 py-3">
              Request Access
            </Button>
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3">
              Become a Marketplace Vendor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceHero;
