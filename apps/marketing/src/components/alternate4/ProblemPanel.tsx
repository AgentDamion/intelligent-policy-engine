import React, { useEffect, useRef } from 'react';
import { manifestoContent } from '@/content/alternate4Manifesto';
import { trackEvent, Events } from '@/utils/analytics';

export const ProblemPanel = () => {
  const { problemPanel } = manifestoContent;
  const panelRef = useRef<HTMLDivElement>(null);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start dwell timer
            dwellTimerRef.current = setTimeout(() => {
              trackEvent(Events.PROBLEM_PANEL_DWELL);
            }, 5000);
          } else {
            // Clear timer if user leaves
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

  return (
    <div 
      ref={panelRef}
      className="flex-1 bg-manifesto-problem text-white flex items-center justify-center px-6 sm:px-8 lg:px-16 animate-panel-enter-left"
    >
      <div className="max-w-2xl">
        {/* Headline */}
        <h1 className="font-manifesto text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          {problemPanel.headline}
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
          {problemPanel.subhead}
        </p>

        {/* Microproof Strip */}
        <div className="space-y-4 pt-8 border-t border-white/20">
          {problemPanel.microproofStrip.map((proof, index) => (
            <div key={index} className="flex items-baseline gap-3">
              <span className="text-manifesto-seam font-solution font-bold text-2xl">
                {proof.stat}
              </span>
              <span className="text-white/70 text-sm">
                {proof.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
