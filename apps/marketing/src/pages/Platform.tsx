
import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import PlatformHero from '@/components/platform/PlatformHero';
import PlatformValueProps from '@/components/platform/PlatformValueProps';
import CoreModules from '@/components/platform/CoreModules';
import PlatformWorkflow from '@/components/platform/PlatformWorkflow';
import DeepFeatures from '@/components/platform/DeepFeatures';
import PlatformTestimonial from '@/components/platform/PlatformTestimonial';
import CTASection from '@/components/CTASection';
import NewFooter from '@/components/NewFooter';

const Platform = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <PlatformHero />
      <PlatformValueProps />
      <CoreModules />
      <PlatformWorkflow />
      <DeepFeatures />
      <PlatformTestimonial />
      <CTASection />
      <NewFooter />
    </div>
  );
};

export default Platform;
