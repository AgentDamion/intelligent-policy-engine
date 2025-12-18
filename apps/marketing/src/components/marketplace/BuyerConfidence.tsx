
import React from 'react';
import { CheckCircle2, Shield, FileText, Activity } from 'lucide-react';

const BuyerConfidence = () => {
  const features = [
    {
      icon: CheckCircle2,
      title: 'Only compliance-verified tools are listed',
      description: 'Every tool undergoes rigorous agentic AI verification before appearing in the marketplace'
    },
    {
      icon: Shield,
      title: 'All listings show last agentic check and human signoff',
      description: 'Complete transparency on when tools were last verified and who approved them'
    },
    {
      icon: Activity,
      title: 'Transparent incident history—no hidden risks',
      description: 'Full visibility into any compliance incidents or issues that have been identified'
    },
    {
      icon: FileText,
      title: 'Detailed audit logs for every status change',
      description: 'Complete audit trail of all verification activities and status updates'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Agentic Confidence for Every Purchase
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center">
                <feature.icon className="h-6 w-6 text-teal" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuyerConfidence;
