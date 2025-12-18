import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import cascadingFailureImg from '@/assets/white-papers/cascading-failure.png';

const RiskCascadeSection = () => {
  const failures = [
    {
      id: 1,
      title: 'Failure #1: Policy Without Enforcement',
      borderColor: 'border-slate-700',
      symptoms: [
        'Agencies use 47+ unapproved AI tools',
        'PDF policies gather dust',
        'Compliance becomes post-hoc theater'
      ],
      solvedBy: 'White Paper #1 (Executable Policy)'
    },
    {
      id: 2,
      title: 'Failure #2: Zero Third-Party Visibility',
      borderColor: 'border-[hsl(var(--brand-teal))]',
      symptoms: [
        '100% liable, 0% control over agency AI',
        'Multi-client policy conflicts unmanaged',
        'Shadow AI spreading unchecked'
      ],
      solvedBy: 'White Paper #2 (Supply Chain Visibility)'
    },
    {
      id: 3,
      title: 'Result: The Audit Nightmare',
      borderColor: 'border-amber-500',
      isResult: true,
      symptoms: [
        'Cannot respond to FDA Form 483 requests',
        'Evidence assembly: 15-20 hours per audit',
        'MLR cycle times doubled since AI adoption',
        'No tamper-proof proof bundles'
      ],
      solvedBy: 'White Paper #3 (The Proof Layer)'
    }
  ];

  return (
    <section id="risk-cascade" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 uppercase tracking-tight text-gray-900">
            Cascading Failure
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI governance doesn't fail in one place. It fails in three interconnected ways—
            and each amplifies the others.
          </p>
        </div>

        {/* HERO IMAGE - Large and dramatic */}
        <div className="mb-16">
          <img 
            src="/images/cascading-failure.png" 
            alt="Three failures cascade: No Executable Policy leads to Zero Supply Chain Visibility leads to The Proof Crisis"
            className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl"
          />
        </div>

        {/* Explanation cards BELOW image */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Failure 1 */}
          <div className="bg-white border-l-4 border-slate-900 rounded-lg p-6 shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-3">❌</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Failure #1:<br/>No Executable Policy
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              PDF policies can't enforce at runtime. Compliance becomes post-hoc theater. 
              Agencies use 47+ unapproved AI tools without your knowledge.
            </p>
            <div className="text-sm text-[hsl(var(--brand-teal))] font-semibold">
              → Solved by: White Paper #1 (Executable Policy)
            </div>
          </div>

          {/* Failure 2 - with enterprise-problem.png */}
          <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6 shadow-md hover:shadow-lg transition">
            <div className="mb-4">
              <picture>
                <source srcSet="/images/enterprise-problem.webp" type="image/webp" />
                <img 
                  src="/images/enterprise-problem.png" 
                  alt="Risk liability diagram showing enterprise 100% liable while agency partners retain AI tool control"
                  className="w-full max-w-xs mx-auto rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <div className="text-4xl mb-3">❌</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Failure #2:<br/>Zero Supply Chain Visibility
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You remain <strong>100% liable</strong> for content created by agencies 
              using AI tools you don't control, can't see, and can't audit.
            </p>
            <div className="text-sm text-[hsl(var(--brand-teal))] font-semibold">
              → Solved by: White Paper #2 (AI Supply Chain Visibility)
            </div>
          </div>

          {/* Crisis Result */}
          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Result:<br/>The Proof Crisis
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Cannot respond to FDA Form 483 requests. Evidence assembly takes 15-20 hours 
              per audit. MLR cycle times doubled. No tamper-proof proof bundles.
            </p>
            <div className="text-sm text-amber-800 font-semibold">
              → Solved by: White Paper #3 (The Proof Layer)
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <h4 className="text-2xl font-bold mb-3 text-gray-900">
            Download the Complete Framework to Prevent This Cascade
          </h4>
          <button className="bg-[hsl(var(--brand-teal))] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[hsl(var(--brand-teal))]/90 transition">
            Get All 3 Papers →
          </button>
          <p className="text-sm text-gray-500 mt-3">Or start with just Paper #1</p>
        </div>
      </div>
    </section>
  );
};

export default RiskCascadeSection;
