import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import MarketingServicesHero from '@/components/marketing-services/MarketingServicesHero';
import AgencyPainPoints from '@/components/marketing-services/AgencyPainPoints';
import BusinessImpactSection from '@/components/marketing-services/BusinessImpactSection';
import MultiClientComplexity from '@/components/marketing-services/MultiClientComplexity';
import AgencyPlatformFeatures from '@/components/marketing-services/AgencyPlatformFeatures';
import AgencySpecificCTA from '@/components/marketing-services/AgencySpecificCTA';
import AICompetitiveAdvantage from '@/components/marketing-services/AICompetitiveAdvantage';
import ConflictDetectionBehindScenes from '@/components/marketing-services/ConflictDetectionBehindScenes';

const MarketingServices = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <MarketingServicesHero />
      <div id="pain-points">
        <AgencyPainPoints />
      </div>
      <div id="business-impact">
        <BusinessImpactSection />
      </div>
      <div id="multi-client">
        <MultiClientComplexity />
      </div>
      <div id="platform-features">
        <AgencyPlatformFeatures />
      </div>
      <div id="competitive-advantage">
        <AICompetitiveAdvantage />
      </div>
      <div id="detection-behind-scenes">
        <ConflictDetectionBehindScenes />
      </div>
      <div id="cta">
        <AgencySpecificCTA />
      </div>
      <NewFooter />
    </div>
  );
};

export default MarketingServices;