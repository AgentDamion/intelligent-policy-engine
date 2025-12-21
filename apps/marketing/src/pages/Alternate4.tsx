import React, { useEffect } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { ManifestoHero } from '@/components/alternate4/ManifestoHero';
import { Day1Outcomes } from '@/components/alternate4/Day1Outcomes';
import { MeasuredImpactStats } from '@/components/alternate4/MeasuredImpactStats';
import { OneSimpleFlow } from '@/components/alternate4/OneSimpleFlow';
import { WorkflowTemplatesPreview } from '@/components/alternate4/WorkflowTemplatesPreview';
import { TestimonialSection } from '@/components/alternate4/TestimonialSection';
import { MeetVERASection } from '@/components/alternate4/MeetVERASection';
import { EnterpriseBadges } from '@/components/alternate4/EnterpriseBadges';
import { FinalCTASection } from '@/components/alternate4/FinalCTASection';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';

const Alternate4 = () => {
  useEffect(() => {
    // Update page title
    document.title = 'The Ungoverned Seam Is Where Your AI Risk Lives | AIComplyr';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Enterprises govern AI inside the firewall—but partner work happens outside it. AIComplyr is the governance layer at the Enterprise-Partner boundary. Policy in, proof out.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      <ManifestoHero />
      <MeasuredImpactStats />
      <Day1Outcomes />
      <OneSimpleFlow />
      <WorkflowTemplatesPreview />
      <TestimonialSection />
      <MeetVERASection />
      <EnterpriseBadges />
      <FinalCTASection />
      <BoundaryFooter />
    </div>
  );
};

export default Alternate4;
