
import React from 'react';
import { Upload, Scan, UserCheck, Monitor } from 'lucide-react';

const PlatformWorkflow = () => {
  const steps = [
    {
      icon: Upload,
      title: "Submit AI System",
      description: "Upload your AI model, documentation, and use case details through our intuitive interface."
    },
    {
      icon: Scan,
      title: "Automated Analysis",
      description: "Our agentic AI copilots perform comprehensive compliance checks across all relevant regulations."
    },
    {
      icon: UserCheck,
      title: "Human Review",
      description: "Expert reviewers validate AI findings, add context, and make final approval decisions."
    },
    {
      icon: Monitor,
      title: "Continuous Monitoring",
      description: "Ongoing monitoring ensures compliance as your AI systems evolve and regulations change."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            From Submission to Approval in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our streamlined workflow combines AI automation with human expertise for faster, more reliable compliance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-teal to-teal/20 transform translate-x-4"></div>
              )}
              
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative z-10">
                <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <step.icon className="h-6 w-6 text-teal" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
                
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-teal-light/30 border border-teal/20 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-gray-700 font-medium">
              Average processing time reduced from 3 weeks to 15 minutes with our agentic AI approach.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformWorkflow;
