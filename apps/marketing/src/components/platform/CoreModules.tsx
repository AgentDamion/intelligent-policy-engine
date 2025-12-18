
import React from 'react';
import { Bot, Shield, Users, Store, Activity } from 'lucide-react';

const CoreModules = () => {
  const modules = [
    {
      icon: Bot,
      title: "Agentic AI Copilots",
      description: "Intelligent agents that understand your compliance requirements and automatically assess AI systems against regulations, policies, and best practices.",
      features: ["Automated risk assessment", "Policy compliance checking", "Continuous monitoring", "Smart recommendations"],
      imageAlt: "AI Copilot Dashboard"
    },
    {
      icon: Shield,
      title: "Policy Engine",
      description: "Centralized policy management that translates complex regulations into actionable rules your AI copilots can understand and enforce.",
      features: ["Regulatory mapping", "Custom policy creation", "Version control", "Impact analysis"],
      imageAlt: "Policy Engine Interface"
    },
    {
      icon: Users,
      title: "Agency & Vendor Portal",
      description: "Collaborative workspace for external stakeholders to review submissions, provide feedback, and track approval status in real-time.",
      features: ["Secure document sharing", "Review workflows", "Communication tools", "Status tracking"],
      imageAlt: "Agency Portal Dashboard"
    },
    {
      icon: Store,
      title: "Compliance Marketplace",
      description: "Pre-built compliance templates, risk assessment frameworks, and industry-specific policies from our community of experts.",
      features: ["Industry templates", "Expert frameworks", "Community sharing", "Custom modifications"],
      imageAlt: "Marketplace Interface"
    },
    {
      icon: Activity,
      title: "Live Audit & Monitoring",
      description: "Real-time compliance monitoring with detailed audit trails, performance metrics, and automated reporting for stakeholders.",
      features: ["Real-time monitoring", "Audit trail generation", "Performance analytics", "Automated reporting"],
      imageAlt: "Monitoring Dashboard"
    }
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Five Powerful Modules, One Seamless Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each module works independently or together to create a comprehensive compliance ecosystem.
          </p>
        </div>

        <div className="space-y-24">
          {modules.map((module, index) => (
            <div 
              key={index}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Text Content */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-6">
                  <module.icon className="h-6 w-6 text-teal" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {module.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {module.description}
                </p>
                <ul className="space-y-3">
                  {module.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-teal rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image/Visual */}
              <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 aspect-[4/3] flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="ml-2 text-xs text-gray-500">{module.imageAlt}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-16 bg-teal/10 rounded"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-8 bg-gray-100 rounded"></div>
                        <div className="h-8 bg-orange/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreModules;
