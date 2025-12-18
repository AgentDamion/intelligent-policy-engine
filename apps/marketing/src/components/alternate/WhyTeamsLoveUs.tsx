import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, Target, FileCheck } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: "10.7x Faster AI Tool Approvals",
    description: "Cut AI tool approval times from 47 days to 4 days with deterministic compliance pipelines. Real-time visibility across all vendors.",
    highlight: "4 days avg"
  },
  {
    icon: Target,
    title: "AI Tool-Native + Proof-Driven",
    description: "The only platform that governs itself—Meta-Loop architecture with recursive compliance. See every AI tool, vendor, and decision in real-time.",
    highlight: "Self-governing"
  },
  {
    icon: FileCheck,
    title: "Cryptographic Proof for Every Decision",
    description: "Immutable audit trails and regulator-ready reports for FDA 21 CFR Part 11, GDPR Article 22, and SOC 2 compliance.",
    highlight: "Audit-ready"
  }
];

const WhyTeamsLoveUs = () => {
  return (
    <section className="py-16 lg:py-24 bg-brand-section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Why Leading Enterprises{' '}
            <span className="text-brand-coral">Choose Us</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The only AI Tool-Native platform with proof-driven governance—demonstrating operational proof, not promises
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Card key={index} className="relative group hover-scale overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground leading-tight">
                    {benefit.title}
                  </h3>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {benefit.description}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
                    {benefit.highlight}
                  </div>
                </CardContent>

                {/* Decorative background element */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-brand-teal/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyTeamsLoveUs;