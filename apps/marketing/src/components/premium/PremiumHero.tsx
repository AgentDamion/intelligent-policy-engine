import React from 'react';
import { Timer, Banknote, ShieldCheck } from 'lucide-react';

const PremiumHero = () => {
  return (
    <section className="relative bg-brand-warm-white overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-40" />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        
        {/* Headline - consistent with main landing page */}
        <h1 className="text-4xl lg:text-6xl font-bold text-brand-dark text-center mb-6 leading-tight font-heading">
          Transform AI Governance Into Your
          <span className="block text-brand-teal">
            Enterprise Advantage
          </span>
        </h1>
        
        {/* Subtitle with generous spacing */}
        <p className="text-xl md:text-2xl text-brand-dark/70 text-center max-w-4xl mx-auto mb-20 font-light">
          Audit faster. Approve smarter. Prove compliance on demand.
        </p>
        
        {/* Flat proof stats - side by side with icons above */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {[
            { number: "60%", label: "Faster Approvals", icon: Timer },
            { number: "$12M+", label: "Saved Per Year", icon: Banknote },
            { number: "99%", label: "Audit Success Rate", icon: ShieldCheck }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-brand-teal rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-black text-brand-dark mb-2">{stat.number}</div>
                <div className="text-lg text-brand-dark/60 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PremiumHero;