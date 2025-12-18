import React from 'react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { howItWorksContent } from '@/content/howItWorksContent';
import { trackEvent, Events } from '@/utils/analytics';

export const TrustSection = () => {
  const { trust, finalCta } = howItWorksContent;
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 font-solution">
          {trust.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* We Track */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-solution">{trust.weTrack.title}</h3>
            </div>
            
            <ul className="space-y-3">
              {trust.weTrack.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* We Don't Touch */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-xl font-bold font-solution">{trust.weDontTouch.title}</h3>
            </div>
            
            <ul className="space-y-3">
              {trust.weDontTouch.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Final CTA */}
        <div className="bg-card rounded-lg p-8 text-center border border-border">
          <p className="text-lg font-semibold mb-6">
            {finalCta.question}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => trackEvent(Events.CTA_PRIMARY_MANIFESTO_CLICKED, { 
                location: 'trust-section-primary',
                label: finalCta.primaryButton.label 
              })}
            >
              <Link to={finalCta.primaryButton.href}>
                {finalCta.primaryButton.label}
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost"
              className="group"
              onClick={() => trackEvent(Events.CTA_SECONDARY_MANIFESTO_CLICKED, { 
                location: 'trust-section-secondary',
                label: finalCta.secondaryAction.text 
              })}
            >
              <Link to={finalCta.secondaryAction.href} className="flex items-center gap-2">
                {finalCta.secondaryAction.text}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
