import React from 'react';
import { GlobalNav } from '@/components/alternate2/GlobalNav';
import { AnnouncementRibbon } from '@/components/alternate2/AnnouncementRibbon';
import { NewHeroSection } from '@/components/alternate2/NewHeroSection';
import { ApprovalComparisonSection } from '@/components/alternate2/ApprovalComparisonSection';
import { ProcessRailSection } from '@/components/alternate2/ProcessRailSection';
import { NewProofSection } from '@/components/alternate2/NewProofSection';
import { DualSidedSection } from '@/components/alternate2/DualSidedSection';
import { NewTrustSection } from '@/components/alternate2/NewTrustSection';
import { NewFinalCTASection } from '@/components/alternate2/NewFinalCTASection';
import { NewFooter } from '@/components/alternate2/NewFooter';

export default function Alternate2Landing() {
  return (
    <div className="min-h-screen bg-white">
      <GlobalNav />
      <AnnouncementRibbon />
      <NewHeroSection />
      <ApprovalComparisonSection />
      <ProcessRailSection />
      <NewProofSection />
      <DualSidedSection />
      <NewTrustSection />
      <NewFinalCTASection />
      <NewFooter />
    </div>
  );
}