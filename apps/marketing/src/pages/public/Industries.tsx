import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Shield, 
  FileText, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Industries: React.FC = () => {
  const industries = [
    {
      name: 'Pharmaceutical',
      icon: <Building className="h-8 w-8" />,
      description: 'FDA compliance for AI in drug development and clinical trials',
      regulations: ['21 CFR Part 11', 'GxP', 'ALCOA+', 'EU MDR'],
      challenges: [
        'AI validation for clinical data',
        'Electronic signature compliance',
        'Audit trail requirements',
        'Data integrity standards'
      ],
      savings: '$2.8B',
      timeReduction: '60%',
      riskReduction: '85%'
    },
    {
      name: 'Medical Devices',
      icon: <Shield className="h-8 w-8" />,
      description: 'FDA Software as Medical Device (SaMD) compliance',
      regulations: ['ISO 14155', 'ISO 27001', 'FDA SaMD', 'EU MDR'],
      challenges: [
        'Software classification',
        'Risk management',
        'Clinical evaluation',
        'Post-market surveillance'
      ],
      savings: '$1.2B',
      timeReduction: '45%',
      riskReduction: '78%'
    },
    {
      name: 'Financial Services',
      icon: <TrendingUp className="h-8 w-8" />,
      description: 'AI governance for trading, lending, and risk management',
      regulations: ['SOX', 'Basel III', 'MiFID II', 'GDPR'],
      challenges: [
        'Algorithmic trading compliance',
        'Model risk management',
        'Fair lending practices',
        'Data privacy requirements'
      ],
      savings: '$850M',
      timeReduction: '55%',
      riskReduction: '72%'
    },
    {
      name: 'Healthcare',
      icon: <Users className="h-8 w-8" />,
      description: 'HIPAA and clinical AI compliance for healthcare providers',
      regulations: ['HIPAA', 'HITECH', 'FDA AI/ML', 'State Privacy'],
      challenges: [
        'Patient data protection',
        'AI diagnostic tools',
        'Clinical decision support',
        'Interoperability standards'
      ],
      savings: '$650M',
      timeReduction: '50%',
      riskReduction: '80%'
    }
  ];

  return (
    <StandardPageLayout
      title="Industry Solutions"
      description="Specialized AI compliance solutions for regulated industries"
    >
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Industry-Specific AI Compliance
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Navigate complex regulatory requirements with confidence. Our platform provides 
            tailored compliance solutions for the most regulated industries.
          </p>
        </div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {industries.map((industry, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    {industry.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{industry.name}</CardTitle>
                    <CardDescription className="text-lg">{industry.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Regulations */}
                <div>
                  <h4 className="font-semibold mb-3">Key Regulations</h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.regulations.map((reg, i) => (
                      <Badge key={i} variant="outline">{reg}</Badge>
                    ))}
                  </div>
                </div>

                {/* Compliance Challenges */}
                <div>
                  <h4 className="font-semibold mb-3">Common Challenges</h4>
                  <div className="space-y-2">
                    {industry.challenges.map((challenge, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{challenge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{industry.savings}</div>
                    <div className="text-xs text-muted-foreground">Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{industry.timeReduction}</div>
                    <div className="text-xs text-muted-foreground">Time Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{industry.riskReduction}</div>
                    <div className="text-xs text-muted-foreground">Risk Reduction</div>
                  </div>
                </div>

                <Button className="w-full group/btn">
                  Learn More About {industry.name}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cross-Industry Benefits */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary-glow/5">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Universal Benefits</CardTitle>
            <CardDescription className="text-lg">
              Regardless of your industry, aicomply.io delivers consistent value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Automated Documentation</h3>
                <p className="text-muted-foreground">
                  Generate compliance documentation automatically as you build
                </p>
              </div>
              <div className="text-center space-y-3">
                <Shield className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Real-Time Monitoring</h3>
                <p className="text-muted-foreground">
                  Continuous compliance monitoring and risk assessment
                </p>
              </div>
              <div className="text-center space-y-3">
                <TrendingUp className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Scalable Platform</h3>
                <p className="text-muted-foreground">
                  Grows with your organization and regulatory changes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-12">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Schedule a demo to see how aicomply.io can address your industry's specific compliance challenges
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Schedule Industry Demo
            </Button>
            <Button size="lg" variant="outline">
              Download Industry Guide
            </Button>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default Industries;