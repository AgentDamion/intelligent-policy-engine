import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

export function ApprovalHellSection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            {alternate2Content.approvalHell.header}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {alternate2Content.approvalHell.copy}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Before - Day 47 */}
          <Card className="p-8 border-destructive/20 bg-destructive/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-destructive" />
                <span className="text-2xl font-bold text-destructive">
                  {alternate2Content.approvalHell.comparison.before.day}
                </span>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                {alternate2Content.approvalHell.comparison.before.status}
              </p>

              {/* Visual timeline */}
              <div className="mt-8 space-y-3">
                {alternate2Content.approvalHell.comparison.before.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-destructive/40" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* After - Day 4 */}
          <Card className="p-8 border-brand-teal/20 bg-brand-teal/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-8 w-8 text-brand-teal" />
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {alternate2Content.approvalHell.comparison.after.day}
                </span>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                {alternate2Content.approvalHell.comparison.after.status}
              </p>

              {/* Visual timeline */}
              <div className="mt-8 space-y-3">
                {alternate2Content.approvalHell.comparison.after.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-brand-teal" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Impact callout */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-brand-teal/10 text-brand-teal px-6 py-3 rounded-full text-lg font-semibold">
            <span>10.75x faster approvals</span>
            <span className="text-brand-teal/60">•</span>
            <span>Zero compliance risk</span>
          </div>
        </div>
      </div>
    </section>
  );
}