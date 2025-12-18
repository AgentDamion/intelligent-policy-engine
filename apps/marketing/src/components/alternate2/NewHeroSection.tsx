import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock, Zap, Target, Shield, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { alternate2ContentNew, mockMetrics } from '@/content/alternate2LandingNew';

export function NewHeroSection() {
  const { hero } = alternate2ContentNew;
  
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'days':
        return `${value} days`;
      case 'hours':
        return `${value} hours`;
      case 'percentage':
        return `${value}%`;
      case 'number':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const statIcons = [Clock, Zap, Target, Shield];

  return (
    <section className="relative py-20 lg:py-32" style={{ background: 'var(--gradient-hero)' }}>
      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-700 leading-tight">
                {hero.headline}
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-500 leading-relaxed max-w-2xl">
                {hero.subhead}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-6 text-base rounded-2xl">
                {hero.cta.primary.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="border-slate-700 text-slate-700 hover:bg-slate-50 px-8 py-6 text-base rounded-2xl">
                    {hero.cta.secondary.text}
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {hero.cta.secondary.dropdown.map((item, index) => (
                    <DropdownMenuItem key={index}>
                      <a href={item.link} className="w-full">
                        {item.text}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right: KPI Tiles */}
          <div className="grid grid-cols-2 gap-4">
            {hero.kpiTiles.map((tile, index) => {
              const IconComponent = statIcons[index];
              const value = mockMetrics[tile.valueKey as keyof typeof mockMetrics] as number;
              
              return (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-white/50 rounded-2xl" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="w-6 h-6 text-mint-500" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-mint-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-mint-500">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-slate-700 mb-1">
                      {formatValue(value, tile.format)}
                    </div>
                    
                    <div className="text-sm text-slate-500 mb-2">
                      {tile.label}
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      {tile.sublabel}
                    </div>
                    
                    {/* Mini Sparkline */}
                    <div className="mt-3 h-8 flex items-end gap-1">
                      {mockMetrics.timeseries.map((point, i) => (
                        <div
                          key={i}
                          className="bg-mint-500/30 rounded-sm flex-1"
                          style={{ height: `${(point / Math.max(...mockMetrics.timeseries)) * 100}%` }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}