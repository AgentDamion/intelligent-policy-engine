import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Microscope, BarChart3, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConversionFunnelSection = () => {
  const navigate = useNavigate();

  const conversionPaths = [
    {
      id: 'exploratory',
      icon: Microscope,
      title: 'Just Starting Your Evaluation',
      description: 'Not ready to talk yet? Get the complete framework.',
      benefits: [
        'All 3 white papers (PDF)',
        'Implementation checklist',
        'Framework comparison guide',
        'Sample proof bundle template'
      ],
      cta: 'Download Complete Series',
      meta: 'No email required',
      action: () => {},
      trackId: 'funnel-exploratory',
      highlighted: false
    },
    {
      id: 'assessment',
      icon: BarChart3,
      title: 'Ready to See How This Applies to You',
      description: 'Book a complimentary Governance Lab (90 minutes).',
      benefits: [
        'AI tool inventory across your partners',
        'Gap analysis vs. FDA/GDPR requirements',
        'Proof bundle mockup for your use case',
        '90-day implementation roadmap'
      ],
      cta: 'Book Your Governance Lab',
      meta: 'No sales pitch • 4 slots left this month',
      action: () => navigate('/book-demo'),
      trackId: 'funnel-assessment',
      highlighted: true
    },
    {
      id: 'pilot',
      icon: Rocket,
      title: 'Ready to Pilot in Next 60 Days',
      description: 'Apply to the Founding Cohort for priority onboarding.',
      benefits: [
        'Dedicated governance architect',
        'Co-development input on roadmap',
        'Founding pricing locked 24 months',
        'Exclusive peer network'
      ],
      cta: 'Apply to Founding Cohort',
      meta: '5 slots remaining • Closes Feb 28',
      action: () => navigate('/founding-partners'),
      trackId: 'funnel-pilot',
      highlighted: false
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ready to Move from Reading to Implementing?
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the path that matches where you are in your evaluation:
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {conversionPaths.map((path) => {
            const Icon = path.icon;
            return (
              <Card
                key={path.id}
                className={`relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  path.highlighted
                    ? 'border-2 border-[hsl(var(--brand-teal))] bg-teal-50 shadow-xl lg:scale-105'
                    : 'border bg-white'
                }`}
              >
                {path.highlighted && (
                  <>
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0 px-4 py-1">
                      MOST POPULAR
                    </Badge>
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      4 slots left
                    </div>
                  </>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[hsl(var(--brand-teal))]/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-[hsl(var(--brand-teal))]" />
                  </div>
                  <CardTitle className="text-xl mb-2">{path.title}</CardTitle>
                  <CardDescription className="text-base">{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits */}
                  <div className="space-y-3">
                    {path.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--brand-teal))] flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="space-y-2">
                    <Button
                      className={`w-full ${
                        path.highlighted
                          ? 'bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                      onClick={path.action}
                      data-track={path.trackId}
                    >
                      {path.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">{path.meta}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            Questions? Email us:{' '}
            <a href="mailto:governance@aicomplyr.io" className="text-[hsl(var(--brand-teal))] hover:underline">
              governance@aicomplyr.io
            </a>
            {' '}or{' '}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--brand-teal))] hover:underline">
              connect on LinkedIn
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ConversionFunnelSection;
