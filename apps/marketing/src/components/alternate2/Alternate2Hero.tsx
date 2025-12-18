import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Activity, Clock, Zap, Target, Shield } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

export function Alternate2Hero() {
  const { hero } = alternate2Content;
  const [counter, setCounter] = useState(hero.liveCounter.count);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statIcons = [Clock, Zap, Target, Shield];

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-6 relative">
        {/* Live Counter Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-800">
              {hero.liveCounter.label} <span className="font-bold">{counter.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Side-by-side Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {hero.headline}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {hero.deck}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="text-base px-8 py-6">
                {hero.cta.primary} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button variant="outline" size="lg" className="text-base px-8 py-6">
                {hero.cta.secondary} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right: Stat Tile Group */}
          <div className="grid grid-cols-2 gap-4">
            {hero.statTiles.map((stat, index) => {
              const IconComponent = statIcons[index];
              return (
                <Card key={index} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-brand-teal/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary/10 rounded-full animate-pulse delay-1000"></div>
      </div>
    </section>
  );
}