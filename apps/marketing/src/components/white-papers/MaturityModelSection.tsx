import React from 'react';
import { Button } from '@/components/ui/button';

const MaturityModelSection = () => {
  const stages = [
    {
      number: 1,
      title: 'REACTIVE',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      numberBadgeColor: 'bg-red-500',
      badgeColor: 'bg-red-600',
      symptoms: [
        '❌ No formal AI policy',
        '❌ Post-hoc compliance',
        '❌ Zero agency visibility'
      ],
      status: 'CRITICAL RISK',
      nextStep: 'Start with: Paper #1'
    },
    {
      number: 2,
      title: 'DOCUMENTED',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      numberBadgeColor: 'bg-orange-500',
      badgeColor: 'bg-orange-600',
      symptoms: [
        '✅ Written AI policy exists',
        '⚠️ But it\'s a PDF, not enforced',
        '❌ No third-party visibility'
      ],
      status: 'HIGH RISK',
      nextStep: 'Next step: Paper #2'
    },
    {
      number: 3,
      title: 'ENFORCED',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      numberBadgeColor: 'bg-yellow-500',
      badgeColor: 'bg-yellow-600',
      symptoms: [
        '✅ Runtime policy enforcement',
        '✅ Some agency oversight',
        '⚠️ Evidence takes hours'
      ],
      status: 'MODERATE RISK',
      nextStep: 'Level up: Paper #3'
    },
    {
      number: 4,
      title: 'OPTIMIZED',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      numberBadgeColor: 'bg-green-500',
      badgeColor: 'bg-green-600',
      symptoms: [
        '✅ Full supply chain visibility',
        '✅ Automated proof bundles',
        '✅ Audit response in minutes'
      ],
      status: 'LOW RISK',
      nextStep: 'You\'re ready for: Founding Cohort'
    }
  ];

  return (
    <section id="maturity" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Where Are You on the Governance Maturity Curve?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Diagnose your current state and see which paper addresses your immediate need:
          </p>
        </div>

        {/* Maturity model image - LARGE */}
        <div className="mb-12">
          <picture>
            <source srcSet="/images/maturity-model.webp" type="image/webp" />
            <img 
              src="/images/maturity-model.png" 
              alt="Four-stage AI governance maturity model: Reactive (red/critical), Documented (orange/warning), Enforced (yellow/progressing), Optimized (green/goal state)"
              className="w-full max-w-5xl mx-auto rounded-xl shadow-2xl"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        {/* Interactive stage cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          {stages.map((stage) => (
            <div 
              key={stage.number}
              className={`${stage.bgColor} border-2 ${stage.borderColor} rounded-lg p-5 hover:shadow-lg transition cursor-pointer`}
            >
              <div className="text-center mb-3">
                <div className={`w-12 h-12 ${stage.numberBadgeColor} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3`}>
                  {stage.number}
                </div>
                <h4 className="text-lg font-bold text-gray-900">{stage.title}</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                {stage.symptoms.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
              <div className="text-center">
                <span className={`inline-block ${stage.badgeColor} text-white text-xs px-3 py-1 rounded-full font-bold uppercase`}>
                  {stage.status}
                </span>
              </div>
              <p className="text-xs text-center text-gray-600 mt-3">
                <strong>{stage.nextStep}</strong>
              </p>
            </div>
          ))}

        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not sure which stage you're in?</p>
          <Button className="bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white px-8 py-3">
            Book a Governance Lab Assessment
          </Button>
        </div>

      </div>
    </section>
  );
};

export default MaturityModelSection;
