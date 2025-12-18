
import React from 'react';
import { Lock, Plug, Code, Eye } from 'lucide-react';

const DeepFeatures = () => {
  const features = [
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "SOC 2 Type II certified with end-to-end encryption, role-based access controls, and comprehensive audit logging."
    },
    {
      icon: Plug,
      title: "Seamless Integrations",
      description: "Connect with your existing tools via REST APIs, webhooks, and pre-built integrations with popular platforms."
    },
    {
      icon: Code,
      title: "Developer-First API",
      description: "Comprehensive API documentation, SDKs in multiple languages, and sandbox environments for testing."
    },
    {
      icon: Eye,
      title: "Full Explainability",
      description: "Complete transparency into AI decision-making with detailed explanations, confidence scores, and reasoning paths."
    }
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Built for Enterprise Requirements
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade security, integrations, and transparency features that scale with your organization.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
            >
              <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Video/Demo Section */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-teal/5 to-orange/5 rounded-2xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                See It In Action
              </h3>
              <p className="text-lg text-gray-600">
                Watch our 3-minute demo to see how easy compliance can be.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                </div>
                <p className="text-white/80">Platform Demo Video</p>
                <p className="text-white/60 text-sm">Click to play (3 min)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeepFeatures;
