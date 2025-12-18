import React from 'react';
import { Building2, Briefcase, Users } from 'lucide-react';

const WhoWeHelpSection = () => {
  const ecosystemFeatures = [
    {
      icon: Building2,
      title: "Enterprise Policy Capital",
      description: "Your AI governance decisions and policies become valuable assets that can be leveraged across the organization.",
      features: [
        "Policy asset management",
        "Cross-department governance sharing", 
        "Compliance value creation"
      ]
    },
    {
      icon: Briefcase,
      title: "Partner Operations Hub",
      description: "Turn compliance into a competitive advantage by seamlessly integrating governance across business partners.",
      features: [
        "Partner compliance verification",
        "Shared governance standards",
        "Joint audit capabilities"
      ]
    },
    {
      icon: Users,
      title: "What-If AI Tool Marketplace",
      description: "Deploy pre-validated AI tools with built-in compliance frameworks, reducing risk and time to value.",
      features: [
        "Pre-compliance AI tools",
        "Risk-assessed deployment",
        "Instant governance coverage"
      ]
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-brand-warm-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6 font-heading">
            More Than Compliance — A Growing Ecosystem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            An AI governance platform where compliance creates value, not friction.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {ecosystemFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-teal rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-brand-dark mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {feature.features.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center text-brand-dark">
                    <div className="w-2 h-2 bg-brand-teal rounded-full mr-3"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoWeHelpSection;