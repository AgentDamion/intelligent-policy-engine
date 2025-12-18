import React from 'react';
import { Eye, Zap, Shield, Brain, Heart } from 'lucide-react';

const DifferentiatorsSection = () => {
  const differentiators = [
    {
      icon: Eye,
      title: "Transparent",
      description: "See every decision",
      color: "bg-brand-teal"
    },
    {
      icon: Zap,
      title: "Real-Time",
      description: "Live governance monitoring",
      color: "bg-brand-coral"
    },
    {
      icon: Shield,
      title: "Compliant",
      description: "Built-in regulatory alignment",
      color: "bg-brand-green"
    },
    {
      icon: Brain,
      title: "Intelligent",
      description: "AI-powered policy enforcement",
      color: "bg-brand-purple"
    },
    {
      icon: Heart,
      title: "Trusted",
      description: "Proven in production",
      color: "bg-brand-orange"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6">
            What Makes Us Different
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're the only AI governance platform that proves its effectiveness through complete transparency.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-12">
          {differentiators.map((item, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className={`w-24 h-24 ${item.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <item.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-center text-sm">
                {item.description}
              </p>
              
              {/* Connecting line (except for last item) */}
              {index < differentiators.length - 1 && (
                <div className="hidden lg:block absolute h-0.5 w-16 bg-gray-300 mt-12" 
                     style={{ left: 'calc(50% + 48px)' }}>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dotted connecting line */}
        <div className="hidden lg:block relative mt-8">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 border-t-2 border-dashed border-gray-300"></div>
        </div>
      </div>
    </section>
  );
};

export default DifferentiatorsSection;