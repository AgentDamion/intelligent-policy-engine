import React from 'react';
import { Button } from '@/components/ui/button';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const Alternate3Hero = () => {
  const { hero } = alternate3Content;

  const handlePrimaryCTA = () => {
    const proofSection = document.getElementById('proof-bundle-spotlight');
    if (proofSection) {
      proofSection.scrollIntoView({ behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: hero.primaryCTA.event }
      }));
    }
  };

  const handleSecondaryCTA = () => {
    const calculatorSection = document.getElementById('proof-calculator');
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: hero.secondaryCTA.event }
      }));
    }
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-br from-brand-warm-white to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 text-foreground">
            {hero.headline}
          </h1>
          
          <p className="text-lg text-foreground/80 mb-6 max-w-2xl mx-auto">
            {hero.subhead}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Button 
              size="lg" 
              onClick={handlePrimaryCTA}
              className="bg-brand-teal hover:bg-brand-teal/90 text-primary-foreground px-8 py-4 text-lg font-semibold focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            >
              {hero.primaryCTA.text}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleSecondaryCTA}
              className="border-border hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            >
              {hero.secondaryCTA.text}
            </Button>
          </div>

          <p className="text-sm text-foreground/80 font-medium">
            {hero.microline}
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-teal rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-brand-coral rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};
