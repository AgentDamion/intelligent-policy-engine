import React, { useEffect } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Users, Shield, Scale, Stethoscope, Palette, Database, FileText, Link2, Zap } from 'lucide-react';
import { boundaryContent } from '@/content/boundaryContent';
import { scrollToSection } from '@/utils/scrollToSection';
import { trackEvent, Events } from '@/utils/analytics';

const iconMap = {
  Building2,
  Users,
  Shield,
  Scale,
  Stethoscope,
  Palette,
  Database,
  FileText,
  Link2,
  Zap
};

const WhoItsFor = () => {
  useEffect(() => {
    document.title = 'Who It\'s For | AIComplyr - Governance for Regulated Teams';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'AIComplyr serves regulated enterprises and their agency partners. One governance layer connecting both sides of the boundary with shared AI tool policies and proof.'
      );
    }
  }, []);

  const content = boundaryContent.whoItsFor;

  const handleCTAClick = (target: string) => {
    trackEvent(Events.CTA_CLICK, { 
      location: 'who_its_for_hero',
      target,
      page: '/who-its-for'
    });
    scrollToSection(target);
  };

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
              {content.hero.label}
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 font-solution">
              {content.hero.headline}
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-8">
              {content.hero.subheadline}
            </p>
            
            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {content.hero.ctas.map((cta, index) => (
                <Button
                  key={index}
                  size="lg"
                  variant={index === 0 ? "default" : "outline"}
                  className="rounded-full min-w-[220px]"
                  onClick={() => handleCTAClick(cta.target)}
                >
                  {cta.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Two-Column Audience Section */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Enterprise Column */}
              <div id="enterprise" className="scroll-mt-24">
                <div className="bg-card border border-border rounded-lg p-8 lg:p-10 h-full">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
                    {content.enterprise.label}
                  </p>
                  <h2 className="text-3xl font-bold text-foreground mb-4 font-solution">
                    {content.enterprise.headline}
                  </h2>
                  <p className="text-base text-foreground/70 mb-8">
                    {content.enterprise.description}
                  </p>
                  
                  {/* Stakeholders */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      This is for:
                    </p>
                    <div className="space-y-3">
                      {content.enterprise.stakeholders.map((stakeholder, idx) => {
                        const Icon = iconMap[stakeholder.icon as keyof typeof iconMap];
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{stakeholder.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      What you get:
                    </p>
                    <ul className="space-y-3">
                      {content.enterprise.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                    <Link to={content.enterprise.cta.href}>{content.enterprise.cta.label}</Link>
                  </Button>
                </div>
              </div>

              {/* Partner Column */}
              <div id="partners" className="scroll-mt-24">
                <div className="bg-card border border-border rounded-lg p-8 lg:p-10 h-full">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
                    {content.partners.label}
                  </p>
                  <h2 className="text-3xl font-bold text-foreground mb-4 font-solution">
                    {content.partners.headline}
                  </h2>
                  <p className="text-base text-foreground/70 mb-8">
                    {content.partners.description}
                  </p>
                  
                  {/* Agency Roles */}
                  <div className="mb-8">
                    <div className="space-y-3">
                      {content.partners.roles.map((role, idx) => {
                        const Icon = iconMap[role.icon as keyof typeof iconMap];
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{role.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      What you get:
                    </p>
                    <ul className="space-y-3">
                      {content.partners.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                    <Link to={content.partners.cta.href}>{content.partners.cta.label}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shared Proof Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-foreground mb-16 font-solution">
              {content.sharedProof.headline}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              {content.sharedProof.pillars.map((pillar, idx) => {
                const Icon = iconMap[pillar.icon as keyof typeof iconMap];
                return (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-foreground/70">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to={content.sharedProof.cta.href}>{content.sharedProof.cta.label}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <BoundaryFooter />
    </div>
  );
};

export default WhoItsFor;
