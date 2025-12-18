import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const FooterCTABand = () => {
  const { footerCTA } = alternate3Content;

  const handleCTAClick = (event: string) => {
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event }
    }));
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-r from-brand-dark to-slate-800 text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8">
          {footerCTA.headline}
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
          <Button 
            asChild
            size="lg"
            className="bg-brand-teal hover:bg-brand-teal/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
            onClick={() => handleCTAClick(footerCTA.primaryCTA.event)}
          >
            <Link to={footerCTA.primaryCTA.href}>
              {footerCTA.primaryCTA.text}
            </Link>
          </Button>

          <Button 
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-brand-dark px-8 py-4 text-lg font-semibold"
            onClick={() => handleCTAClick(footerCTA.secondaryCTA.event)}
          >
            <Link to={footerCTA.secondaryCTA.href}>
              {footerCTA.secondaryCTA.text}
            </Link>
          </Button>
        </div>

        <p className="text-sm text-gray-300">
          {footerCTA.smallPrint}
        </p>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-teal rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-brand-coral rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};
