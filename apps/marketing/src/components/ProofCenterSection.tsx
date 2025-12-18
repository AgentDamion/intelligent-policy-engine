import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Quote } from 'lucide-react';

const ProofCenterSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-brand-section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6 font-heading">
            Operational Proof: Governance That Proves Itself
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            More than RBAC and audit logs—a governance ecosystem that proves itself.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Meta-Loop Validation */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-4">Meta-Loop Validation</h3>
            <p className="text-gray-600 mb-4">
              Our agentic AI uses the same platform it governs to continuously validate its own compliance decisions.
            </p>
            <div className="text-sm text-gray-500">Always up to date</div>
          </div>

          {/* Self-Documenting Proof */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-4">Self-Documenting Proof</h3>
            <p className="text-gray-600 mb-4">
              Every governance decision automatically generates compliance documentation and audit trails.
            </p>
            <div className="text-sm text-gray-500">Zero manual overhead</div>
          </div>

          {/* Live Proof Center */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-4">Live Proof Center</h3>
            <p className="text-gray-600 mb-4">
              Watch real governance decisions happen in real-time with full transparency and traceability.
            </p>
            <div className="text-sm text-gray-500">Updated every 30 seconds</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProofCenterSection;