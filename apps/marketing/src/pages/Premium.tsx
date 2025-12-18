import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Calendar, Award } from 'lucide-react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import PremiumHero from '@/components/premium/PremiumHero';
import PremiumFeatures from '@/components/premium/PremiumFeatures';
import ROICalculator from '@/components/premium/ROICalculator';
import PremiumCTA from '@/components/premium/PremiumCTA';
import NewFooter from '@/components/NewFooter';

const PremiumFooterCTA = () => (
  <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white py-12 border-t border-slate-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Premium Badge and CTA */}
        <div className="text-center lg:text-left">
          <motion.div 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 backdrop-blur-sm border border-yellow-400/30 text-yellow-300 px-4 py-2 rounded-full font-semibold text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Award className="w-4 h-4" />
            PREMIUM ENTERPRISE SOLUTION
          </motion.div>
          
          <h3 className="text-2xl lg:text-3xl font-bold mb-2">
            Ready to Transform Your AI Governance?
          </h3>
          <p className="text-slate-300 text-lg">
            Join Fortune 500 companies using premium features to stay ahead
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-6 py-3 font-semibold group shadow-xl"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Executive Demo
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-6 py-3 font-semibold group"
          >
            <Shield className="mr-2 h-5 w-5" />
            View Security Details
          </Button>
        </div>
      </div>

      {/* Enterprise Features Banner */}
      <div className="mt-8 pt-8 border-t border-white/20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Enterprise SLA', value: '99.9%' },
            { label: 'Implementation', value: '30 Days' },
            { label: 'Support', value: '24/7' },
            { label: 'Compliance Rate', value: '100%' }
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-2xl font-bold text-yellow-400 mb-1">{item.value}</div>
              <div className="text-sm text-slate-300">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Premium = () => {
  return (
    <div className="min-h-screen bg-brand-warm-white">
      <MarketingHeader />
      <PremiumHero />
      <PremiumFeatures />
      <ROICalculator />
      <PremiumCTA />
      <NewFooter />
    </div>
  );
};

export default Premium;