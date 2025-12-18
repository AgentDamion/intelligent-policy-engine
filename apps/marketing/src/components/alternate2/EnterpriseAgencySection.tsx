import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, FileCheck, Settings, Zap, Award, Eye } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

export function EnterpriseAgencySection() {
  const { dualAudience } = alternate2Content;

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {dualAudience.header}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Enterprise Column */}
          <Card className="h-full">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-primary">
                {dualAudience.enterprise.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.enterprise.features[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.enterprise.features[0].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileCheck className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.enterprise.features[1].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.enterprise.features[1].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Settings className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.enterprise.features[2].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.enterprise.features[2].description}
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                {dualAudience.enterprise.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Agency Column */}
          <Card className="h-full">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-primary">
                {dualAudience.agency.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.agency.features[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.agency.features[0].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.agency.features[1].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.agency.features[1].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Eye className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {dualAudience.agency.features[2].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dualAudience.agency.features[2].description}
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                {dualAudience.agency.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}