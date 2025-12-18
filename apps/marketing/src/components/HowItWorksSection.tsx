
import React from 'react';
import { Upload, Cpu, UserCheck, BarChart3 } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Submit',
      description: 'Upload documents, policies, or requests through our intuitive interface or API integrations.',
      color: 'bg-teal'
    },
    {
      icon: Cpu,
      title: 'Auto-Prechecks',
      description: 'Deterministic routing and policy validation against your compliance framework and regulatory requirements.',
      color: 'bg-orange'
    },
    {
      icon: UserCheck,
      title: 'Human Approval',
      description: 'People decide—qualified experts review and approve with full audit trails. Platform documents and orchestrates.',
      color: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Monitor & Scale',
      description: 'Real-time dashboards track compliance status while the system learns and improves continuously.',
      color: 'bg-green-500'
    }
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From submission to approval in four simple steps, powered by agentic AI and human expertise.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-teal via-orange to-green-500 transform -translate-y-1/2 z-0"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-teal/5 to-orange/5 rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Average Processing Time: <span className="text-teal">2.3 minutes</span>
            </h3>
            <p className="text-gray-600 text-lg">
              What used to take days now happens in minutes, with the same level of accuracy and oversight.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
