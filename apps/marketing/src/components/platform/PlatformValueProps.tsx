
import React from 'react';
import { CheckCircle2, Users, BarChart3 } from 'lucide-react';

const PlatformValueProps = () => {
  const valueProps = [
    {
      icon: CheckCircle2,
      title: "Automated Checks",
      description: "AI copilots perform comprehensive compliance checks in seconds, not weeks. Catch issues before they become problems."
    },
    {
      icon: Users,
      title: "Human-in-Loop",
      description: "Critical decisions always include human oversight. Your team maintains control while AI handles the heavy lifting."
    },
    {
      icon: BarChart3,
      title: "All-in-One Dashboard",
      description: "Monitor compliance status, review AI decisions, and track performance metrics from a single, beautiful interface."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why Teams Choose Our Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for compliance professionals who need speed, accuracy, and complete transparency in their AI governance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-6">
                <prop.icon className="h-6 w-6 text-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{prop.title}</h3>
              <p className="text-gray-600 leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformValueProps;
