import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';

const FinalCTASection = () => {
  return (
    <section className="py-16 lg:py-24 bg-brand-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark mb-6">
              Ready to See What Real AI Governance Looks Like?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Don't take our word for it. See our governance in action and understand why transparency beats promises every time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 text-lg font-semibold group shadow-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white px-8 py-4 text-lg font-semibold"
              >
                See Live Proof
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right column - Small hummingbird */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <img 
                src="/lovable-uploads/6c824f1c-3c1d-4b77-bbc7-30efd21ec6ab.png" 
                alt="AI Governance" 
                className="w-64 h-auto opacity-80"
              />
              {/* Small floating elements */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-brand-teal rounded-full animate-pulse"></div>
              <div className="absolute bottom-8 left-4 w-2 h-2 bg-brand-coral rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;