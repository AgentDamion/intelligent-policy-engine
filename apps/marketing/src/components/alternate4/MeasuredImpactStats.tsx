import React from 'react';

const stats = [
  {
    value: '25-80%',
    label: 'faster approvals',
    description: 'Accelerated approval timelines across partner networks from AI policy automation'
  },
  {
    value: '0-95%',
    label: 'faster audits',
    description: 'From weeks to hours by making every AI run instantly verifiable with Proof Bundles'
  },
  {
    value: '0%',
    label: 'trust surprises',
    description: 'Full visibility into what AI tools your agencies use. No more blind spots.'
  }
];

export const MeasuredImpactStats = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase text-center mb-12">
          Measured Impact
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl lg:text-6xl font-bold text-primary mb-2 font-solution">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-foreground mb-3">
                {stat.label}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MeasuredImpactStats;











