import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const GovernanceApproachSection = () => {
  const { governanceApproach } = alternate3Content;

  return (
    <section className="pt-8 lg:pt-12 pb-16 lg:pb-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-3 text-foreground">
          {governanceApproach.sectionTitle}
        </h2>
        
        <p className="text-center text-sm text-foreground/70 font-medium mb-2">
          {governanceApproach.caption}
        </p>
        
        <p className="text-center text-xs text-muted-foreground mb-8">
          {governanceApproach.microcopy}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Card - Documentation & Proof */}
          <Card 
            className={`transition-all ${
              governanceApproach.leftCard.highlighted 
                ? 'border-brand-teal border-2 shadow-lg' 
                : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {governanceApproach.leftCard.title}
                </CardTitle>
                <Badge variant="default" className="bg-brand-teal">
                  {governanceApproach.leftCard.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {governanceApproach.leftCard.copy}
              </p>
            </CardContent>
          </Card>

          {/* Right Card - Policy Enforcement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {governanceApproach.rightCard.title}
                </CardTitle>
                <Badge variant="secondary">
                  {governanceApproach.rightCard.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {governanceApproach.rightCard.copy}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {governanceApproach.note}
        </p>
      </div>
    </section>
  );
};
