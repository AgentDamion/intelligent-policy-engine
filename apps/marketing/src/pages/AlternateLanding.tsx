import React, { useState, useEffect } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import AlternateHero from '@/components/alternate/AlternateHero';
import StatsRow from '@/components/alternate/StatsRow';
import GameChanger from '@/components/alternate/GameChanger';
import IntegrationHubCarousel from '@/components/alternate/IntegrationHubCarousel';
import WhyTeamsLoveUs from '@/components/alternate/WhyTeamsLoveUs';
import FinalCTABand from '@/components/alternate/FinalCTABand';
import NewFooter from '@/components/NewFooter';
import EnterpriseAgencyToggle from '@/components/alternate/EnterpriseAgencyToggle';
import { GuidedTour } from '@/components/common/GuidedTour';
import { AccessibilityEnhancements, useAccessibilityShortcuts } from '@/components/common/AccessibilityEnhancements';
import { PerformanceOptimizer } from '@/components/common/PerformanceOptimizer';
import { EnhancedErrorBoundary } from '@/components/common';

const AlternateLanding = () => {
  const [showTour, setShowTour] = useState(false);

  // Enable accessibility shortcuts
  useAccessibilityShortcuts();

  useEffect(() => {
    // Check if tour should be shown (first time visitors)
    const tourCompleted = localStorage.getItem('guided-tour-completed');
    if (!tourCompleted) {
      setTimeout(() => setShowTour(true), 2000);
    }
  }, []);

  const tourSteps = [
    {
      id: 'hero',
      target: '[data-tour="hero"]',
      title: 'Welcome to AI Comply',
      description: 'Your comprehensive AI Tools Compliance, Governance and Management platform. Discover how we help organizations manage their AI tools effectively.',
      position: 'bottom' as const,
      action: 'none' as const
    },
    {
      id: 'stats',
      target: '[data-tour="stats"]',
      title: 'Platform Impact',
      description: 'See how we\'re transforming AI tool governance with automated compliance tracking and risk management.',
      position: 'bottom' as const,
      action: 'none' as const
    }
  ];

  return (
    <EnhancedErrorBoundary context="alternate-landing" level="page">
      <div className="min-h-screen">
        <PerformanceOptimizer autoOptimize={true} />
        
        <MarketingHeader />
        
        <div data-tour="hero">
          <AlternateHero />
        </div>
        
        <div data-tour="stats">
          <StatsRow />
        </div>
        
        <GameChanger />
        
        <EnterpriseAgencyToggle />
        
        <IntegrationHubCarousel />
        <WhyTeamsLoveUs />
        <FinalCTABand />
        <NewFooter />

        {/* Enhanced UX Components */}
        <GuidedTour
          steps={tourSteps}
          isActive={showTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
          storageKey="alternate-landing-tour"
        />
        
        <AccessibilityEnhancements />
      </div>
    </EnhancedErrorBoundary>
  );
};

export default AlternateLanding;