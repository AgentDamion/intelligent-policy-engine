import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VERAOrb } from '@/components/vera/VERAOrb';

const steps = [
  {
    number: '1',
    title: 'Policy in',
    description: 'You define how AI tools can be used on your brand.'
  },
  {
    number: '2',
    title: 'VERA Evaluates',
    description: 'VERA checks every AI tool request against your policies in real-time, recommending ALLOW, BLOCK, or ESCALATE to human review.'
  },
  {
    number: '3',
    title: 'Proof out',
    description: 'Every use is logged as an audit-ready Proof Bundle.'
  }
];

export const OneSimpleFlow = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-foreground mb-4 font-solution">
          One simple flow from policy to proof
        </h2>
        
        {/* Three Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground italic mb-16">
          We govern AI tools and usage events — not your marketing content.
        </p>

        {/* VERA Introduction Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-lg flex items-center justify-center border border-primary/20">
                <span className="text-3xl font-bold text-gray-700">V</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-base text-foreground leading-relaxed mb-4">
                <span className="font-semibold">VERA</span> is the autonomous governance agent powering every decision. She evaluates requests in milliseconds and generates cryptographic proof.
              </p>
              <Link 
                to="/vera" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              >
                Meet VERA <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneSimpleFlow;










