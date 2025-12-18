import React, { useEffect } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { HowItWorksHero } from '@/components/boundary/HowItWorksHero';
import { FlowDiagram } from '@/components/boundary/FlowDiagram';
import { ProofBundleShowcase } from '@/components/boundary/ProofBundleShowcase';
import { TrustSection } from '@/components/boundary/TrustSection';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';

const HowItWorks = () => {
  useEffect(() => {
    document.title = 'How It Works | AIComplyr - Policy in. Proof out.';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'See how AIComplyr syncs your AI tool policies to partner workspaces and turns every approved AI run into audit-ready proof.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      <main>
        <HowItWorksHero />
        <FlowDiagram />
        <ProofBundleShowcase />
        <TrustSection />
      </main>
      <BoundaryFooter />
    </div>
  );
};

export default HowItWorks;
