import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Award, 
  CheckCircle, 
  Building2, 
  Globe, 
  Users, 
  Star,
  ExternalLink,
  Verified,
  Lock,
  FileText,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Certification {
  id: string;
  name: string;
  logo: string;
  description: string;
  verificationUrl?: string;
  status: 'active' | 'pending' | 'renewal';
  validUntil: string;
  scope: string[];
}

interface CustomerTestimonial {
  id: string;
  company: string;
  companySize: 'Fortune 10' | 'Fortune 100' | 'Fortune 500' | 'Global Pharma';
  industry: string;
  quote: string;
  metrics: {
    timeSaved: string;
    costSaved: string;
    auditSuccess: string;
  };
  anonymized: boolean;
  therapeuticArea?: string;
  logo?: string;
}

const certifications: Certification[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    logo: '🛡️',
    description: 'Security, availability, and confidentiality controls audited annually',
    verificationUrl: 'https://verify.aicpa.org/soc2',
    status: 'active',
    validUntil: '2025-12-31',
    scope: ['Security', 'Availability', 'Confidentiality', 'Processing Integrity']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    logo: '🏆',
    description: 'International standard for information security management',
    verificationUrl: 'https://iso.org/verify',
    status: 'active',
    validUntil: '2026-06-30',
    scope: ['Information Security', 'Risk Management', 'Business Continuity']
  },
  {
    id: 'hipaa',
    name: 'HIPAA Compliant',
    logo: '🏥',
    description: 'Healthcare data protection and privacy standards',
    status: 'active',
    validUntil: 'Ongoing',
    scope: ['Data Privacy', 'Healthcare Security', 'Patient Data Protection']
  },
  {
    id: 'fda',
    name: 'FDA 21 CFR Part 11',
    logo: '⚕️',
    description: 'Electronic records and signatures compliance validation',
    status: 'active',
    validUntil: 'Continuous',
    scope: ['Electronic Records', 'Digital Signatures', 'Audit Trails']
  }
];

const customerTestimonials: CustomerTestimonial[] = [
  {
    id: 'pharma1',
    company: 'Global Biopharmaceutical Leader',
    companySize: 'Fortune 10',
    industry: 'Pharmaceutical',
    quote: 'aicomply.io reduced our AI tool approval time from 8 weeks to 2 weeks, enabling faster innovation while maintaining 100% regulatory compliance.',
    metrics: {
      timeSaved: '75% faster approvals',
      costSaved: '$24M annually',
      auditSuccess: '100% FDA readiness'
    },
    anonymized: true,
    therapeuticArea: 'Oncology & Immunology'
  },
  {
    id: 'pharma2',
    company: 'Top 5 Pharmaceutical Company',
    companySize: 'Fortune 100',
    industry: 'Pharmaceutical',
    quote: 'The real-time compliance monitoring gave us confidence to scale AI across 47 clinical trials simultaneously.',
    metrics: {
      timeSaved: '60% reduction in review cycles',
      costSaved: '$18M operational savings',
      auditSuccess: '100% audit success'
    },
    anonymized: true,
    therapeuticArea: 'Cardiovascular & Metabolic'
  },
  {
    id: 'biotech1',
    company: 'Leading Biotech Innovator',
    companySize: 'Fortune 500',
    industry: 'Biotechnology',
    quote: 'aicomply.io\'s meta-loop validation helped us identify and fix compliance gaps before they became audit findings.',
    metrics: {
      timeSaved: '45 days saved per audit',
      costSaved: '$12M risk avoidance',
      auditSuccess: '98% compliance score'
    },
    anonymized: true,
    therapeuticArea: 'Rare Diseases'
  }
];

interface TrustBuildingDisplayProps {
  layout?: 'carousel' | 'grid' | 'compact';
  showCertifications?: boolean;
  showTestimonials?: boolean;
  showMetrics?: boolean;
  autoRotate?: boolean;
}

const TrustBuildingDisplay: React.FC<TrustBuildingDisplayProps> = ({
  layout = 'grid',
  showCertifications = true,
  showTestimonials = true,
  showMetrics = true,
  autoRotate = true
}) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeCertification, setActiveCertification] = useState(null);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!autoRotate || !showTestimonials) return;

    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % customerTestimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [autoRotate, showTestimonials]);

  const handleVerifyCertification = (cert: Certification) => {
    if (cert.verificationUrl) {
      window.open(cert.verificationUrl, '_blank', 'noopener,noreferrer');
    }
    setActiveCertification(cert.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'pending': return 'text-warning';
      case 'renewal': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getCompanySizeColor = (size: string) => {
    switch (size) {
      case 'Fortune 10': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'Fortune 100': return 'bg-gradient-to-r from-blue-500 to-purple-600';
      case 'Fortune 500': return 'bg-gradient-to-r from-green-500 to-teal-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Security Certifications Section */}
      {showCertifications && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Security & Compliance Certifications
            </h3>
            <p className="text-muted-foreground">Enterprise-grade security you can verify</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                className="group relative p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleVerifyCertification(cert)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{cert.logo}</div>
                  <h4 className="font-semibold text-foreground mb-2">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{cert.description}</p>
                  
                  <div className="space-y-2">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(cert.status)}`}
                    >
                      {cert.status === 'active' ? '✓ Active' : cert.status}
                    </Badge>
                    
                    <div className="text-xs text-muted-foreground">
                      Valid until: {cert.validUntil}
                    </div>
                  </div>

                  {cert.verificationUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Verify
                    </Button>
                  )}
                </div>

                {/* Detailed scope on hover */}
                <motion.div
                  className="absolute inset-0 bg-card border border-primary/50 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  initial={false}
                >
                  <div className="text-center">
                    <h5 className="font-semibold text-foreground mb-2">{cert.name}</h5>
                    <div className="space-y-1">
                      {cert.scope.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-success" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Success Showcase */}
      {showTestimonials && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Trusted by Industry Leaders
            </h3>
            <p className="text-muted-foreground">Real results from Fortune 500 pharmaceutical companies</p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                className="bg-card border border-border rounded-xl p-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                {customerTestimonials.map((testimonial, index) => (
                  index === activeTestimonial && (
                    <div key={testimonial.id} className="space-y-6">
                      {/* Company Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {testimonial.company}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={`text-white ${getCompanySizeColor(testimonial.companySize)}`}
                            >
                              {testimonial.companySize}
                            </Badge>
                            {testimonial.therapeuticArea && (
                              <Badge variant="outline">
                                {testimonial.therapeuticArea}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-warning">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <div className="text-sm text-muted-foreground">Verified Customer</div>
                        </div>
                      </div>

                      {/* Quote */}
                      <blockquote className="text-lg text-foreground/90 italic border-l-4 border-primary pl-4">
                        "{testimonial.quote}"
                      </blockquote>

                      {/* Metrics */}
                      {showMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                            <div className="text-2xl font-bold text-success">
                              {testimonial.metrics.timeSaved}
                            </div>
                            <div className="text-sm text-muted-foreground">Time Savings</div>
                          </div>
                          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="text-2xl font-bold text-primary">
                              {testimonial.metrics.costSaved}
                            </div>
                            <div className="text-sm text-muted-foreground">Cost Savings</div>
                          </div>
                          <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                            <div className="text-2xl font-bold text-warning">
                              {testimonial.metrics.auditSuccess}
                            </div>
                            <div className="text-sm text-muted-foreground">Audit Success</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {customerTestimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeTestimonial 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Building2 className="w-5 h-5" />
            <span className="text-2xl font-bold">150+</span>
          </div>
          <div className="text-sm text-muted-foreground">Fortune 500 Companies</div>
          <div className="text-xs text-success mt-1">✓ Currently active</div>
        </div>

        <div className="text-center p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Globe className="w-5 h-5" />
            <span className="text-2xl font-bold">47</span>
          </div>
          <div className="text-sm text-muted-foreground">Countries Deployed</div>
          <div className="text-xs text-success mt-1">✓ Global compliance</div>
        </div>

        <div className="text-center p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Award className="w-5 h-5" />
            <span className="text-2xl font-bold">99.8%</span>
          </div>
          <div className="text-sm text-muted-foreground">Uptime SLA</div>
          <div className="text-xs text-success mt-1">✓ Enterprise grade</div>
        </div>
      </div>
    </div>
  );
};

export default TrustBuildingDisplay;