import React from 'react';
import { Button } from '@/components/ui/button';

const UrgencySection = () => {
  const scrollToRiskCascade = () => {
    document.getElementById('risk-cascade')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="urgency" className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Two-panel layout: Text on left, Chart on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left panel: Text content */}
          <div>
            <h2 className="text-4xl font-bold mb-4">
              AI Tool Usage Exploded 24× in Four Years
            </h2>
            <p className="text-xl text-white/80 mb-6">
              The average pharmaceutical company now uses <strong className="text-[hsl(var(--brand-teal))]">73 AI tools</strong> 
              {' '}across their marketing operations. But 83% lack automated controls over these tools—
              especially the ones their external agencies use.
            </p>
            <p className="text-lg text-white/70 mb-8">
              This creates three compounding failures that cascade into a compliance crisis:
            </p>
            
            <Button 
              onClick={scrollToRiskCascade}
              className="bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white px-8 py-6 text-lg"
            >
              See the Cascade ↓
            </Button>
          </div>

          {/* Right panel: Chart image */}
          <div>
            <picture>
              <source srcSet="/images/ai-proliferation-chart.webp" type="image/webp" />
              <img 
                src="/images/ai-proliferation-chart.png" 
                alt="AI tools in pharma marketing grew from 3 in 2019 to 73 in 2023"
                className="w-full max-w-[720px] rounded-xl shadow-2xl"
                loading="lazy"
                decoding="async"
                width="720"
                height="420"
              />
            </picture>
          </div>

        </div>

      </div>
    </section>
  );
};

export default UrgencySection;
