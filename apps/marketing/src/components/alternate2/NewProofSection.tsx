import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { alternate2ContentNew, mockMetrics } from '@/content/alternate2LandingNew';

export function NewProofSection() {
  const { proofSection } = alternate2ContentNew;
  
  const kpiIcons = [Clock, Zap, TrendingUp, DollarSign];

  const formatValue = (valueKey: string, value: number) => {
    switch (valueKey) {
      case 'medianApprovalDays':
        return `${value} days`;
      case 'fastestApprovalHours':
        return `${value} hrs`;
      case 'currentMonthApprovals':
        return value.toString();
      case 'valueUnlockedUsd':
        return `$${(value / 1000000).toFixed(0)}M`;
      default:
        return value.toString();
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-700 mb-6">
            {proofSection.header}
          </h2>
          <p className="text-xl text-slate-500 max-w-4xl mx-auto leading-relaxed">
            {proofSection.copy}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {proofSection.kpis.map((kpi, index) => {
            const IconComponent = kpiIcons[index];
            const value = mockMetrics[kpi.valueKey as keyof typeof mockMetrics] as number;
            
            return (
              <a key={index} href={kpi.link} className="block group">
                <Card className="h-full bg-white hover:bg-mint-50/50 border border-slate-200 hover:border-mint-500/30 rounded-2xl transition-all duration-200 group-hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className="w-6 h-6 text-mint-500" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-mint-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-mint-500">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-slate-700 mb-2">
                      {formatValue(kpi.valueKey, value)}
                    </div>
                    
                    <div className="text-sm text-slate-500">
                      {kpi.label}
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* Verified Chips */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {proofSection.verifiedChips.map((chip, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-mint-50 border border-mint-500/20 rounded-full"
            >
              <div className="w-2 h-2 bg-mint-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">{chip}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="px-8 py-4 bg-transparent border-2 border-mint-500 text-mint-500 hover:bg-mint-500 hover:text-white rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 mx-auto">
            See Live Governance Lab →
          </button>
        </div>
      </div>
    </section>
  );
}