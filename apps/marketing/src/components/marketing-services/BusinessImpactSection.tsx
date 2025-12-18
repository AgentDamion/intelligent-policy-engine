import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Building2, Users, BarChart3, CheckCircle } from 'lucide-react';

const BusinessImpactSection = () => {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const impactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animationTriggered) {
          setAnimationTriggered(true);
        }
      },
      { threshold: 0.3 }
    );

    if (impactRef.current) {
      observer.observe(impactRef.current);
    }

    return () => observer.disconnect();
  }, [animationTriggered]);

  return (
    <section ref={impactRef} className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Turn AI Risk Into <span className="text-teal">Relationship Currency</span>
          </h2>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto">
            Clients want innovation with assurance. aicomplyr.io unifies your entire AI stack — from ChatGPT to your own custom content agents — under verifiable governance. Demonstrate safety, speed approvals, and strengthen client trust in every pitch.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className={`hover:shadow-lg transition-all duration-300 ${animationTriggered ? 'animate-fade-in' : 'opacity-0'}`}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Building2 className="h-6 w-6 text-teal mr-2" />
                One Dashboard for All AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Centralize both commercial and in-house models across clients
              </p>
              <div className="text-center p-4 bg-teal/10 border border-teal/20 rounded">
                <div className="font-bold text-teal text-lg">Third-Party + Home-Grown AI</div>
                <div className="text-xs text-muted-foreground mt-1">Unified governance platform</div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-lg transition-all duration-300 ${animationTriggered ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="h-6 w-6 text-blue mr-2" />
                Faster Client Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Auto-map every tool and agent to relevant client policies
              </p>
              <div className="text-center p-4 bg-blue/10 border border-blue/20 rounded">
                <div className="font-bold text-blue text-lg">–75% approval time</div>
                <div className="text-xs text-muted-foreground mt-1">Average across all clients</div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-lg transition-all duration-300 ${animationTriggered ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <CheckCircle className="h-6 w-6 text-green mr-2" />
                Built-In Proof Packs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export verified audit trails instantly
              </p>
              <div className="text-center p-4 bg-green/10 border border-green/20 rounded">
                <div className="font-bold text-green text-lg">Minutes, not days</div>
                <div className="text-xs text-muted-foreground mt-1">Client-ready documentation</div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-lg transition-all duration-300 ${animationTriggered ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <DollarSign className="h-6 w-6 text-purple mr-2" />
                Sell With Confidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Turn compliance readiness into a premium differentiator
              </p>
              <div className="text-center p-4 bg-purple/10 border border-purple/20 rounded">
                <div className="font-bold text-purple text-lg">+25% premium pricing</div>
                <div className="text-xs text-muted-foreground mt-1">Clients pay for proven sophistication</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-teal hover:bg-teal/90 text-white px-8 py-4">
            <BarChart3 className="mr-2 h-5 w-5" />
            Calculate Your Revenue Impact
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BusinessImpactSection;