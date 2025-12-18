import React, { useEffect } from 'react';
import { Alternate3Nav } from '@/components/alternate3/Alternate3Nav';
import { Alternate3Hero } from '@/components/alternate3/Alternate3Hero';
import { MetricsCardsRow } from '@/components/alternate3/MetricsCardsRow';
import { WorkflowRail } from '@/components/alternate3/WorkflowRail';
import { MidPageCTA } from '@/components/alternate3/MidPageCTA';
import { GovernanceApproachSection } from '@/components/alternate3/GovernanceApproachSection';
import { RoleConfigurationSection } from '@/components/alternate3/RoleConfigurationSection';
import { ProofBundleSpotlight } from '@/components/alternate3/ProofBundleSpotlight';
import { ProofSectionCTA } from '@/components/alternate3/ProofSectionCTA';
import { ProofCalculator } from '@/components/alternate3/ProofCalculator';
import { SecurityStrip } from '@/components/alternate3/SecurityStrip';
import { FAQSection } from '@/components/alternate3/FAQSection';
import { FooterCTABand } from '@/components/alternate3/FooterCTABand';
import { Alternate3Footer } from '@/components/alternate3/Alternate3Footer';
import { StickyCTA } from '@/components/alternate3/StickyCTA';

export default function Alternate3() {
  useEffect(() => {
    document.title = 'AI Tool Approval & Compliance Proof | AICOMPLYR';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Prove AI compliance before MLR—document usage, capture attestations, and export signed Proof Bundles. Role-agnostic for Enterprises & Partners; enforcement optional.');
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'AI Tool Approval & Compliance Proof | AICOMPLYR');
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Prove AI compliance before MLR—document usage, capture attestations, and export signed Proof Bundles. Role-agnostic for Enterprises & Partners; enforcement optional.');
    }
  }, []);
  
  return (
    <main 
      className="min-h-screen bg-background" 
      data-variant="LP-B-Proof"
    >
      <Alternate3Nav />
      <Alternate3Hero />
      <MetricsCardsRow />
      <WorkflowRail />
      <MidPageCTA />
      <GovernanceApproachSection />
      <RoleConfigurationSection />
      <ProofBundleSpotlight />
      <ProofSectionCTA />
      <ProofCalculator />
      <SecurityStrip />
      <FAQSection />
      <FooterCTABand />
      <Alternate3Footer />
      <StickyCTA />
    </main>
  );
}
