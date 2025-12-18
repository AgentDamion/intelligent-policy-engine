import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBar, Clipboard, Shield, RotateCw, ArrowRight } from 'lucide-react';
import LiveProofWidget from '@/components/live-proof/LiveProofWidget';

const OperationalProofCenter = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Area */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Don't just take our word for it - see our governance in action
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Real-time evidence of responsible AI governance, updated every 30 seconds
          </p>
        </div>

        {/* Three-Column Proof Display */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Column 1 - Live Dashboard */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center">
                  <ChartBar className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Live Decision Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <LiveProofWidget className="scale-90 transform origin-top" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Real decisions in real-time with regulatory citations
              </p>
              <Button variant="outline" className="w-full group">
                View Live Dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Column 2 - Audit Evidence */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Clipboard className="w-8 h-8 text-secondary-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">FDA-Ready Audit Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8">
                  <Clipboard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sample FDA Audit Report</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">21 CFR Part 11 Compliant</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Downloadable compliance evidence for regulatory reviews
              </p>
              <Button variant="outline" className="w-full group">
                Download Sample FDA Audit
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Column 3 - Regulatory Mapping */}
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Compliance Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">FDA 21 CFR Part 11</span>
                    <span className="text-sm font-bold text-primary">100%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-brand-teal h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Data Integrity Controls</span>
                    <span className="text-green-600 font-medium">95% Complete</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-brand-teal h-2 rounded-full w-[95%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Audit Trail Generation</span>
                    <span className="text-green-600 font-medium">98% Complete</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-brand-teal h-2 rounded-full w-[98%]"></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Complete regulatory framework mapping with citations
              </p>
              <Button variant="outline" className="w-full group">
                View Regulatory Coverage
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Meta-Loop Explanation */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <RotateCw className="w-6 h-6 text-accent" />
            <span className="text-lg font-semibold text-foreground">Meta-Loop Transparency</span>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            What you're seeing: Real governance decisions from building this platform - something no other vendor can show
          </p>
        </div>
      </div>
    </section>
  );
};

export default OperationalProofCenter;