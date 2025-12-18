import React from 'react';
import { ArrowRight, Eye, Zap, Shield, Clock } from 'lucide-react';

const PlatformOverview = () => {
  const workflowSteps = [
    {
      number: "01",
      title: "Policy Setup",
      description: "Define governance policies",
      icon: Shield,
      color: "bg-brand-teal"
    },
    {
      number: "02", 
      title: "Review Intake",
      description: "AI governance automatically reviews",
      icon: Eye,
      color: "bg-brand-green"
    },
    {
      number: "03",
      title: "Real-time Monitoring", 
      description: "Agentic AI compliance copilots monitor",
      icon: Clock,
      color: "bg-brand-coral"
    },
    {
      number: "04",
      title: "Proof Generation",
      description: "Compliance evidence documented",
      icon: Zap,
      color: "bg-brand-purple"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-brand-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6 font-heading">
            Simple workflow, sophisticated platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            A simple flow on the surface, powered by sophisticated agentic AI underneath.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {workflowSteps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-400 mb-2">{step.number}</div>
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300"></div>
                )}
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Backend AI Orchestration Hint */}
        <div className="bg-brand-warm-white rounded-lg p-8 text-center">
          <div className="text-sm text-gray-500 mb-2">Behind the scenes</div>
          <div className="text-lg text-brand-dark font-medium">
            Sophisticated agentic AI orchestration powers every step
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformOverview;