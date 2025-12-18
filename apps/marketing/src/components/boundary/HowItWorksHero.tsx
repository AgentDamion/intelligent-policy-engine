import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { howItWorksContent } from '@/content/howItWorksContent';
import { trackEvent, Events } from '@/utils/analytics';

export const HowItWorksHero = () => {
  const { hero } = howItWorksContent;
  
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {hero.eyebrow}
            </p>
            
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-2 font-solution">
                {hero.headline}
              </h1>
              <h2 className="text-5xl lg:text-6xl font-bold text-foreground font-solution">
                {hero.subheadline}
              </h2>
            </div>
            
            <p className="text-lg text-foreground/70 max-w-xl">
              {hero.description}
            </p>
            
            <p className="text-sm text-muted-foreground italic">
              {hero.note}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                asChild 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => trackEvent(Events.CTA_PRIMARY_MANIFESTO_CLICKED, { 
                  location: 'hero-primary',
                  label: hero.primaryCta.label 
                })}
              >
                <Link to={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="ghost"
                size="lg"
                className="group"
                onClick={() => trackEvent(Events.CTA_SECONDARY_MANIFESTO_CLICKED, { 
                  location: 'hero-secondary',
                  label: hero.secondaryCta.label 
                })}
              >
                <Link to={hero.secondaryCta.href} className="flex items-center gap-2">
                  {hero.secondaryCta.label}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right: Simple Flow Diagram */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-lg border-2 border-border bg-card flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Policy in</p>
                  <p className="text-sm font-semibold">Enterprise:<br/>Your policies</p>
                </div>
              </div>
            </div>
            
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                aicomplyr.io
              </div>
            </div>
            
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-lg border-2 border-border bg-card flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Proof</p>
                  <p className="text-sm font-semibold">Agency<br/>network. All<br/>compliant.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
