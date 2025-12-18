import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building2, Target, Shield, TrendingUp, ArrowRight } from 'lucide-react';

const AgencyPlatformFeatures = () => {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Compliance That Feels Like a <span className="text-teal">Creative Edge</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            aicomplyr.io was built for the pace of creative operations. Manage internal AI experiments safely, roll out new tools faster, and show verifiable oversight.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Building2 className="h-6 w-6 text-teal mr-2" />
                Home-Grown AI Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Document and link internal models to client policies
              </p>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Register proprietary agents and fine-tuned models
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Track model versions and training data
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Map to client-specific requirements
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="h-6 w-6 text-blue mr-2" />
                Third-Party Tool Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Monitor what's approved or restricted per client
              </p>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Track ChatGPT, Midjourney, Runway, and more
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Client-specific approval status
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Usage analytics and ROI tracking
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Shield className="h-6 w-6 text-green mr-2" />
                Proof Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Create campaign-specific audit snapshots in seconds
              </p>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Per-client, per-tool, per-campaign tracking
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Exportable compliance reports
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Real-time risk scoring
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AgencyPlatformFeatures;