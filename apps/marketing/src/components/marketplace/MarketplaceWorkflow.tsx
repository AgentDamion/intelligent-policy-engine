
import React from 'react';

const MarketplaceWorkflow = () => {
  const steps = [
    {
      number: '01',
      title: 'Vendors submit AI tools for review',
      description: 'AI solution providers submit their tools with documentation and compliance information'
    },
    {
      number: '02',
      title: 'Agentic AI copilots map compliance requirements',
      description: 'Our AI copilots analyze documentation, features, and updates against compliance frameworks'
    },
    {
      number: '03',
      title: 'Human experts validate findings',
      description: 'Before any listing goes live, human experts review and validate all agentic AI findings'
    },
    {
      number: '04',
      title: 'Continuous monitoring & flagging',
      description: 'Listings are continuously monitored by agentic AI and flagged for any changes or incidents'
    },
    {
      number: '05',
      title: 'Enterprise access with full auditability',
      description: 'Enterprises can request tools, track status, and get full auditability—no surprises, ever'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            How the Agentic Marketplace Works
          </h2>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-teal/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-teal">{step.number}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block w-8 h-0.5 bg-gray-300 flex-shrink-0 ml-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceWorkflow;
