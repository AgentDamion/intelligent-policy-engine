import React, { useEffect } from 'react';
import { ProblemPanel } from './ProblemPanel';
import { UngovernedSeam } from './UngovernedSeam';
import { SolutionPanel } from './SolutionPanel';
import { trackEvent, Events } from '@/utils/analytics';

export const ManifestoHero = () => {
  useEffect(() => {
    // Track that the manifesto hero was seen
    trackEvent(Events.MANIFESTO_HERO_SEEN);
  }, []);

  return (
    <section className="h-screen w-full flex flex-col md:flex-row overflow-hidden pt-16">
      {/* Desktop: Side-by-side with vertical seam */}
      <div className="hidden md:flex flex-1">
        <ProblemPanel />
        <UngovernedSeam />
        <SolutionPanel />
      </div>

      {/* Mobile: Stacked with horizontal seam */}
      <div className="flex md:hidden flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <ProblemPanel />
        </div>
        
        {/* Horizontal Seam for Mobile */}
        <div className="h-0.5 bg-manifesto-seam animate-seam-pulse relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-xs font-solution font-semibold text-manifesto-seam whitespace-nowrap px-2 bg-background">
              The Ungoverned Seam
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SolutionPanel />
        </div>
      </div>
    </section>
  );
};
