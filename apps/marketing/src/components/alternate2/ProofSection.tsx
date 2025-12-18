import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

export function ProofSection() {
  const [animatedValues, setAnimatedValues] = useState(alternate2Content.proof.metrics.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedValues(prev => prev.map((_, index) => {
        const baseValues = [2.3, 26, 155, 45];
        const variation = Math.random() * 0.1 - 0.05; // ±5% variation
        return baseValues[index] * (1 + variation);
      }));
    }, 3000);

    // Initialize with base values
    setAnimatedValues([2.3, 26, 155, 45]);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            {alternate2Content.proof.header}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {alternate2Content.proof.copy}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {alternate2Content.proof.metrics.map((metric, index) => {
            const icons = [Clock, Zap, TrendingUp, DollarSign];
            const IconComponent = icons[index];
            
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className="w-6 h-6 text-primary" />
                    {metric.live && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-600">LIVE</span>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {metric.value.includes('$') 
                      ? `$${animatedValues[index]}M` 
                      : metric.value.includes('days')
                      ? `${animatedValues[index].toFixed(1)} days`
                      : metric.value.includes('hours')
                      ? `${animatedValues[index]} hours`
                      : animatedValues[index]
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Strip */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {alternate2Content.proof.trustStrip.map((trust, index) => (
            <div key={index} className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">{trust}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-primary-foreground px-8 py-4">
            {alternate2Content.proof.cta}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}