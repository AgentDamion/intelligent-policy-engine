import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { manifestoContent } from '@/content/alternate4Manifesto';
import { trackEvent, Events } from '@/utils/analytics';
import { scrollToSection } from '@/utils/scrollToSection';

export const SolutionPanel = () => {
  const { solutionPanel } = manifestoContent;
  const panelRef = useRef<HTMLDivElement>(null);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            dwellTimerRef.current = setTimeout(() => {
              trackEvent(Events.SOLUTION_PANEL_DWELL);
            }, 5000);
          } else {
            if (dwellTimerRef.current) {
              clearTimeout(dwellTimerRef.current);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
      observer.disconnect();
    };
  }, []);

  const handlePrimaryCta = () => {
    trackEvent(Events.CTA_PRIMARY_MANIFESTO_CLICKED, { location: 'hero' });
    scrollToSection('proof-bundle-spotlight');
  };

  const handleSecondaryCta = () => {
    trackEvent(Events.CTA_SECONDARY_MANIFESTO_CLICKED, { location: 'hero' });
    window.location.href = '/proof-center';
  };

  return (
    <div 
      ref={panelRef}
      className="flex-1 bg-manifesto-solution flex items-center justify-center px-6 sm:px-8 lg:px-16 animate-panel-enter-right"
    >
      <div className="max-w-2xl">
        {/* Headline */}
        <h1 className="font-solution text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
          {solutionPanel.headline}
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
          {solutionPanel.subhead}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            size="lg"
            onClick={handlePrimaryCta}
            className="font-solution font-semibold text-base"
          >
            Generate a Proof Bundle (2-min demo)
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={handleSecondaryCta}
            className="font-solution font-semibold text-base"
          >
            See Live Proof
          </Button>
        </div>

        {/* Footer Microcopy */}
        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          {solutionPanel.footerMicrocopy}
        </p>
      </div>
    </div>
  );
};
