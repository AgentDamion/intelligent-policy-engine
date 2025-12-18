import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield } from 'lucide-react';

const GameChanger = () => {
  return (
    <section className="py-16 lg:py-24 bg-brand-section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            From AI Tool Discovery to Regulatory Approval<br />
            in <span className="text-brand-teal">4 Days</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mt-4">
            AI tool-centric workflow with agentic AI orchestration—automated, deterministic, and audit-ready
          </p>
        </div>

        <div className="space-y-24">
          {/* Step 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
                  AI Tool Discovery
                </h3>
              </div>
              
              <h4 className="text-xl lg:text-2xl text-brand-coral font-semibold">
                (Automatic Detection)
              </h4>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Automatically detect ChatGPT, Jasper, Claude, and 500+ AI tools used across your enterprise. Real-time visibility into every AI tool vendor and usage pattern.
              </p>
              
              <Badge variant="secondary" className="text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-1" />
                500+ tools tracked
              </Badge>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-card rounded-lg border border-border overflow-hidden shadow-lg">
                <img 
                  src="/lovable-uploads/2156740a-4c56-44ec-b3b7-208445d86768.png" 
                  alt="Streamlined AI tool submission workflow showing tool identification form and real-time compliance scoring"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative lg:order-1">
              <div className="aspect-video bg-card rounded-lg border border-border overflow-hidden shadow-lg">
                <img 
                  src="/lovable-uploads/fa12a0c0-786c-4b1b-afa6-c370474f4b7f.png" 
                  alt="Enterprise Compliance Dashboard showing real-time compliance monitoring, policy management, and audit trails"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            
            <div className="space-y-6 lg:order-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Automated Approval
                </h3>
              </div>
              
              <h4 className="text-xl lg:text-2xl text-brand-teal font-semibold">
                (90% Auto-Approval Rate)
              </h4>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Deterministic compliance pipelines map AI tools to FDA 21 CFR Part 11, GDPR Article 22, and SOC 2 frameworks. Approvals in 4 days instead of 47.
              </p>
              
              <Badge variant="secondary" className="text-sm font-medium">
                <Shield className="w-4 h-4 mr-1" />
                10.7x faster approvals
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameChanger;