import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code, Shield, FileText, CheckCircle } from 'lucide-react';

export default function MetaLoopExplanation() {
  const timelineSteps = [
    {
      icon: Code,
      title: 'Development',
      description: 'We build new features using AI-powered tools',
      details: 'Every code change, content generation, and system modification is tracked',
      color: 'bg-blue-500'
    },
    {
      icon: Shield,
      title: 'Governance',
      description: 'AI agents evaluate each action against compliance policies',
      details: 'Real-time policy checking against FDA, GDPR, ISO standards',
      color: 'bg-green-500'
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Every decision is automatically documented with citations',
      details: 'Immutable audit trail with regulatory mapping and explanations',
      color: 'bg-purple-500'
    },
    {
      icon: CheckCircle,
      title: 'Proof',
      description: 'Evidence is made publicly available in real-time',
      details: 'What you see on this page - live, verifiable governance proof',
      color: 'bg-orange-500'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            How We Build with Governance
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our meta-loop ensures that building our platform becomes proof of our governance capabilities
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border hidden lg:block transform -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {timelineSteps.map((step, index) => (
              <div key={index} className="relative">
                {/* Timeline connector */}
                {index < timelineSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                
                <Card className="relative z-20 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mx-auto mb-4`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {step.details}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Why This Matters */}
        <div className="mt-20">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Why This Matters for Your Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Badge variant="default" className="mb-3">
                    Regulatory Confidence
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    See exactly how AI governance works in practice, not just theory
                  </p>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="mb-3">
                    Audit Readiness
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Every action is documented with regulatory citations and explanations
                  </p>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="mb-3">
                    Trust & Transparency
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Live proof that responsible AI governance is achievable at scale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}