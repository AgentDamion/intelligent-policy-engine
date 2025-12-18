import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';

export function ApprovalComparisonSection() {
  const { approvalComparison } = alternate2ContentNew;

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-700 mb-6">
            {approvalComparison.header}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Left Card - Warning */}
          <Card className="relative bg-coral-100 border-coral-500/20 rounded-2xl" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="p-8">
              <div className="absolute top-4 right-4">
                <AlertTriangle className="w-6 h-6 text-coral-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-700 mb-6">
                {approvalComparison.leftCard.title}
              </h3>
              
              <div className="space-y-4">
                {approvalComparison.leftCard.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-coral-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-600">{bullet}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Success */}
          <Card className="relative bg-mint-50 border-mint-500/20 rounded-2xl" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="p-8">
              <div className="absolute top-4 right-4">
                <CheckCircle className="w-6 h-6 text-mint-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-700 mb-6">
                {approvalComparison.rightCard.title}
              </h3>
              
              <div className="space-y-4">
                {approvalComparison.rightCard.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-mint-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">{bullet}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          {approvalComparison.badges.map((badge, index) => (
            <div
              key={index}
              className="px-6 py-3 bg-mint-500 text-white font-bold rounded-full"
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}