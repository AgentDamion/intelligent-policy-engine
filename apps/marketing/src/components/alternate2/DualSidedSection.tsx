import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText, Cog, Workflow, Shield, Users, Zap, Award, Eye } from 'lucide-react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';

export function DualSidedSection() {
  const { dualSided } = alternate2ContentNew;
  
  const enterpriseIcons = [FileText, Cog, Workflow, Shield];
  const agencyIcons = [Users, Zap, Award, Eye];

  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-700 mb-6">
            {dualSided.header}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Enterprise Card */}
          <Card className="h-full bg-white rounded-2xl" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl text-mint-500 font-bold">
                {dualSided.enterprise.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                {dualSided.enterprise.bullets.map((bullet, index) => {
                  const IconComponent = enterpriseIcons[index];
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-mint-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-mint-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 mb-2">
                          {bullet.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {bullet.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-6 text-base rounded-2xl" size="lg">
                {dualSided.enterprise.cta.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Agency Card */}
          <Card className="h-full bg-white rounded-2xl" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl text-teal-600 font-bold">
                {dualSided.agency.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                {dualSided.agency.bullets.map((bullet, index) => {
                  const IconComponent = agencyIcons[index];
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 mb-2">
                          {bullet.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {bullet.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-6 text-base rounded-2xl" size="lg">
                {dualSided.agency.cta.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}