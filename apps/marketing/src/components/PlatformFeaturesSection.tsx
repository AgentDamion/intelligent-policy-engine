
import React from 'react';
import { Bot, FileText, Globe, ShoppingCart, FileCheck, Settings } from 'lucide-react';

const PlatformFeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: 'Agentic AI Copilots',
      description: 'Intelligent agents that learn your compliance patterns and make autonomous decisions within defined parameters.',
      gradient: 'bg-gradient-to-br from-teal/10 to-teal/5'
    },
    {
      icon: FileText,
      title: 'Policy Engine',
      description: 'Centralized policy management with version control, automated updates, and conflict detection.',
      gradient: 'bg-gradient-to-br from-orange/10 to-orange/5'
    },
    {
      icon: Globe,
      title: 'Agency Portal',
      description: 'Dedicated interfaces for regulatory agencies with secure access and real-time collaboration tools.',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-blue-500/5'
    },
    {
      icon: ShoppingCart,
      title: 'Marketplace',
      description: 'Access pre-built compliance modules and templates from industry experts and regulatory bodies.',
      gradient: 'bg-gradient-to-br from-green-500/10 to-green-500/5'
    },
    {
      icon: FileCheck,
      title: 'Audit Trails',
      description: 'Complete audit trails with immutable records, decision reasoning, and compliance documentation.',
      gradient: 'bg-gradient-to-br from-purple-500/10 to-purple-500/5'
    },
    {
      icon: Settings,
      title: 'Custom Integrations',
      description: 'RESTful APIs and webhooks for seamless integration with your existing compliance infrastructure.',
      gradient: 'bg-gradient-to-br from-gray-500/10 to-gray-500/5'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Platform Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to automate compliance while maintaining control and transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.gradient} p-8 rounded-xl hover:shadow-lg transition-all duration-300 hover-scale`}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                  <feature.icon className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Need a Custom Feature?
            </h3>
            <p className="text-gray-600 mb-6">
              Our platform is built for extensibility. We can customize features to match your specific compliance requirements.
            </p>
            <button className="bg-teal hover:bg-teal/90 text-white px-8 py-3 rounded-lg font-medium hover-scale transition-all duration-200">
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformFeaturesSection;
