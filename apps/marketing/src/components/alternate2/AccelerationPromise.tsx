import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, FileText, Route, Eye, CheckCircle, Rocket } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

const stepIcons = [FileText, Route, Eye, CheckCircle, Rocket];

export function AccelerationPromise() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            {alternate2Content.promise.header}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {alternate2Content.promise.copy}
          </p>
        </div>

        {/* Pipeline Visualization */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-5 gap-4 mb-12">
            {alternate2Content.promise.pipeline.steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <div key={step} className="text-center">
                  <div className="relative">
                    <Card className="p-6 border-brand-teal/20 bg-brand-teal/5 hover:bg-brand-teal/10 transition-colors">
                      <Icon className="h-8 w-8 mx-auto text-brand-teal mb-3" />
                      <h3 className="font-semibold text-foreground">{step}</h3>
                    </Card>
                    
                    {index < alternate2Content.promise.pipeline.steps.length - 1 && (
                      <ArrowRight className="absolute -right-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hidden lg:block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Comparison */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-destructive/20 bg-destructive/5">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Traditional Process</h3>
                <div className="text-4xl font-bold text-destructive mb-2">
                  {alternate2Content.promise.pipeline.traditional}
                </div>
                <p className="text-sm text-muted-foreground">Manual, fragmented, slow</p>
              </div>
            </Card>

            <Card className="p-8 border-brand-teal/20 bg-brand-teal/5">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">With aicomplyr.io</h3>
                <div className="text-4xl font-bold text-brand-teal mb-2">
                  {alternate2Content.promise.pipeline.withPlatform}
                </div>
                <p className="text-sm text-muted-foreground">Automated, unified, fast</p>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-primary-foreground px-8 py-4">
            {alternate2Content.promise.cta}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}