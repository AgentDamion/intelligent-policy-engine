import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Lock, Globe, Zap, Users, FileText, Eye, Settings, Crown } from 'lucide-react';

const Pricing = () => {
  const pricingTiers = [
    {
      name: 'Foundation',
      price: 'Custom',
      period: 'Pricing',
      description: 'Perfect for growing organizations establishing AI governance',
      features: [
        'Up to 10 partners',
        'Basic policy engine',
        'Standard audit trails',
        'Email support',
        'Core compliance reporting',
        'Basic dashboard analytics'
      ],
      cta: 'Contact Sales',
      ctaType: 'secondary',
      popular: false
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Pricing',
      description: 'Advanced governance for established enterprises',
      features: [
        'Up to 50 partners',
        'Advanced workflows',
        'Real-time monitoring',
        'Custom integrations',
        'Priority support',
        'Advanced analytics',
        'Custom policy templates',
        'API access'
      ],
      cta: 'Contact Sales',
      ctaType: 'primary',
      popular: true
    },
    {
      name: 'Network Command',
      price: 'Custom',
      period: 'Pricing',
      description: 'Enterprise-scale governance for global organizations',
      features: [
        'Unlimited partners',
        'Multi-region policies',
        'AI-powered agents',
        'White-label portals',
        'Dedicated CSM',
        'Custom development',
        'On-premise deployment',
        'Advanced security features'
      ],
      cta: 'Contact Sales',
      ctaType: 'primary',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'What level of security does aicomplyr.io provide?',
      answer: 'We maintain SOC 2 Type II compliance, ISO 27001 certification, and enterprise-grade encryption. All data is encrypted in transit and at rest with AES-256 encryption.'
    },
    {
      question: 'Can I integrate with existing compliance systems?',
      answer: 'Yes, our platform offers extensive API integrations with popular compliance, governance, and monitoring tools including Salesforce, ServiceNow, and custom enterprise systems.'
    },
    {
      question: 'What happens if I exceed my partner limit?',
      answer: 'We provide flexible scaling options. Contact our sales team to discuss upgrade paths or custom pricing for your specific needs.'
    },
    {
      question: 'Is there a setup fee or onboarding cost?',
      answer: 'Setup and onboarding are included with Enterprise and Network Command plans. Foundation plans include self-service onboarding with optional professional services.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'Foundation includes email support, Enterprise includes priority support with 4-hour response time, and Network Command includes dedicated customer success management.'
    }
  ];

  const securityBadges = [
    { name: 'SOC 2 Type II', icon: Shield },
    { name: 'ISO 27001', icon: Lock },
    { name: 'GDPR Compliant', icon: Globe },
    { name: 'Enterprise Security', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise AI Governance
              <span className="text-primary block">That Scales With You</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transparent, auditable pricing for organizations that demand the highest standards 
              in AI compliance and governance.
            </p>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={tier.name} 
                  className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-4 mb-8">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${tier.ctaType === 'primary' ? 'bg-primary hover:bg-primary/90' : 'variant-secondary'}`}
                      variant={tier.ctaType === 'primary' ? 'default' : 'secondary'}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Enterprise-Grade Security</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {securityBadges.map((badge, index) => (
                <div key={index} className="flex flex-col items-center p-6 bg-card rounded-lg">
                  <badge.icon className="h-8 w-8 text-primary mb-3" />
                  <span className="text-sm font-medium text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Trusted by Industry Leaders</h2>
            <p className="text-muted-foreground mb-12">
              Fortune 500 companies trust aicomplyr.io for mission-critical AI governance
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-sm font-medium">Global Pharma</span>
              </div>
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-sm font-medium">Major Bank</span>
              </div>
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-sm font-medium">Tech Giant</span>
              </div>
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-sm font-medium">Healthcare System</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your AI Governance?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join leading organizations in establishing transparent, auditable AI practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <NewFooter />
    </div>
  );
};

export default Pricing;