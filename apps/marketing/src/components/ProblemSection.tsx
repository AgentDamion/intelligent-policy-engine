import React from 'react';
import { AlertTriangle, Clock, DollarSign, Shield } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Blind Spot Risk",
      description: "You can't manage what you can't see. Most AI governance tools promise visibility but deliver dashboards full of meaningless metrics.",
      color: "bg-brand-coral"
    },
    {
      icon: Clock,
      title: "Compliance Theater",
      description: "Endless audits, documentation, and checkbox exercises that consume resources without actually reducing risk or improving outcomes.",
      color: "bg-brand-orange"
    },
    {
      icon: DollarSign,
      title: "Hidden Costs",
      description: "AI failures in production cost enterprises an average of $2.8M per incident. The real cost isn't the technology—it's the lack of governance.",
      color: "bg-brand-purple"
    },
    {
      icon: Shield,
      title: "Trust Deficit",
      description: "Stakeholders demand proof, not promises. Legacy governance solutions can't demonstrate their effectiveness in real-time.",
      color: "bg-brand-green"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-brand-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6">
            The $50B AI Governance Gap
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprises are losing billions because traditional AI governance tools create the illusion of control without delivering real transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-16 h-16 ${problem.color} rounded-lg flex items-center justify-center mb-6`}>
                <problem.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-4">
                {problem.title}
              </h3>
              <p className="text-gray-600">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;