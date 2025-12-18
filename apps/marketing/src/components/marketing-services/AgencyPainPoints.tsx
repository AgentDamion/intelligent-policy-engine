import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const AgencyPainPoints = () => {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animationTriggered) {
          setAnimationTriggered(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [animationTriggered]);

  return (
    <section className="py-16 bg-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            The $100B Agency AI Dilemma
          </h2>
          <div className="space-y-2">
            <p className="text-xl lg:text-2xl text-muted-foreground">
              Every Day You Don't Use AI, Your Competitors Get Further Ahead
            </p>
            <p className="text-xl lg:text-2xl text-red">
              Every Day You Use AI Wrong, You Risk Losing Your Biggest Clients
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <Card className="border-red/20 bg-red/5 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red mr-2" />
                <CardTitle className="text-xl text-red">Client Expectations vs. Reality</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green/10 border border-green/20 rounded-lg">
                <div className="font-semibold text-green">Clients demand:</div>
                <div>"Deliver 50% faster using AI"</div>
              </div>
              <div className="p-4 bg-orange/10 border border-orange/20 rounded-lg">
                <div className="font-semibold text-orange">Clients also demand:</div>
                <div>"Prove every AI decision was compliant"</div>
              </div>
              <div className="p-4 bg-red/10 border border-red/20 rounded-lg">
                <div className="font-semibold text-red">The gap:</div>
                <div>No system to do both simultaneously</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red/20 bg-red/5 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red mr-2" />
                <CardTitle className="text-xl text-red">Multi-Client Complexity Crisis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold">Pfizer's AI policy:</div>
                <div className="text-muted-foreground">No image generation without pre-approval</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">Novartis's AI policy:</div>
                <div className="text-muted-foreground">All content must include AI disclosure</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">J&J's AI policy:</div>
                <div className="text-muted-foreground">Complete audit trail for regulatory submissions</div>
              </div>
              <div className="mt-4 p-3 bg-red/10 border border-red/20 rounded">
                <div className="font-semibold text-red">Your challenge:</div>
                <div className="text-sm">Managing 15+ different policies manually</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red/20 bg-red/5 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red mr-2" />
                <CardTitle className="text-xl text-red">The Competitive Threat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green/10 border border-green/20 rounded">
                <span className="text-sm">Agencies with AI governance:</span>
                <span className="font-bold text-green">+40% RFP wins</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red/10 border border-red/20 rounded">
                <span className="text-sm">Agencies without:</span>
                <span className="font-bold text-red">Losing clients</span>
              </div>
              <div className="p-3 bg-blue/10 border border-blue/20 rounded text-sm">
                <div className="font-semibold text-blue">The reality:</div>
                <div>It's not about sophistication - it's about systems</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red/20 bg-red/5 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red mr-2" />
                <CardTitle className="text-xl text-red">Revenue Risk Scenarios</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-red/10 border border-red/20 rounded">
                <div className="font-semibold text-red">Lost contracts:</div>
                <div className="text-sm">$2M+ client drops agency for "compliance concerns"</div>
              </div>
              <div className="p-3 bg-orange/10 border border-orange/20 rounded">
                <div className="font-semibold text-orange">Scope reduction:</div>
                <div className="text-sm">Client cuts AI work, 30% revenue loss</div>
              </div>
              <div className="p-3 bg-yellow/10 border border-yellow/20 rounded">
                <div className="font-semibold text-yellow">Rate pressure:</div>
                <div className="text-sm">Competitors command 25% premiums</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supporting Statistics */}
        <div ref={statsRef} className="grid md:grid-cols-4 gap-6 text-center">
          <div className="p-6">
            <div className={`text-3xl font-bold text-red mb-2 transition-all duration-1000 ${animationTriggered ? 'animate-pulse' : ''}`}>
              67%
            </div>
            <div className="text-sm text-muted-foreground">
              Of marketing agencies report losing business due to AI compliance uncertainty
            </div>
          </div>
          <div className="p-6">
            <div className={`text-3xl font-bold text-orange mb-2 transition-all duration-1000 ${animationTriggered ? 'animate-pulse' : ''}`}>
              $847K
            </div>
            <div className="text-sm text-muted-foreground">
              Average annual revenue loss from reduced AI capabilities
            </div>
          </div>
          <div className="p-6">
            <div className={`text-3xl font-bold text-blue mb-2 transition-all duration-1000 ${animationTriggered ? 'animate-pulse' : ''}`}>
              43%
            </div>
            <div className="text-sm text-muted-foreground">
              Of pharma companies plan to require AI governance from agencies by 2025
            </div>
          </div>
          <div className="p-6">
            <div className={`text-3xl font-bold text-green mb-2 transition-all duration-1000 ${animationTriggered ? 'animate-pulse' : ''}`}>
              156%
            </div>
            <div className="text-sm text-muted-foreground">
              ROI for agencies investing in compliance capabilities
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgencyPainPoints;