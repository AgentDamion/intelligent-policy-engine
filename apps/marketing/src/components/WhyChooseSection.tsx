
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Building2, BarChart3, Users, ArrowRight } from 'lucide-react';

const DualPersonaSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Built for both sides of the pharma AI equation
          </h2>
        </div>

        {/* Dual Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Pharma Compliance */}
          <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow bg-card">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-brand-teal/10 rounded-full flex items-center justify-center">
                  <Building className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mb-2">Complete Agency AI Oversight</CardTitle>
              <p className="text-lg font-medium text-primary">For Pharma Compliance Officers</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed text-center">
                See exactly which AI tools your agencies use, with FDA-ready audit trails and real-time compliance monitoring across all external partnerships
              </p>
              
              {/* Proof element - compliance metrics */}
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Agency Compliance Status</span>
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Agencies</span>
                    <span className="font-medium text-foreground">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Compliance Score</span>
                    <span className="font-medium text-primary">98.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">FDA Audit Ready</span>
                    <span className="font-medium text-primary">✓ Yes</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full group" size="lg">
                See Pharma Solution
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Right Column - Agency Operations */}
          <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow bg-card">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-secondary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mb-2">Multi-Client Pharma Compliance</CardTitle>
              <p className="text-lg font-medium text-secondary-foreground">For Marketing Agencies</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed text-center">
                Serve multiple pharma clients efficiently while maintaining perfect compliance. Automated policy harmonization across different client requirements
              </p>
              
              {/* Proof element - multi-client dashboard */}
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Multi-Client Dashboard</span>
                  <Users className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Clients</span>
                    <span className="font-medium text-foreground">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Policy Harmony</span>
                    <span className="font-medium text-secondary-foreground">100%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Efficiency Gain</span>
                    <span className="font-medium text-secondary-foreground">+67%</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full group" size="lg">
                See Agency Solution
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DualPersonaSection;
