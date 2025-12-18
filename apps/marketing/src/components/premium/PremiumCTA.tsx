import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Calculator, CalendarClock, PhoneCall, ShieldCheck } from 'lucide-react';

const PremiumCTA = () => {
  return (
    <section className="bg-brand-warm-white py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Headline - oversized */}
        <motion.h2 
          className="text-5xl md:text-7xl font-black text-brand-dark mb-8 tracking-tight leading-none"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Ready to Experience Enterprise AI Governance?
        </motion.h2>
        
        {/* Subtitle with generous spacing */}
        <motion.p 
          className="text-xl text-brand-dark/60 max-w-4xl mx-auto mb-16 font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Fortune 500 leaders are transforming compliance into competitive advantage with aicomplyr.io
        </motion.p>
        
        {/* PlayerZero-style buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button 
            size="lg" 
            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-10 py-4 text-lg font-bold rounded-xl group shadow-none"
          >
            <Calendar className="mr-3 h-5 w-5" />
            Schedule Executive Demo
            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-brand-dark/20 text-brand-dark hover:bg-brand-dark/5 px-10 py-4 text-lg font-bold rounded-xl shadow-none"
          >
            <Calculator className="mr-3 h-5 w-5" />
            Calculate Your ROI
          </Button>
        </motion.div>
        
        {/* Three inline proof stats - flat design */}
        <motion.div 
          className="flex flex-col md:flex-row gap-12 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { icon: CalendarClock, label: '30 Days', sublabel: 'Implementation' },
            { icon: PhoneCall, label: '24/7', sublabel: 'Enterprise Support' },
            { icon: ShieldCheck, label: '100%', sublabel: 'Compliance Audit Trail' }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-teal rounded-xl flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black text-brand-dark">{stat.label}</div>
                  <div className="text-sm text-brand-dark/60 font-medium">{stat.sublabel}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumCTA;