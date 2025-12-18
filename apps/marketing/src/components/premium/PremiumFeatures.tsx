import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart3, RefreshCw, Network } from 'lucide-react';

const PremiumFeatures = () => {
  const differentiators = [
    {
      title: "Policy Engine at Scale",
      icon: Shield,
      description: "Enterprise-grade policy management with granular control and multi-tenant architecture for complex organizational structures."
    },
    {
      title: "Real-Time Compliance Monitoring", 
      icon: BarChart3,
      description: "Live insights into AI decision-making across your organization with instant alerts and comprehensive audit trails."
    },
    {
      title: "Meta-Loop Proof Advantage",
      icon: RefreshCw,
      description: "Self-improving compliance through continuous learning and adaptive policy evolution based on organizational patterns."
    },
    {
      title: "Enterprise-Grade Integration",
      icon: Network,
      description: "Seamless integration with existing enterprise infrastructure including SSO, data warehouses, and API-first architecture."
    }
  ];

  return (
    <section className="py-32 bg-brand-section-alt">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section header with generous spacing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-black text-brand-dark mb-6 tracking-tight">
            Enterprise Differentiators
          </h2>
          <p className="text-xl text-brand-dark/60 max-w-3xl mx-auto font-light">
            Built for Fortune 500 compliance requirements and enterprise-scale governance
          </p>
        </motion.div>

        {/* Four wide differentiator rows */}
        <div className="space-y-8">
          {differentiators.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="flex items-start gap-8 py-8">
                  {/* Flat icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-brand-teal rounded-2xl flex items-center justify-center group-hover:bg-brand-teal/90 transition-colors">
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-lg text-brand-dark/70 leading-relaxed max-w-4xl">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                {/* Thin divider - except for last item */}
                {index < differentiators.length - 1 && (
                  <div className="border-b border-brand-taupe-dark/30" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PremiumFeatures;