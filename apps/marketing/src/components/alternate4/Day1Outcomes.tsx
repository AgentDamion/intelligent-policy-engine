import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { manifestoContent } from '@/content/alternate4Manifesto';
import { trackEvent, Events } from '@/utils/analytics';

export const Day1Outcomes = () => {
  const { day1Outcomes } = manifestoContent;
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent(Events.DAY1_OUTCOMES_SEEN);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-solution text-4xl sm:text-5xl font-black text-center mb-16 text-foreground">
          {day1Outcomes.title}
        </h2>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          {/* Enterprise Column */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-manifesto-enterprise/10 border border-manifesto-enterprise/20 rounded-full">
              <span className="text-sm font-solution font-semibold text-manifesto-enterprise">
                For Enterprise
              </span>
            </div>
            
            <h3 className="font-solution text-2xl font-bold text-foreground">
              {day1Outcomes.enterprise.title}
            </h3>

            <div className="space-y-4">
              {day1Outcomes.enterprise.outcomes.map((outcome, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 py-3"
                >
                  <span className="text-muted-foreground line-through font-medium">
                    {outcome.before}
                  </span>
                  <ArrowRight className="w-5 h-5 text-manifesto-enterprise flex-shrink-0" />
                  <span className="text-foreground font-semibold">
                    {outcome.after}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Column */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-manifesto-partner/10 border border-manifesto-partner/20 rounded-full">
              <span className="text-sm font-solution font-semibold text-manifesto-partner">
                For Partners
              </span>
            </div>
            
            <h3 className="font-solution text-2xl font-bold text-foreground">
              {day1Outcomes.partner.title}
            </h3>

            <div className="space-y-4">
              {day1Outcomes.partner.outcomes.map((outcome, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 py-3"
                >
                  <span className="text-muted-foreground line-through font-medium">
                    {outcome.before}
                  </span>
                  <ArrowRight className="w-5 h-5 text-manifesto-partner flex-shrink-0" />
                  <span className="text-foreground font-semibold">
                    {outcome.after}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
