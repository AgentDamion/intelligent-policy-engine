import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Shield, BookOpen, CheckCircle } from 'lucide-react';

export default function EvidenceLibrary() {
  const evidencePackages = [
    {
      icon: Shield,
      title: 'FDA Audit Preparation Package',
      description: 'Complete compliance documentation for pharmaceutical AI applications',
      includes: ['21 CFR 820 mappings', 'Validation protocols', 'Risk assessments'],
      size: '15 MB',
      format: 'PDF Bundle',
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'GDPR Compliance Templates',
      description: 'Privacy-by-design documentation and data protection impact assessments',
      includes: ['Article 35 DPIAs', 'Consent mechanisms', 'Data mapping'],
      size: '8 MB',
      format: 'Word + PDF',
      color: 'bg-green-500'
    },
    {
      icon: BookOpen,
      title: 'ISO 13485 Framework',
      description: 'Medical device quality management system documentation',
      includes: ['Process maps', 'Control procedures', 'Validation plans'],
      size: '12 MB',
      format: 'PDF + Excel',
      color: 'bg-purple-500'
    },
    {
      icon: CheckCircle,
      title: 'SOC 2 Type II Evidence',
      description: 'Security and availability controls documentation',
      includes: ['Control descriptions', 'Testing procedures', 'Evidence samples'],
      size: '20 MB',
      format: 'PDF Bundle',
      color: 'bg-orange-500'
    }
  ];

  const caseStudies = [
    {
      title: 'Pharma Content Generation Governance',
      company: 'Global Pharmaceutical Company',
      challenge: 'Ensuring AI-generated marketing content meets FDA requirements',
      outcome: '99.8% compliance rate, 60% faster review process',
      downloadUrl: '/case-study-pharma.pdf'
    },
    {
      title: 'Medical Device AI Validation',
      company: 'MedTech Startup',
      challenge: 'Validating ML models for diagnostic applications under FDA 510(k)',
      outcome: 'Successful FDA submission, 40% reduction in validation time',
      downloadUrl: '/case-study-medtech.pdf'
    },
    {
      title: 'Clinical Data Privacy Compliance',
      company: 'Healthcare Research Institute',
      challenge: 'Managing patient data across international jurisdictions',
      outcome: 'GDPR + HIPAA compliance achieved, zero privacy incidents',
      downloadUrl: '/case-study-privacy.pdf'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Evidence Library
          </h2>
          <p className="text-lg text-muted-foreground">
            Downloadable compliance packages, templates, and real-world case studies
          </p>
        </div>

        {/* Compliance Packages */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Downloadable Compliance Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evidencePackages.map((pkg, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${pkg.color} flex items-center justify-center`}>
                      <pkg.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pkg.title}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pkg.size}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pkg.format}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{pkg.description}</p>
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Includes:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Package
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Case Studies */}
        <div>
          <h3 className="text-2xl font-bold mb-8">Real-World Case Studies</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {study.company}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">Challenge:</div>
                      <p className="text-sm mt-1">{study.challenge}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">Outcome:</div>
                      <p className="text-sm mt-1 font-medium text-green-600">{study.outcome}</p>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={study.downloadUrl} download>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Case Study
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">
                Need Custom Compliance Documentation?
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Our team can create tailored compliance packages specific to your industry, 
                regulations, and use cases.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="text-lg px-8 py-6">
                  Request Custom Package
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Schedule Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}