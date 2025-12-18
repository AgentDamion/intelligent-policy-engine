import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';
import VideoModal from '@/components/common/VideoModal';

const FinalCTABand = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="py-16 lg:py-20 bg-gradient-to-r from-brand-dark to-slate-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              See How Leading Enterprises{' '}
              <span className="text-brand-coral">Cut AI Tool Approval Times</span>
            </h2>
            
            <div className="text-xl text-gray-300 mb-6 leading-relaxed">
              <p>Join the founding cohort of pharmaceutical and financial services companies transforming AI tool governance from weeks to days—with verifiable proof at every step.</p>
            </div>

            <p className="text-lg text-gray-300 mb-8 font-semibold">
              12 founding customer spots • Infrastructure-grade governance • You maintain full control
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild
                size="lg" 
                className="bg-brand-teal hover:bg-brand-teal/90 text-primary-foreground px-8 py-4 text-lg font-semibold group"
              >
                <Link to={routes.contact}>
                  Request Beta Access
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline-light" 
                onClick={() => setIsVideoOpen(true)}
                className="px-8 py-4 text-lg font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                Calculate Your ROI
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-teal rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-brand-coral rounded-full blur-3xl"></div>
        </div>
      </section>

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        title="2-Minute Demo Video"
      />
    </>
  );
};

export default FinalCTABand;