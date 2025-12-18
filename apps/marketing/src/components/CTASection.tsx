
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-r from-teal to-teal/90 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to Bridge Your AI Compliance Gap?
          </h2>
          <p className="text-xl lg:text-2xl text-teal-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of companies using aicomplyr.io to automate compliance while maintaining complete control and transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-teal hover:bg-gray-50 px-8 py-4 text-lg font-semibold hover-scale group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-teal px-8 py-4 text-lg font-semibold hover-scale"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book a Demo
            </Button>
          </div>

          {/* Additional info */}
          <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
            <div className="p-4">
              <div className="text-sm text-teal-200 mb-1">Setup Time</div>
              <div className="text-2xl font-bold">Under 5 minutes</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-teal-200 mb-1">Free Trial</div>
              <div className="text-2xl font-bold">30 days</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-teal-200 mb-1">Support</div>
              <div className="text-2xl font-bold">24/7 Expert Help</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
