
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-brand-warm-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold text-brand-dark mb-6 leading-tight font-heading">
            Prove AI Compliance{' '}
            <span className="text-brand-teal">in Real Time</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 mb-6 leading-relaxed">
            Human-in-the-loop—people decide; platform documents and orchestrates. Real-time compliance proof at the speed of your business. Every call. Every choice. Every impact.
          </p>
          
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            The only platform that shows you exactly what it's doing, how it's staying compliant, and why you can trust it to scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-3"
            >
              Watch Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3"
            >
              View Proof Center
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
