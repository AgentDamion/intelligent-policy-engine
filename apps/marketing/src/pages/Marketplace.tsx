
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import MarketplaceHero from '@/components/marketplace/MarketplaceHero';
import MarketplaceSearch from '@/components/marketplace/MarketplaceSearch';
import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';
import MarketplaceWorkflow from '@/components/marketplace/MarketplaceWorkflow';
import VendorSection from '@/components/marketplace/VendorSection';
import BuyerConfidence from '@/components/marketplace/BuyerConfidence';
import MarketplaceCTA from '@/components/marketplace/MarketplaceCTA';
import Footer from '@/components/Footer';
import { type MarketplaceFilters } from '@/hooks/useMarketplaceTools';

const Marketplace = () => {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    searchTerm: '',
    industries: [],
    compliance: [],
    dataTypes: [],
    agenticVerified: false
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <MarketplaceHero />
      <MarketplaceSearch onFiltersChange={setFilters} />
      <MarketplaceGrid filters={filters} />
      <MarketplaceWorkflow />
      <VendorSection />
      <BuyerConfidence />
      <MarketplaceCTA />
      <Footer />
    </div>
  );
};

export default Marketplace;
