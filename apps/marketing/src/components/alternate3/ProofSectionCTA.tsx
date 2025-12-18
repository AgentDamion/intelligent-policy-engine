import React from 'react';
import { Button } from '@/components/ui/button';
import { scrollToSection } from '@/utils/scrollToSection';

export const ProofSectionCTA = () => {
  const handleClick = () => {
    scrollToSection('proof-bundle-spotlight');
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event: 'cta_proof_section_demo_clicked' }
    }));
  };

  return (
    <section className="py-8 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Button 
          size="lg" 
          onClick={handleClick}
          className="text-lg px-8 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
        >
          Generate a Proof Bundle (2-min demo)
        </Button>
      </div>
    </section>
  );
};
