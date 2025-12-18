import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import ProofCenterHero from '@/components/proof-center/ProofCenterHero';
import RealTimeDashboard from '@/components/proof-center/RealTimeDashboard';
import AuditTrailDeepDive from '@/components/proof-center/AuditTrailDeepDive';
import MetaLoopExplanation from '@/components/proof-center/MetaLoopExplanation';
import InteractiveDemo from '@/components/proof-center/InteractiveDemo';
import EvidenceLibrary from '@/components/proof-center/EvidenceLibrary';
import NewFooter from '@/components/NewFooter';

export default function ProofCenter() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      {/* Hero Section */}
      <ProofCenterHero />

      {/* Section 1: Real-Time Dashboard */}
      <RealTimeDashboard />

      {/* Section 2: Audit Trail Deep Dive */}
      <AuditTrailDeepDive />

      {/* Section 3: Meta-Loop Explanation */}
      <MetaLoopExplanation />

      {/* Section 4: Interactive Demo */}
      <InteractiveDemo />

      {/* Section 5: Evidence Library */}
      <EvidenceLibrary />

      <NewFooter />
    </div>
  );
}